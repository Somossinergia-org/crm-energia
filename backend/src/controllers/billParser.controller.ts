import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractEnergyBillFromText, extractEnergyBillFromImage } from '../services/gemini.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

// Multer config for temporary PDF upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `bill_${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const uploadBill = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos PDF'));
    }
  },
}).single('factura');

export const uploadBillOrPhoto = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan PDF o imágenes (JPG, PNG, WEBP)'));
    }
  },
}).single('factura');

// ========================================
// PARSER DE FACTURAS ELECTRICAS ESPANOLAS
// ========================================
// Soporta formatos de: Endesa, Iberdrola, Naturgy, Repsol, EDP, Holaluz, etc.
// Las facturas espanolas siguen una estructura regulada con terminos estandar.

interface ParsedBill {
  // Datos generales
  comercializadora: string | null;
  cups: string | null;
  tarifa: string | null;
  periodoFacturacion: { desde: string | null; hasta: string | null; dias: number | null };

  // Potencias contratadas (kW) por periodo
  potencias: number[];

  // Consumos (kWh) por periodo
  consumos: number[];

  // Precios energia (EUR/kWh) por periodo
  preciosEnergia: number[];

  // Importes desglosados
  importePotencia: number | null;
  importeEnergia: number | null;
  importeTotal: number | null;

  // Reactiva
  tieneReactiva: boolean;
  importeReactiva: number | null;
  cosPhi: number | null;
  energiaReactiva: number | null;

  // Impuestos
  impuestoElectrico: number | null;
  iva: number | null;

  // Alquiler contador
  alquilerContador: number | null;

  // Modalidad
  modalidad: string | null; // 'fijo' | 'indexado'

  // Confianza del parseo
  confianza: number; // 0-100
  camposExtraidos: string[];
  advertencias: string[];

  // Texto raw (para debug)
  textoExtraido?: string;
}

function parseBillText(text: string): ParsedBill {
  const result: ParsedBill = {
    comercializadora: null,
    cups: null,
    tarifa: null,
    periodoFacturacion: { desde: null, hasta: null, dias: null },
    potencias: [],
    consumos: [],
    preciosEnergia: [],
    importePotencia: null,
    importeEnergia: null,
    importeTotal: null,
    tieneReactiva: false,
    importeReactiva: null,
    cosPhi: null,
    energiaReactiva: null,
    impuestoElectrico: null,
    iva: null,
    alquilerContador: null,
    modalidad: null,
    confianza: 0,
    camposExtraidos: [],
    advertencias: [],
  };

  // Normalizar texto
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = t.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const tLower = t.toLowerCase();

  // === COMERCIALIZADORA ===
  const comercializadoras: [RegExp, string][] = [
    [/endesa\s*energ[ií]a/i, 'Endesa Energia'],
    [/iberdrola\s*(clientes|generaci[oó]n)/i, 'Iberdrola'],
    [/naturgy\s*(clientes|iberia|energ[ií]a)/i, 'Naturgy'],
    [/repsol\s*(electricidad|energ[ií]a|luz)/i, 'Repsol'],
    [/edp\s*(energ[ií]a|comercializadora)/i, 'EDP'],
    [/holaluz/i, 'Holaluz'],
    [/factor\s*energ[ií]a/i, 'Factor Energia'],
    [/aldro\s*energ[ií]a/i, 'Aldro Energia'],
    [/total\s*energ[ií]es/i, 'TotalEnergies'],
    [/som\s*energia/i, 'Som Energia'],
    [/lucera/i, 'Lucera'],
    [/podo/i, 'Podo'],
    [/octopus/i, 'Octopus Energy'],
    [/fenie\s*energ[ií]a/i, 'Fenie Energia'],
    [/nabalia/i, 'Nabalia Energia'],
    [/curenergia/i, 'CUR Energia'],
    [/energya/i, 'Energya'],
    [/nexus\s*energ[ií]a/i, 'Nexus Energia'],
    [/el[ée]ctrica\s*de\s*c[aá]diz/i, 'Electrica de Cadiz'],
    [/axpo/i, 'Axpo'],
    [/audax/i, 'Audax Energia'],
  ];
  for (const [re, name] of comercializadoras) {
    if (re.test(t)) {
      result.comercializadora = name;
      result.camposExtraidos.push('comercializadora');
      break;
    }
  }

  // === CUPS ===
  // CUPS formato: ES + 4 digitos distribuidora + 12 digitos punto + 2 letras control + opcionalmente 2 chars sufijo (0F, 1F, etc.)
  // Preferir el que aparece despues de "CUPS:" para no confundir con referencias SEPA
  const cupsLabelMatch = t.match(/CUPS[:\s]+(ES\d{16}[A-Z0-9]{2}(?:[A-Z0-9]{1,2})?)/i);
  if (cupsLabelMatch) {
    result.cups = cupsLabelMatch[1];
    result.camposExtraidos.push('cups');
  } else {
    // Buscar CUPS suelto pero solo si tiene formato valido (20-22 chars, termina en letra+digito tipo 0F)
    const cupsMatch = t.match(/ES\d{16}[A-Z]{2}\d[A-Z]/);
    if (cupsMatch) {
      result.cups = cupsMatch[0];
      result.camposExtraidos.push('cups');
    } else {
      // Fallback: cualquier patron ES + 16 digitos + 2-4 alfanumericos
      const cupsFallback = t.match(/ES\d{16}[A-Z0-9]{2,4}/);
      if (cupsFallback) {
        result.cups = cupsFallback[0];
        result.camposExtraidos.push('cups');
      }
    }
  }

  // === TARIFA ===
  const tarifaPatterns = [
    /tarifa[:\s]*(\d\.\d\s*TD)/i,
    /(2\.0\s*TD|3\.0\s*TD|6\.1\s*TD|6\.2\s*TD|6\.3\s*TD|6\.4\s*TD)/i,
    /peaje[:\s]*(2\.0\s*TD|3\.0\s*TD|6\.\d\s*TD)/i,
    /acceso[:\s]*(2\.0\s*TD|3\.0\s*TD|6\.\d\s*TD)/i,
  ];
  for (const pattern of tarifaPatterns) {
    const m = t.match(pattern);
    if (m) {
      result.tarifa = m[1].replace(/\s/g, '');
      result.camposExtraidos.push('tarifa');
      break;
    }
  }

  // === PERIODO FACTURACION ===
  const periodoPatterns = [
    // "del 01/10/2025 al 31/10/2025" (puede haber saltos de linea)
    /del\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+al?\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /per[ií]odo[\s\S]{0,30}?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*(?:a|al?|-|hasta)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /desde[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*hasta[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*[-–]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
  ];
  for (const pattern of periodoPatterns) {
    const m = t.match(pattern);
    if (m) {
      result.periodoFacturacion.desde = m[1];
      result.periodoFacturacion.hasta = m[2];
      // Calcular dias
      try {
        const parseFecha = (s: string) => {
          const parts = s.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const d = parseInt(parts[0]), mo = parseInt(parts[1]);
            let y = parseInt(parts[2]);
            if (y < 100) y += 2000;
            return new Date(y, mo - 1, d);
          }
          return null;
        };
        const d1 = parseFecha(m[1]);
        const d2 = parseFecha(m[2]);
        if (d1 && d2) {
          // Billing periods are inclusive: 01/11 to 30/11 = 30 days
          result.periodoFacturacion.dias = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
      } catch { /* ignore */ }
      result.camposExtraidos.push('periodo');
      break;
    }
  }

  // Si no se pudieron calcular los dias, buscar "XX días" en el texto
  if (!result.periodoFacturacion.dias) {
    const diasMatch = t.match(/(\d{1,3})\s*d[ií]as/i);
    if (diasMatch) {
      const dias = parseInt(diasMatch[1]);
      if (dias > 0 && dias <= 366) {
        result.periodoFacturacion.dias = dias;
      }
    }
  }

  // === POTENCIA CONTRATADA ===
  const potenciasFound: number[] = [];

  // Estrategia 1: Buscar "Px: XX,XXX kW" en la seccion "Termino de potencia" (Energya VM, Endesa, etc.)
  // Formato: "P1: 15,000 kW x 30 días x 0,078882 €/kW/día."
  // Naturgy usa "Término potencia" (sin "de"), Energya VM usa "Término de potencia"
  const potTerminoIdx = Math.max(
    tLower.indexOf('término de potencia'),
    tLower.indexOf('termino de potencia'),
    tLower.indexOf('término potencia'),
    tLower.indexOf('termino potencia')
  );
  if (potTerminoIdx >= 0) {
    const potTerminoSection = t.substring(potTerminoIdx, potTerminoIdx + 800);
    for (let p = 1; p <= 6; p++) {
      const pMatch = potTerminoSection.match(new RegExp(`P${p}[:\\s]+(\\d+[\\.,]\\d{1,3})\\s*kW`, 'i'));
      if (pMatch) {
        potenciasFound.push(parseFloat(pMatch[1].replace(',', '.')));
      }
    }
  }

  // Estrategia 2: Tabla "Potencia contratada" con valores en linea
  // Energya VM page 2: "kW 15,000 20,000 20,000 20,000 20,000 20,000\nPotencia contratada"
  // Or: "Potencia contratada kW 15,000 20,000 20,000 20,000 20,000 20,000"
  if (potenciasFound.length === 0) {
    const potContratadaIdx = tLower.indexOf('potencia contratada');
    if (potContratadaIdx >= 0) {
      // Look in a wider window around "potencia contratada" (before and after)
      const potStart = Math.max(0, potContratadaIdx - 200);
      const potSection = t.substring(potStart, potContratadaIdx + 400);

      // Look for lines with multiple decimal numbers (kW values)
      // e.g. "kW 15,000 20,000 20,000 20,000 20,000 20,000"
      const kwLineMatch = potSection.match(/kW\s+([\d,.\s]+)/i);
      if (kwLineMatch) {
        const nums = kwLineMatch[1].match(/\d+[\.,]\d{1,3}/g);
        if (nums) {
          for (const n of nums) {
            const val = parseFloat(n.replace(',', '.'));
            if (val > 0 && val < 10000) potenciasFound.push(val);
          }
        }
      }

      // Fallback: search for "P1: XX kW" individual patterns
      if (potenciasFound.length === 0) {
        for (let p = 1; p <= 6; p++) {
          const pMatch = potSection.match(new RegExp(`P${p}[:\\s]+(\\d+[\\.,]?\\d*)\\s*kW`, 'i'));
          if (pMatch) {
            potenciasFound.push(parseFloat(pMatch[1].replace(',', '.')));
          }
        }
      }
    }
  }

  // Estrategia 3: Naturgy format - "Potencia contratada P1: 9,900 kW"
  if (potenciasFound.length === 0) {
    const potAllMatches = t.match(/[Pp]otencia\s*contratada\s*P\d[:\s]*(\d+[\.,]\d{1,3})\s*kW/g);
    if (potAllMatches) {
      for (const pm of potAllMatches) {
        const val = pm.match(/(\d+[\.,]\d{1,3})\s*kW/i);
        if (val) potenciasFound.push(parseFloat(val[1].replace(',', '.')));
      }
    }
  }

  if (potenciasFound.length > 0) {
    result.potencias = potenciasFound;
    result.camposExtraidos.push('potencias');
  }

  // === CONSUMOS POR PERIODO ===
  const consumosFound: number[] = [];

  // Estrategia 1: Buscar seccion "lecturas" con tabla Punta/Llano/Valle
  // Naturgy PDF text format (no spaces between columns):
  //   "31/10/2025Punta real32.76633 kWh"
  //   reading=32.766 consumption=33 kWh
  //   "31/10/2025Llano real31.88825 kWh"
  //   reading=31.888 consumption=25 kWh
  const lecturasIdx = Math.max(
    tLower.indexOf('consumo a facturar'),
    tLower.indexOf('consumos facturados'),
    tLower.indexOf('lecturas y tus'),
    tLower.indexOf('n.º de contador'),
    tLower.indexOf('n.° de contador')
  );
  if (lecturasIdx >= 0) {
    const lecturasSection = t.substring(lecturasIdx, lecturasIdx + 800);
    // Naturgy concatenates columns without spaces:
    //   "31/10/2025Punta real32.76633 kWh"  → reading=32.766, consumption=33
    //   "31/10/2025Llano real31.88825 kWh"  → reading=31.888, consumption=25
    //   "31/10/2025Valle real15.89136 kWh"  → reading=15.891, consumption=36
    // The reading uses dots as thousands separator (32.766 = 32766)
    // The consumption follows immediately: "32.76633" = "32.766" + "33"

    // Strategy: find "Punta/Llano/Valle real" followed by a number block ending in "kWh"
    // Then split: the reading has dots (e.g. 32.766) and consumption is the remaining digits
    const readingPattern = /(?:Punta|Llano|Valle|P[1-6])\s*(?:real|estimad[oa])?\s*([\d.]+)\s*kWh/gi;
    let rm;
    while ((rm = readingPattern.exec(lecturasSection)) !== null) {
      const rawNum = rm[1]; // e.g. "32.76633" or "15.89136"

      // Check if this contains a reading+consumption concatenated
      // Readings have dots as thousands separators: XX.XXX
      // Try to find where reading ends and consumption starts
      const dotIdx = rawNum.lastIndexOf('.');
      if (dotIdx >= 0 && dotIdx < rawNum.length - 3) {
        // Has a dot with more than 3 digits after it → concatenated
        // Reading ends 3 digits after the dot (thousands group)
        const consumoStr = rawNum.substring(dotIdx + 4); // digits after the reading
        const val = parseInt(consumoStr);
        if (val > 0 && val < 100000) consumosFound.push(val);
      } else {
        // Simple number, no concatenation
        const val = parseFloat(rawNum.replace(',', '.'));
        if (val > 0 && val < 100000) consumosFound.push(val);
      }
    }

    // Remove the last entry if it equals the sum of others (it's "Total consumo")
    if (consumosFound.length > 1) {
      const total = consumosFound[consumosFound.length - 1];
      const sumOthers = consumosFound.slice(0, -1).reduce((a, b) => a + b, 0);
      if (Math.abs(total - sumOthers) <= 1) {
        consumosFound.pop();
      }
    }
  }

  // Estrategia 2: Tabla "Consumo kWh 0,00 654,00 238,00 0,00 0,00 995,00" (Energya VM, etc.)
  if (consumosFound.length === 0) {
    const consumoKwhMatch = t.match(/Consumo\s+kWh\s+([\d,.\s]+)/i);
    if (consumoKwhMatch) {
      const nums = consumoKwhMatch[1].match(/\d+[\.,]\d{1,2}/g);
      if (nums) {
        for (const n of nums) {
          const val = parseFloat(n.replace('.', '').replace(',', '.'));
          consumosFound.push(val);
        }
      }
    }
  }

  // Estrategia 3: "PX: XXX,XX kWh, Precio: ..." (Energya VM detalle factura)
  if (consumosFound.length === 0) {
    const pConsumoPattern = /P(\d)[:\s]+(\d+[\.,]\d{1,2})\s*kWh\s*,?\s*[Pp]recio/g;
    let pcm;
    const consumosByPeriodo: { [key: number]: number } = {};
    while ((pcm = pConsumoPattern.exec(t)) !== null) {
      const periodo = parseInt(pcm[1]);
      const val = parseFloat(pcm[2].replace('.', '').replace(',', '.'));
      consumosByPeriodo[periodo] = val;
    }
    // Fill in all 6 periods for 3.0TD/6.1TD
    if (Object.keys(consumosByPeriodo).length > 0) {
      const maxP = Math.max(...Object.keys(consumosByPeriodo).map(Number));
      for (let p = 1; p <= maxP; p++) {
        consumosFound.push(consumosByPeriodo[p] || 0);
      }
    }
  }

  // Estrategia 4: Buscar "XX kWh" despues de Punta/Llano/Valle keywords
  if (consumosFound.length === 0) {
    const periodoNames = ['punta', 'llano', 'valle'];
    for (const pName of periodoNames) {
      const pIdx = tLower.lastIndexOf(pName);
      if (pIdx >= 0) {
        const afterPeriodo = t.substring(pIdx, pIdx + 200);
        const kwhMatch = afterPeriodo.match(/(\d+)\s*kWh/i);
        if (kwhMatch) {
          const val = parseInt(kwhMatch[1]);
          if (val > 0 && val < 999999 && !consumosFound.includes(val)) {
            consumosFound.push(val);
          }
        }
      }
    }
  }

  // Estrategia 5: Buscar seccion de energia activa / termino de energia
  if (consumosFound.length === 0) {
    const eneIdx = Math.max(
      tLower.indexOf('energía activa'),
      tLower.indexOf('energia activa'),
    );
    if (eneIdx >= 0) {
      const eneSection = t.substring(eneIdx, eneIdx + 800);
      const kwhMatches = eneSection.match(/(\d+[\.,]?\d*)\s*kWh/gi);
      if (kwhMatches) {
        for (const m of kwhMatches) {
          const val = parseFloat(m.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (val > 0 && val < 999999) consumosFound.push(val);
        }
      }
    }
  }

  // Estrategia 6: Buscar "Consumo electricidad XX kWh" (precio unico, Naturgy)
  if (consumosFound.length === 0) {
    const consumoUnico = t.match(/consumo\s+electricidad\s*(\d+[\.,]?\d*)\s*kWh/i);
    if (consumoUnico) {
      consumosFound.push(parseFloat(consumoUnico[1].replace(',', '.')));
    }
  }

  if (consumosFound.length > 0) {
    result.consumos = consumosFound;
    result.camposExtraidos.push('consumos');
  }

  // === PRECIOS ENERGIA ===
  // Buscar precios en formato 0,XXXXXX €/kWh
  if (result.preciosEnergia.length === 0) {
    // Buscar en seccion detalle/calculo
    const detalleIdx = Math.max(
      tLower.indexOf('detalle'),
      tLower.indexOf('cálculo'),
      tLower.indexOf('calculo'),
      tLower.indexOf('consumo electricidad')
    );
    if (detalleIdx >= 0) {
      const detalleSection = t.substring(detalleIdx, detalleIdx + 1000);
      const precioPattern = /(\d+[\.,]\d{4,6})\s*(?:€|EUR|eur)?\s*(?:\/\s*kWh|€\/kWh)/gi;
      let pm;
      while ((pm = precioPattern.exec(detalleSection)) !== null) {
        const val = parseFloat(pm[1].replace(',', '.'));
        if (val > 0.01 && val < 0.5) result.preciosEnergia.push(val);
      }
    }
  }

  if (result.preciosEnergia.length > 0 && !result.camposExtraidos.includes('precios')) {
    result.camposExtraidos.push('precios');
  }

  // === PRECIOS POR PERIODO (busqueda alternativa) ===
  if (result.preciosEnergia.length === 0) {
    // Buscar precios en formato 0,XXXXXX
    const allPrices: number[] = [];
    const pricePattern = /(\d+[\.,]\d{4,6})\s*(?:€|EUR|eur)?(?:\s*\/\s*kWh|\s*kWh)/gi;
    let pm;
    while ((pm = pricePattern.exec(t)) !== null) {
      const val = parseFloat(pm[1].replace(',', '.'));
      if (val > 0.01 && val < 0.5) allPrices.push(val);
    }
    // Si tenemos precios plausibles de energia (entre 0.03 y 0.30 EUR/kWh)
    const validPrices = allPrices.filter(p => p >= 0.03 && p <= 0.30);
    if (validPrices.length > 0) {
      result.preciosEnergia = validPrices.slice(0, 6);
      result.camposExtraidos.push('precios');
    }
  }

  // === IMPORTES ===
  // Importe total factura
  const totalPatterns = [
    /total\s*(?:factura|importe)[:\s]*(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
    /importe\s*total[:\s]*(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
    /total\s*a\s*pagar[:\s]*(\d+[\.,]\d{2})/i,
    // Energya VM: "574,48 €\n Total factura" (amount before label)
    /(\d+[\.,]\d{2})\s*€\s*\n\s*Total\s*factura/i,
    // "TOTAL\n 574,48" (label then amount on next line)
    /\bTOTAL\s+(\d+[\.,]\d{2})\b/,
  ];
  for (const pattern of totalPatterns) {
    const m = t.match(pattern);
    if (m) {
      result.importeTotal = parseFloat(m[1].replace(',', '.'));
      result.camposExtraidos.push('importeTotal');
      break;
    }
  }

  // Importe termino potencia
  const potImportes: number[] = [];

  if (potTerminoIdx >= 0) {
    // Energya VM raw text layout:
    //   " 35,50\nTérmino de potencia\nP1: 15,000 kW x 30 días x 0,078882 €/kW/día."
    //   " 44,80P2: 20,000 kW x 30 días x 0,074679 €/kW/día."
    //   ...
    // First amount is BEFORE "Término de potencia" label, rest are prepended to P lines

    // Capture the amount just before the label
    const preAmountMatch = t.substring(Math.max(0, potTerminoIdx - 30), potTerminoIdx).match(/(\d+[\.,]\d{2})\s*$/);
    if (preAmountMatch) {
      potImportes.push(parseFloat(preAmountMatch[1].replace(',', '.')));
    }

    // Limit section to next label (Alquiler, Impuesto, etc.)
    const potAfterLabel = t.substring(potTerminoIdx + 20);
    const potEndMatch = potAfterLabel.search(/(?:Alquiler|Impuesto|Financiaci|Subtotal|Bono\s*Social|Base\s*imponible)/i);
    const potImporteSection = potEndMatch >= 0
      ? potAfterLabel.substring(0, potEndMatch)
      : potAfterLabel.substring(0, 600);

    // Capture amounts before P lines: "44,80P2:" or "44,80\nP2:"
    const potAmountPattern = /(\d+[\.,]\d{2})\s*\n?\s*P\d[:\s]+\d+[\.,]\d+\s*kW/g;
    let plm;
    while ((plm = potAmountPattern.exec(potImporteSection)) !== null) {
      potImportes.push(parseFloat(plm[1].replace(',', '.')));
    }

    // Naturgy format: "Término potencia P19,900 kWx 31 días x 0,108163 €/kW día33,20 €"
    // Each line ends with "XX,XX €" — capture all amounts ending in € within the section
    if (potImportes.length === 0) {
      const potNaturgyPattern = /€\/kW[\/\s]*d[ií]a\s*(\d+[\.,]\d{2})\s*€/g;
      let pnm;
      while ((pnm = potNaturgyPattern.exec(potImporteSection)) !== null) {
        potImportes.push(parseFloat(pnm[1].replace(',', '.')));
      }
    }
  }

  if (potImportes.length > 0) {
    result.importePotencia = potImportes.reduce((a, b) => a + b, 0);
    result.importePotencia = Math.round(result.importePotencia * 100) / 100;
    result.camposExtraidos.push('importePotencia');
  }

  // Importe termino energia
  // Energya VM: individual P lines under "Término de energía" with amounts
  // " 106,56\nTérmino de energía\nP2: 725,16 kWh..."
  // Also sum amounts from each P line
  const eneImportes: number[] = [];
  const eneTerminoIdx = Math.max(
    tLower.indexOf('término de energía'),
    tLower.indexOf('termino de energía'),
    tLower.indexOf('término de energia'),
    tLower.indexOf('termino de energia'),
    tLower.indexOf('término energía'),
    tLower.indexOf('termino energia')
  );
  if (eneTerminoIdx >= 0) {
    // Energya VM format: amounts BEFORE each P line:
    //   " 106,56\nTérmino de energía\nP2: 725,16 kWh, Precio: 0,146949 €/kWh."
    //   " 36,95P3: 281,72 kWh, Precio: 0,131169 €/kWh."
    //   " 112,57P6: 1135,60 kWh, Precio: 0,099130 €/kWh."

    // Capture the amount just before the label
    const enePreAmountMatch = t.substring(Math.max(0, eneTerminoIdx - 30), eneTerminoIdx).match(/(\d+[\.,]\d{2})\s*$/);
    if (enePreAmountMatch) {
      eneImportes.push(parseFloat(enePreAmountMatch[1].replace(',', '.')));
    }

    // Stop at next section
    const eneAfterLabel = t.substring(eneTerminoIdx + 20);
    const eneEndIdx = eneAfterLabel.search(/[Tt][ée]rmino\s*de\s*potencia|[Aa]lquiler|[Ii]mpuesto|[Ss]ubtotal|[Bb]ono/i);
    const eneSection = eneEndIdx >= 0
      ? eneAfterLabel.substring(0, eneEndIdx)
      : eneAfterLabel.substring(0, 500);

    // Pattern: amount before P line with kWh
    const eneAmountPattern = /(\d+[\.,]\d{2})\s*\n?\s*P\d[:\s]+\d+[\.,]\d+\s*kWh/g;
    let elm;
    while ((elm = eneAmountPattern.exec(eneSection)) !== null) {
      eneImportes.push(parseFloat(elm[1].replace(',', '.')));
    }

    // Naturgy format: "Consumo electricidad 94 kWh x 0,131666 €/kWh 12,38 €"
    if (eneImportes.length === 0) {
      const eneLinePattern2 = /(\d+[\.,]\d{2})\s*€\s*$/gm;
      let elm2;
      while ((elm2 = eneLinePattern2.exec(eneSection)) !== null) {
        eneImportes.push(parseFloat(elm2[1].replace(',', '.')));
      }
    }
  }

  if (eneImportes.length > 0) {
    result.importeEnergia = eneImportes.reduce((a, b) => a + b, 0);
    result.importeEnergia = Math.round(result.importeEnergia * 100) / 100;
    result.camposExtraidos.push('importeEnergia');
  } else {
    // Fallback patterns
    const eneImportePatterns = [
      /subtotal\s*energ[ií]a[\s\S]{0,50}?(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
      /consumo\s*electricidad[\s\S]{0,100}?(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
    ];
    for (const pattern of eneImportePatterns) {
      const m = t.match(pattern);
      if (m) {
        result.importeEnergia = parseFloat(m[1].replace(',', '.'));
        result.camposExtraidos.push('importeEnergia');
        break;
      }
    }
  }

  // === REACTIVA ===
  if (/reactiva/i.test(t)) {
    result.tieneReactiva = true;

    const reactivaImporte = t.match(/reactiva[\s\S]{0,200}?(\d+[\.,]\d{2})\s*(?:€|EUR)/i);
    if (reactivaImporte) {
      result.importeReactiva = parseFloat(reactivaImporte[1].replace(',', '.'));
      result.camposExtraidos.push('reactiva');
    }

    // cos phi
    const cosPhiMatch = t.match(/cos\s*(?:φ|phi|fi)[:\s]*(\d[\.,]\d+)/i);
    if (cosPhiMatch) {
      result.cosPhi = parseFloat(cosPhiMatch[1].replace(',', '.'));
      result.camposExtraidos.push('cosPhi');
    }

    // kVArh - Energya VM: "Consumo kVArh 0,00 182,00 59,00 0,00 0,00 344,00"
    const kvarLineMatch = t.match(/Consumo\s+kVArh\s+([\d,.\s]+)/i);
    if (kvarLineMatch) {
      const kvarNums = kvarLineMatch[1].match(/\d+[\.,]\d{1,2}/g);
      if (kvarNums) {
        const totalReactiva = kvarNums.reduce((sum, n) => sum + parseFloat(n.replace('.', '').replace(',', '.')), 0);
        result.energiaReactiva = totalReactiva;
      }
    } else {
      // Single value
      const kvarMatch = t.match(/(\d+[\.,]?\d*)\s*kVArh/i);
      if (kvarMatch) {
        result.energiaReactiva = parseFloat(kvarMatch[1].replace(',', '.'));
      }
    }
  }

  // === IMPUESTOS ===
  // Naturgy: "Impuesto electricidad 56,23 € x 5,112696 % 2,87 €"
  // Energya VM: " 22,52\nImpuestos eléctricos\n440,42€ x 5,11269632%"
  // En ambos casos queremos el importe del impuesto, no la base
  const ieePatterns = [
    // "Impuesto electricidad ... x 5,112696 % ... 2,87 €" (amount after %)
    /impuesto\s*(?:sobre\s*)?(?:la\s*)?electricidad[\s\S]{0,80}?x\s*\d+[\.,]\d+\s*%\s*(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
    // Energya VM: " 22,52\nImpuestos eléctricos" (amount on line before label)
    /(\d+[\.,]\d{2})\s*\n\s*[Ii]mpuestos?\s*el[ée]ctricos/,
    // "Impuestos eléctricos\n440,42€ x 5,11269632%" → calculate
    /[Ii]mpuestos?\s*el[ée]ctricos?\s*\n\s*(\d+[\.,]\d{2})\s*€?\s*x\s*(\d+[\.,]\d+)\s*%/,
    // "Impuesto electricidad ... 2,87 €" (last amount)
    /impuesto\s*(?:sobre\s*)?(?:la\s*)?electricidad[\s\S]{0,100}?(\d+[\.,]\d{2})\s*(?:€|EUR)\s*$/im,
  ];
  for (const pattern of ieePatterns) {
    const m = t.match(pattern);
    if (m) {
      if (m[2]) {
        // Calculated: base x percentage
        const base = parseFloat(m[1].replace(',', '.'));
        const pct = parseFloat(m[2].replace(',', '.'));
        result.impuestoElectrico = Math.round(base * pct / 100 * 100) / 100;
      } else {
        result.impuestoElectrico = parseFloat(m[1].replace(',', '.'));
      }
      result.camposExtraidos.push('impuestoElectrico');
      break;
    }
  }

  // IVA
  const ivaPatterns = [
    // "IVA (21%) 60,49 € x 21% 12,70 €" - queremos 12,70
    /IVA\s*\(?(?:\d+\s*%\)?)[\s\S]{0,80}?x\s*\d+\s*%\s*(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
    // "IVA 21% 99,70" (Energya VM: label and amount on same line, no €)
    /IVA\s*\d+\s*%\s+(\d+[\.,]\d{2})/i,
    // "IVA 12,70 €"
    /IVA[:\s]*(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
  ];
  for (const pattern of ivaPatterns) {
    const m = t.match(pattern);
    if (m) {
      result.iva = parseFloat(m[1].replace(',', '.'));
      result.camposExtraidos.push('iva');
      break;
    }
  }

  // === ALQUILER CONTADOR ===
  // Naturgy: "Alquiler de contador 31 días x 0,044712 €/día 1,39 €" (total at end)
  // Energya VM: " 11,84\nAlquiler equipo de medida\nAlquiler Equipo Medida 30días x 0,39€/día" (total on line before)
  const contadorPatterns = [
    // Energya VM: amount on line before "Alquiler equipo"
    /(\d+[\.,]\d{2})\s*\n\s*[Aa]lquiler\s*(?:de\s*)?(?:equipo|contador)/,
    // Naturgy: "Alquiler de contador...1,39 €" (last amount on the line)
    /[Aa]lquiler\s*(?:de\s*)?(?:equipo|contador)[\s\S]{0,150}?(\d+[\.,]\d{2})\s*(?:€|EUR)\s*$/im,
    /[Aa]lquiler\s*(?:de\s*)?(?:equipo|contador)[\s\S]{0,100}?(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
    /[Ee]quipo\s*(?:de\s*)?medida[\s\S]{0,100}?(\d+[\.,]\d{2})\s*(?:€|EUR)/i,
  ];
  for (const pattern of contadorPatterns) {
    const m = t.match(pattern);
    if (m) {
      result.alquilerContador = parseFloat(m[1].replace(',', '.'));
      result.camposExtraidos.push('alquilerContador');
      break;
    }
  }

  // === MODALIDAD ===
  if (/indexad[oa]|pool|OMIE|pass[\s-]*(?:through|pool)/i.test(t)) {
    result.modalidad = 'indexado';
    result.camposExtraidos.push('modalidad');
  } else if (/precio\s*fijo|tarifa\s*fija|fijo/i.test(t)) {
    result.modalidad = 'fijo';
    result.camposExtraidos.push('modalidad');
  }

  // === CALCULAR CONFIANZA ===
  const camposCriticos = ['tarifa', 'potencias', 'consumos'];
  const camposImportantes = ['precios', 'importeTotal', 'cups', 'periodo'];
  const camposOpcionales = ['comercializadora', 'modalidad', 'reactiva', 'impuestoElectrico', 'iva', 'alquilerContador'];

  let puntos = 0;
  for (const c of camposCriticos) {
    if (result.camposExtraidos.includes(c)) puntos += 20;
    else result.advertencias.push(`No se pudo extraer: ${c}`);
  }
  for (const c of camposImportantes) {
    if (result.camposExtraidos.includes(c)) puntos += 8;
  }
  for (const c of camposOpcionales) {
    if (result.camposExtraidos.includes(c)) puntos += 2;
  }
  result.confianza = Math.min(puntos, 100);

  // Inferir tarifa si no se encontro
  if (!result.tarifa && result.potencias.length > 0) {
    const maxPot = Math.max(...result.potencias);
    if (maxPot <= 15) result.tarifa = '2.0TD';
    else if (maxPot <= 450) result.tarifa = '3.0TD';
    else result.tarifa = '6.1TD';
    result.advertencias.push(`Tarifa inferida por potencia: ${result.tarifa}`);
    result.camposExtraidos.push('tarifa');
  }

  // Mensualizar consumos si el periodo difiere significativamente de 30 dias (>2 dias)
  if (result.periodoFacturacion.dias && Math.abs(result.periodoFacturacion.dias - 30) > 2 && result.consumos.length > 0) {
    const factor = 30 / result.periodoFacturacion.dias;
    result.consumos = result.consumos.map(c => Math.round(c * factor));
    result.advertencias.push(`Consumos mensualizados (factura de ${result.periodoFacturacion.dias} dias → 30 dias)`);
  }

  return result;
}

// === CONTROLLER ===
export async function parseBill(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningun archivo PDF' });
    }

    const filePath = req.file.path;

    try {
      // Leer y parsear PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      if (!pdfData.text || pdfData.text.trim().length < 50) {
        return res.status(422).json({
          error: 'No se pudo extraer texto del PDF. Puede ser una factura escaneada (imagen). Prueba con una factura digital.',
          suggestion: 'Las facturas descargadas desde el area de cliente de tu comercializadora suelen ser digitales y se pueden leer.'
        });
      }

      // Parsear el texto
      const result = parseBillText(pdfData.text);
      result.textoExtraido = pdfData.text.substring(0, 5000); // Primeros 5000 chars para debug

      // Si confianza < 75 y tenemos Gemini, intentar con IA
      if (result.confianza < 75 && env.GEMINI_API_KEY) {
        try {
          const aiResult = await extractEnergyBillFromText(pdfData.text);
          if (aiResult.confianza > result.confianza) {
            // Fusionar: usar IA para los campos que falten
            if (!result.comercializadora && aiResult.comercializadora) result.comercializadora = aiResult.comercializadora;
            if (!result.cups && aiResult.cups) result.cups = aiResult.cups;
            if (!result.tarifa && aiResult.tarifa) result.tarifa = aiResult.tarifa;
            if (!result.importeTotal && aiResult.importe_total) result.importeTotal = aiResult.importe_total;
            if (!result.importePotencia && aiResult.importe_potencia) result.importePotencia = aiResult.importe_potencia;
            if (!result.importeEnergia && aiResult.importe_energia) result.importeEnergia = aiResult.importe_energia;
            if (result.consumos.length === 0 && aiResult.consumos.length > 0) result.consumos = aiResult.consumos;
            if (result.potencias.length === 0 && aiResult.potencias.length > 0) result.potencias = aiResult.potencias;
            if (!result.impuestoElectrico && aiResult.impuesto_electrico) result.impuestoElectrico = aiResult.impuesto_electrico;
            if (!result.iva && aiResult.iva) result.iva = aiResult.iva;
            if (!result.alquilerContador && aiResult.alquiler_contador) result.alquilerContador = aiResult.alquiler_contador;
            result.confianza = Math.max(result.confianza, aiResult.confianza);
            result.advertencias.push('Datos completados con Gemini AI (confianza regex baja)');
          }
        } catch (aiErr: any) {
          result.advertencias.push(`Gemini fallback fallido: ${aiErr.message}`);
        }
      }

      return res.json({
        success: true,
        data: result,
        paginas: pdfData.numpages,
      });

    } finally {
      // Borrar archivo temporal
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }

  } catch (error: any) {
    next(error);
  }
}

// === FOTO DE FACTURA CON GEMINI VISION ===
export async function parseBillPhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se ha subido ningún archivo' });

    if (!env.GEMINI_API_KEY) {
      // Limpiar archivo
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: 'La extracción por foto requiere GEMINI_API_KEY configurada' });
    }

    const imageBuffer = fs.readFileSync(file.path);
    const mimeType = file.mimetype as string;

    // Limpiar archivo temporal
    fs.unlink(file.path, () => {});

    const result = await extractEnergyBillFromImage(imageBuffer, mimeType);

    // Convertir al formato ParsedBill para consistencia con el parser existente
    return res.json({
      success: true,
      data: {
        comercializadora: result.comercializadora,
        cups: result.cups,
        tarifa: result.tarifa,
        periodoFacturacion: {
          desde: result.periodo_desde,
          hasta: result.periodo_hasta,
          dias: result.dias,
        },
        potencias: result.potencias || [],
        consumos: result.consumos || [],
        preciosEnergia: result.precios_energia || [],
        importePotencia: result.importe_potencia,
        importeEnergia: result.importe_energia,
        importeTotal: result.importe_total,
        tieneReactiva: result.tiene_reactiva || false,
        importeReactiva: null,
        cosPhi: null,
        energiaReactiva: null,
        impuestoElectrico: result.impuesto_electrico,
        iva: result.iva,
        alquilerContador: result.alquiler_contador,
        modalidad: result.modalidad,
        confianza: result.confianza,
        metodo: result.metodo,
        camposExtraidos: Object.entries(result)
          .filter(([k, v]) => v !== null && v !== undefined && !['metodo', 'confianza'].includes(k))
          .map(([k]) => k),
        advertencias: [],
      },
    });
  } catch (err: any) {
    logger.error('Error parseando foto de factura:', err);
    return res.status(500).json({ error: err.message || 'Error procesando imagen' });
  }
}

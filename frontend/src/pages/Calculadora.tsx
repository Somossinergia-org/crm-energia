import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { SERVICIOS_CONFIG, type ServicioTipo } from '../services/servicios.service';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import BillUploader, { type ParsedBillData } from '../components/BillUploader';

// --- Types ---
interface ServiceResult {
  gastoActual: number;
  gastoPropuesto: number;
  ahorroMensual: number;
  ahorroAnual: number;
  porcentaje: number;
  desglose: { label: string; actual: number; propuesto: number }[];
  notas: string[];
}

// ============================
// ENERGIA - Tarifas reales mercado espanol 2025
// ============================
// Fuentes: BOE-A-2024-26218 (peajes CNMC 2025), BOE-A-2024-27289 (cargos Orden TED 2025)
// OMIE precios pool 2024, Circular 3/2020 CNMC (metodologia ATR)

interface FormDataEnergia {
  tarifa: string;
  modalidad: string;       // 'fijo' | 'indexado'
  // Potencias contratadas por periodo (kW)
  potP1: number; potP2: number; potP3: number;
  potP4: number; potP5: number; potP6: number;
  // Consumos mensuales por periodo (kWh)
  conP1: number; conP2: number; conP3: number;
  conP4: number; conP5: number; conP6: number;
  // Precios actuales del cliente (EUR/kWh) - precio fijo
  precioP1: number; precioP2: number; precioP3: number;
  precioP4: number; precioP5: number; precioP6: number;
  // Reactiva
  tieneReactiva: boolean;
  cosPhi: number;
  // FV
  tieneCompensacion: boolean;
  potenciaFV: number;
  // Opciones avanzadas
  optimizarPotencia: boolean;
}

// === PEAJES transporte y distribucion (CNMC) 2025 - BOE-A-2024-26218 ===
const PEAJES_POT: Record<string, number[]> = { // EUR/kW/ano
  '2.0TD': [21.8930, 3.1130],
  '3.0TD': [13.3220, 6.7590, 4.9380, 4.9380, 4.9380, 2.3960],
  '6.1TD': [10.2500, 5.1990, 3.7990, 3.7990, 3.7990, 1.8440],
};
const PEAJES_ENE: Record<string, number[]> = { // EUR/kWh
  '2.0TD': [0.000780, 0.000130, 0.000016],
  '3.0TD': [0.008860, 0.006880, 0.004360, 0.002380, 0.001220, 0.000650],
  '6.1TD': [0.005010, 0.003880, 0.002470, 0.001330, 0.000690, 0.000360],
};

// === CARGOS del sistema (Gobierno) 2025 - BOE-A-2024-27289 ===
const CARGOS_POT: Record<string, number[]> = { // EUR/kW/ano
  '2.0TD': [8.5890, 1.0700],
  '3.0TD': [11.0970, 5.6340, 4.1170, 4.1170, 4.1170, 1.9980],
  '6.1TD': [7.7780, 3.9470, 2.8860, 2.8860, 2.8860, 1.4010],
};
const CARGOS_ENE: Record<string, number[]> = { // EUR/kWh
  '2.0TD': [0.023980, 0.005100, 0.001020],
  '3.0TD': [0.013520, 0.010500, 0.006660, 0.003630, 0.001860, 0.000990],
  '6.1TD': [0.008190, 0.006360, 0.004030, 0.002200, 0.001130, 0.000600],
};

// Total ATR = peaje + cargo
const getATRPot = (tarifa: string): number[] => {
  const p = PEAJES_POT[tarifa] || PEAJES_POT['2.0TD'];
  const c = CARGOS_POT[tarifa] || CARGOS_POT['2.0TD'];
  return p.map((v, i) => v + c[i]);
};
const getATRene = (tarifa: string): number[] => {
  const p = PEAJES_ENE[tarifa] || PEAJES_ENE['2.0TD'];
  const c = CARGOS_ENE[tarifa] || CARGOS_ENE['2.0TD'];
  return p.map((v, i) => v + c[i]);
};

// Coeficientes de perdidas por periodo (BT y AT) - REE/CNMC
const PERDIDAS: Record<string, number[]> = {
  '2.0TD': [1.160, 1.130, 1.097],
  '3.0TD': [1.177, 1.159, 1.146, 1.130, 1.114, 1.097],
  '6.1TD': [1.073, 1.063, 1.056, 1.046, 1.037, 1.028],
};

// Pagos por capacidad (EUR/MWh) aplicados sobre energia
const PAGOS_CAPACIDAD: Record<string, number[]> = { // por periodo, EUR/MWh
  '2.0TD': [2.573, 1.200, 0.334],
  '3.0TD': [2.573, 2.573, 1.200, 1.200, 0.334, 0.334],
  '6.1TD': [2.573, 2.573, 1.200, 1.200, 0.334, 0.334],
};

// Otros costes (EUR/MWh)
const FNEE = 1.429;           // Fondo Nacional Eficiencia Energetica 2025
const COSTE_DESVIOS = 2.0;    // Coste desvios tipico
const FEE_GESTION_COMPETITIVA = 3.0; // Fee gestion comercializadora competitiva (indexado)
const FEE_GESTION_INCUMBENTE = 6.0;  // Fee gestion incumbente (indexado)

// Pool OMIE - precio medio por periodo estimado (EUR/MWh) basado en 2024
const POOL_POR_PERIODO: Record<string, number[]> = {
  '2.0TD': [85, 55, 30],         // P1 punta, P2 llano, P3 valle
  '3.0TD': [95, 80, 65, 50, 40, 25],
  '6.1TD': [95, 80, 65, 50, 40, 25],
};

// Margenes comercializadora sobre pool (EUR/MWh) para precio FIJO
const MARGEN_FIJO_INCUMBENTE: Record<string, number> = {
  '2.0TD': 35, '3.0TD': 30, '6.1TD': 25, // Endesa, Iberdrola, Naturgy
};
const MARGEN_FIJO_COMPETITIVO: Record<string, number> = {
  '2.0TD': 10, '3.0TD': 8, '6.1TD': 5, // Aldro, Fenie, Nabalia
};

// Impuestos
const IEE = 0.0511269632; // Impuesto electrico (restablecido enero 2025)
const IVA = 0.21;

// Alquiler equipo medida
const ALQUILER_CONTADOR: Record<string, number> = {
  '2.0TD': 0.81, '3.0TD': 2.00, '6.1TD': 12.00,
};

// Penalizacion reactiva (EUR/kVArh) - solo 3.0TD y 6.1TD
const REACTIVA_MODERADA = 0.041554; // cos phi 0.80-0.95
const REACTIVA_ALTA = 0.062332;     // cos phi < 0.80

// Compensacion excedentes FV
const PRECIO_EXCEDENTES = 0.06; // EUR/kWh (precio medio pool - peaje)

function calcEnergia(d: FormDataEnergia): ServiceResult {
  const tarifa = d.tarifa || '2.0TD';
  const is2TD = tarifa === '2.0TD';
  const atrPot = getATRPot(tarifa);
  const atrEne = getATRene(tarifa);
  const perdidas = PERDIDAS[tarifa];
  const pagosCap = PAGOS_CAPACIDAD[tarifa];
  const poolPeriodo = POOL_POR_PERIODO[tarifa];

  // Potencias contratadas
  const potencias = is2TD
    ? [d.potP1, d.potP2]
    : [d.potP1, d.potP2, d.potP3, d.potP4, d.potP5, d.potP6];

  // Consumos por periodo
  const consumos = is2TD
    ? [d.conP1, d.conP2, d.conP3]
    : [d.conP1, d.conP2, d.conP3, d.conP4, d.conP5, d.conP6];

  const consumoTotal = consumos.reduce((s, c) => s + c, 0);

  // ===== COSTE ACTUAL DEL CLIENTE =====

  // Termino potencia (regulado, igual para todos)
  const costePotencia = potencias.reduce((sum, pot, i) => sum + pot * atrPot[i], 0) / 12;

  let costeEnergiaActual: number;
  let costeEnergiaPropuesto: number;
  const desglose: { label: string; actual: number; propuesto: number }[] = [];
  const notas: string[] = [];

  if (d.modalidad === 'indexado') {
    // --- INDEXADO: pool + perdidas + ATR energia + pagos capacidad + FNEE + desvios + fee ---

    // Actual (incumbente indexado)
    costeEnergiaActual = consumos.reduce((sum, c, i) => {
      const poolKwh = poolPeriodo[i] / 1000; // EUR/MWh -> EUR/kWh
      const energiaBruta = c * poolKwh * perdidas[i]; // coste pool con perdidas
      const peajesYCargos = c * atrEne[i];
      const capacidad = c * pagosCap[i] / 1000;
      const fnee = c * FNEE / 1000;
      const desvios = c * COSTE_DESVIOS / 1000;
      const fee = c * FEE_GESTION_INCUMBENTE / 1000;
      return sum + energiaBruta + peajesYCargos + capacidad + fnee + desvios + fee;
    }, 0);

    // Propuesto (competitivo indexado)
    costeEnergiaPropuesto = consumos.reduce((sum, c, i) => {
      const poolKwh = poolPeriodo[i] / 1000;
      const energiaBruta = c * poolKwh * perdidas[i];
      const peajesYCargos = c * atrEne[i];
      const capacidad = c * pagosCap[i] / 1000;
      const fnee = c * FNEE / 1000;
      const desvios = c * COSTE_DESVIOS / 1000;
      const fee = c * FEE_GESTION_COMPETITIVA / 1000;
      return sum + energiaBruta + peajesYCargos + capacidad + fnee + desvios + fee;
    }, 0);

    // Desglose por concepto
    const poolActual = consumos.reduce((s, c, i) => s + c * (poolPeriodo[i] / 1000) * perdidas[i], 0);
    const atrTotal = consumos.reduce((s, c, i) => s + c * atrEne[i], 0);
    const capTotal = consumos.reduce((s, c, i) => s + c * pagosCap[i] / 1000, 0);
    const fneeTotal = consumoTotal * FNEE / 1000;
    const desviosTotal = consumoTotal * COSTE_DESVIOS / 1000;
    const feeActual = consumoTotal * FEE_GESTION_INCUMBENTE / 1000;
    const feePropuesto = consumoTotal * FEE_GESTION_COMPETITIVA / 1000;

    desglose.push(
      { label: 'Coste pool OMIE (con perdidas)', actual: poolActual, propuesto: poolActual },
      { label: 'Peajes + cargos energia', actual: atrTotal, propuesto: atrTotal },
      { label: 'Pagos por capacidad', actual: capTotal, propuesto: capTotal },
      { label: 'FNEE', actual: fneeTotal, propuesto: fneeTotal },
      { label: 'Desvios', actual: desviosTotal, propuesto: desviosTotal },
      { label: 'Fee gestion comercializadora', actual: feeActual, propuesto: feePropuesto },
    );

    notas.push(
      'Modalidad INDEXADA al pool OMIE (pass-pool)',
      `Fee gestion actual: ${FEE_GESTION_INCUMBENTE} EUR/MWh → Propuesto: ${FEE_GESTION_COMPETITIVA} EUR/MWh`,
      'Pool, perdidas, peajes, cargos, capacidad y FNEE son identicos (regulados)',
      'El ahorro viene de la diferencia en el fee de gestion de la comercializadora',
    );

  } else {
    // --- PRECIO FIJO: precio cerrado por periodo ---

    // Si el cliente ha introducido sus precios actuales, usarlos
    const preciosActuales = is2TD
      ? [d.precioP1, d.precioP2, d.precioP3]
      : [d.precioP1, d.precioP2, d.precioP3, d.precioP4, d.precioP5, d.precioP6];

    const tienePreciosReales = preciosActuales.some(p => p > 0);

    if (tienePreciosReales) {
      // Usar precios reales del cliente
      costeEnergiaActual = consumos.reduce((sum, c, i) => sum + c * preciosActuales[i], 0);
    } else {
      // Estimar con pool + margen incumbente + ATR
      costeEnergiaActual = consumos.reduce((sum, c, i) => {
        const precio = (poolPeriodo[i] + MARGEN_FIJO_INCUMBENTE[tarifa]) / 1000 * perdidas[i] + atrEne[i] + pagosCap[i] / 1000 + FNEE / 1000;
        return sum + c * precio;
      }, 0);
    }

    // Precio propuesto competitivo
    const preciosPropuestos = consumos.map((_, i) => {
      return (poolPeriodo[i] + MARGEN_FIJO_COMPETITIVO[tarifa]) / 1000 * perdidas[i] + atrEne[i] + pagosCap[i] / 1000 + FNEE / 1000;
    });

    costeEnergiaPropuesto = consumos.reduce((sum, c, i) => sum + c * preciosPropuestos[i], 0);

    // Desglose por periodo
    const labels = is2TD ? ['P1 Punta', 'P2 Llano', 'P3 Valle'] : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    consumos.forEach((c, i) => {
      if (c > 0) {
        const precioAct = tienePreciosReales ? preciosActuales[i] : ((poolPeriodo[i] + MARGEN_FIJO_INCUMBENTE[tarifa]) / 1000 * perdidas[i] + atrEne[i] + pagosCap[i] / 1000 + FNEE / 1000);
        desglose.push({
          label: `${labels[i]} (${c} kWh)`,
          actual: c * precioAct,
          propuesto: c * preciosPropuestos[i],
        });
      }
    });

    notas.push(
      'Modalidad PRECIO FIJO (cerrado por periodo)',
      `Margen incumbente: ~${MARGEN_FIJO_INCUMBENTE[tarifa]} EUR/MWh → Competitivo: ~${MARGEN_FIJO_COMPETITIVO[tarifa]} EUR/MWh`,
      tienePreciosReales ? 'Precios actuales: introducidos por el usuario (factura del cliente)' : 'Precios actuales: estimados (pool + margen incumbente)',
    );

    // Mostrar precios propuestos
    const labels2 = is2TD ? ['P1', 'P2', 'P3'] : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    const preciosStr = preciosPropuestos.map((p, i) => `${labels2[i]}: ${(p * 1000).toFixed(1)}`).join(' | ');
    notas.push(`Precios propuestos (EUR/MWh): ${preciosStr}`);
  }

  // ===== OPTIMIZACION DE POTENCIA =====
  let costePotenciaPropuesto = costePotencia;
  if (d.optimizarPotencia) {
    // Proponer -10% en potencia (tipico tras analisis de maximetro)
    const potOptimizadas = potencias.map(p => Math.max(p * 0.9, 1));
    costePotenciaPropuesto = potOptimizadas.reduce((sum, pot, i) => sum + pot * atrPot[i], 0) / 12;
    desglose.unshift({
      label: 'Termino potencia',
      actual: costePotencia,
      propuesto: costePotenciaPropuesto,
    });
    notas.push('Potencia optimizada -10% (verificar con maximetro real del cliente)');
  } else {
    desglose.unshift({ label: 'Termino potencia', actual: costePotencia, propuesto: costePotencia });
  }

  // ===== REACTIVA (solo 3.0TD y 6.1TD) =====
  let penalizacionReactiva = 0;
  if (!is2TD && d.tieneReactiva && d.cosPhi < 0.95) {
    const tanPhi = Math.tan(Math.acos(d.cosPhi));
    const consumoP1a5 = consumos.slice(0, 5).reduce((s, c) => s + c, 0); // P1-P5 (no P6)
    const reactivaTotal = consumoP1a5 * tanPhi; // kVArh total

    if (d.cosPhi >= 0.80) {
      const reactivaUmbral = consumoP1a5 * Math.tan(Math.acos(0.95));
      const reactivaPenalizable = Math.max(reactivaTotal - reactivaUmbral, 0);
      penalizacionReactiva = reactivaPenalizable * REACTIVA_MODERADA;
    } else {
      const reactivaUmbral = consumoP1a5 * Math.tan(Math.acos(0.80));
      const reactivaPenalizable = Math.max(reactivaTotal - reactivaUmbral, 0);
      penalizacionReactiva = reactivaPenalizable * REACTIVA_ALTA;
    }

    desglose.push({
      label: `Reactiva (cos φ = ${d.cosPhi.toFixed(2)})`,
      actual: penalizacionReactiva,
      propuesto: 0, // Con bateria de condensadores se elimina
    });
    notas.push(
      `Penalizacion reactiva: ${eur(penalizacionReactiva)}/mes (se elimina con bateria de condensadores)`,
      `cos(φ) = ${d.cosPhi.toFixed(2)} → tan(φ) = ${tanPhi.toFixed(3)} → ${(tanPhi * 100).toFixed(0)}% reactiva sobre activa`,
    );
  }

  // ===== COMPENSACION FV =====
  let compensacionFV = 0;
  if (d.tieneCompensacion && d.potenciaFV > 0) {
    const produccionMensual = (d.potenciaFV * 1400) / 12;
    const excedentes = Math.min(produccionMensual * 0.6, consumoTotal);
    compensacionFV = excedentes * PRECIO_EXCEDENTES;
    desglose.push({ label: 'Compensacion FV excedentes', actual: 0, propuesto: -compensacionFV });
    notas.push(
      `FV: ${d.potenciaFV} kWp → ${produccionMensual.toFixed(0)} kWh/mes (1.400 kWh/kWp/ano)`,
      `Excedentes estimados: ${excedentes.toFixed(0)} kWh/mes a ${PRECIO_EXCEDENTES * 1000} EUR/MWh`,
    );
  }

  // ===== ALQUILER CONTADOR =====
  const alquiler = ALQUILER_CONTADOR[tarifa] || 0.81;
  desglose.push({ label: 'Alquiler equipo medida', actual: alquiler, propuesto: alquiler });

  // ===== IMPUESTOS =====
  // IEE se aplica sobre coste potencia de la comercializadora + coste energia (sin peajes ni cargos desde 2015)
  // Simplificacion: aplicamos sobre subtotal (ligeramente conservador)
  const subtotalActual = costePotencia + costeEnergiaActual + penalizacionReactiva + alquiler;
  const subtotalPropuesto = costePotenciaPropuesto + costeEnergiaPropuesto - compensacionFV + alquiler;

  const ieeActual = subtotalActual * IEE;
  const ieePropuesto = Math.max(subtotalPropuesto, 0) * IEE;

  const baseIVAactual = subtotalActual + ieeActual;
  const baseIVApropuesto = Math.max(subtotalPropuesto + ieePropuesto, 0);

  const ivaActual = baseIVAactual * IVA;
  const ivaPropuesto = baseIVApropuesto * IVA;

  const totalActual = baseIVAactual + ivaActual;
  const totalPropuesto = baseIVApropuesto + ivaPropuesto;

  desglose.push(
    { label: `Imp. electrico (${(IEE * 100).toFixed(2)}%)`, actual: ieeActual, propuesto: ieePropuesto },
    { label: `IVA (${(IVA * 100).toFixed(0)}%)`, actual: ivaActual, propuesto: ivaPropuesto },
  );

  notas.push(
    `IEE: ${(IEE * 100).toFixed(2)}% (restablecido ene 2025) | IVA: ${(IVA * 100).toFixed(0)}%`,
    `Peajes y cargos: BOE-A-2024-26218 + BOE-A-2024-27289 (vigentes 2025)`,
    `Consumo total: ${consumoTotal.toLocaleString('es-ES')} kWh/mes`,
  );

  const ahorro = totalActual - totalPropuesto;

  return {
    gastoActual: totalActual,
    gastoPropuesto: Math.max(totalPropuesto, 0),
    ahorroMensual: ahorro,
    ahorroAnual: ahorro * 12,
    porcentaje: totalActual > 0 ? (ahorro / totalActual) * 100 : 0,
    desglose,
    notas,
  };
}

// ============================
// TELECOMUNICACIONES - Precios reales operadores Espana
// ============================
interface FormDataTelecom {
  tipoFibra: string;        // Velocidad fibra
  precioFibra: number;       // Coste actual fibra/mes
  numLineasMovil: number;    // Numero de lineas movil
  precioMovil: number;       // Coste actual por linea/mes
  tieneCentralita: boolean;
  precioCentralita: number;  // Coste actual centralita/mes
  numExtensiones: number;
}

// Precios medios mercado espanol operadores alternativos (Digi, Pepephone, MasMovil empresas)
const PRECIOS_COMPETITIVOS_TELECOM = {
  fibra: { '100Mb': 20, '300Mb': 25, '600Mb': 30, '1Gb': 35 } as Record<string, number>,
  movilPorLinea: 8, // Tarifa plana ilimitada + 25GB por linea (descuento volumen)
  centralitaCloud: 5, // Por extension/mes (3CX, Aircall basico)
  centralitaBase: 15, // Base mensual
};

function calcTelecom(d: FormDataTelecom): ServiceResult {
  // Gasto actual
  const gastoFibraActual = d.precioFibra || 0;
  const gastoMovilActual = (d.precioMovil || 0) * (d.numLineasMovil || 0);
  const gastoCentralitaActual = d.tieneCentralita ? (d.precioCentralita || 0) : 0;
  const totalActual = gastoFibraActual + gastoMovilActual + gastoCentralitaActual;

  // Propuesta competitiva
  const precioFibraPropuesto = PRECIOS_COMPETITIVOS_TELECOM.fibra[d.tipoFibra] || 30;
  const numLineas = d.numLineasMovil || 0;
  // Descuento por volumen: -2EUR/linea a partir de 3 lineas
  const descuentoLinea = numLineas >= 3 ? 2 : 0;
  const precioMovilPropuesto = numLineas * Math.max(PRECIOS_COMPETITIVOS_TELECOM.movilPorLinea - descuentoLinea, 5);

  let precioCentralitaPropuesto = 0;
  if (d.tieneCentralita) {
    const ext = d.numExtensiones || 1;
    precioCentralitaPropuesto = PRECIOS_COMPETITIVOS_TELECOM.centralitaBase + ext * PRECIOS_COMPETITIVOS_TELECOM.centralitaCloud;
  }

  const totalPropuesto = precioFibraPropuesto + precioMovilPropuesto + precioCentralitaPropuesto;
  const ahorro = totalActual - totalPropuesto;

  return {
    gastoActual: totalActual,
    gastoPropuesto: totalPropuesto,
    ahorroMensual: Math.max(ahorro, 0),
    ahorroAnual: Math.max(ahorro, 0) * 12,
    porcentaje: totalActual > 0 ? Math.max((ahorro / totalActual) * 100, 0) : 0,
    desglose: [
      { label: 'Fibra', actual: gastoFibraActual, propuesto: precioFibraPropuesto },
      { label: `Movil (${numLineas} linea${numLineas !== 1 ? 's' : ''})`, actual: gastoMovilActual, propuesto: precioMovilPropuesto },
      ...(d.tieneCentralita ? [{ label: 'Centralita/VoIP', actual: gastoCentralitaActual, propuesto: precioCentralitaPropuesto }] : []),
    ],
    notas: [
      'Precios propuestos basados en tarifas MasMovil Negocios / Digi Business 2024',
      numLineas >= 3 ? `Descuento volumen aplicado: -${descuentoLinea} EUR/linea (${numLineas} lineas)` : '',
      d.tieneCentralita ? 'Centralita cloud (3CX/Aircall) vs. centralita fisica tradicional' : '',
    ].filter(Boolean),
  };
}

// ============================
// ALARMAS - CRA + equipamiento real
// ============================
interface FormDataAlarmas {
  gastoMensualCRA: number;    // Cuota CRA actual (Securitas, Prosegur...)
  tieneVideovigilancia: boolean;
  numCamaras: number;
  tieneControlAcceso: boolean;
  superficieM2: number;       // Para calcular detectores necesarios
}

// Precios mercado espanol CRA + equipamiento
const PRECIOS_ALARMAS = {
  // Cuotas CRA mensuales tipicas por proveedor
  securitasDirect: 45,    // Securitas Direct pyme
  prosegur: 42,           // Prosegur pyme
  // Nuestra oferta: CRA via ADT/operador alternativo
  craCompetitiva: 29.90,  // CRA basica sin permanencia
  craConVideo: 34.90,     // CRA + verificacion video
  camaraMensual: 3,       // Coste por camara adicional/mes (cloud storage)
  controlAccesoBase: 8,   // Por puerta/mes
};

function calcAlarmas(d: FormDataAlarmas): ServiceResult {
  const totalActual = d.gastoMensualCRA || 0;

  // Propuesta
  let cuotaPropuesta = d.tieneVideovigilancia
    ? PRECIOS_ALARMAS.craConVideo
    : PRECIOS_ALARMAS.craCompetitiva;

  // Camaras adicionales
  const extraCamaras = d.tieneVideovigilancia && d.numCamaras > 2
    ? (d.numCamaras - 2) * PRECIOS_ALARMAS.camaraMensual // 2 incluidas en pack basico
    : 0;

  // Control de acceso
  const extraAcceso = d.tieneControlAcceso ? PRECIOS_ALARMAS.controlAccesoBase : 0;

  const totalPropuesto = cuotaPropuesta + extraCamaras + extraAcceso;
  const ahorro = totalActual - totalPropuesto;

  // Detectores recomendados segun superficie
  const detectores = Math.max(Math.ceil((d.superficieM2 || 50) / 30), 2); // 1 detector cada 30m2, minimo 2

  return {
    gastoActual: totalActual,
    gastoPropuesto: totalPropuesto,
    ahorroMensual: Math.max(ahorro, 0),
    ahorroAnual: Math.max(ahorro, 0) * 12,
    porcentaje: totalActual > 0 ? Math.max((ahorro / totalActual) * 100, 0) : 0,
    desglose: [
      { label: 'Cuota CRA', actual: totalActual, propuesto: cuotaPropuesta },
      ...(extraCamaras > 0 ? [{ label: `Camaras extra (${d.numCamaras - 2})`, actual: 0, propuesto: extraCamaras }] : []),
      ...(extraAcceso > 0 ? [{ label: 'Control acceso', actual: 0, propuesto: extraAcceso }] : []),
    ],
    notas: [
      'CRA certificada Grado 2 (obligatorio para comercios)',
      `Detectores recomendados para ${d.superficieM2 || 50}m2: ${detectores} unidades`,
      'Sin permanencia. Equipo en comodato.',
      'Precios ref: Securitas Direct PYMEs ~45 EUR/mes, Prosegur ~42 EUR/mes',
    ],
  };
}

// ============================
// SEGUROS - Prima real basada en facturacion y sector
// ============================
interface FormDataSeguros {
  facturacionAnual: number;   // Facturacion del negocio
  sector: string;             // Sector actividad
  superficieLocal: number;    // m2 del local
  numEmpleados: number;
  tipoSeguro: string;
  primaActual: number;        // Prima anual actual
}

// Tasas de prima por sector (por mil EUR de facturacion) - mercado espanol
const TASAS_SECTOR: Record<string, number> = {
  'Hosteleria': 3.5,           // por mil
  'Comercio minorista': 2.8,
  'Servicios profesionales': 1.8,
  'Industria ligera': 4.2,
  'Alimentacion': 3.0,
  'Peluqueria/Estetica': 2.5,
  'Taller mecanico': 5.0,
  'Farmacia': 2.0,
  'Otro': 3.0,
};

// Tasa RC por empleado y sector
const TASA_RC_EMPLEADO: Record<string, number> = {
  'Hosteleria': 45,
  'Comercio minorista': 30,
  'Servicios profesionales': 60,
  'Industria ligera': 80,
  'Alimentacion': 35,
  'Peluqueria/Estetica': 50,
  'Taller mecanico': 90,
  'Farmacia': 40,
  'Otro': 45,
};

function calcSeguros(d: FormDataSeguros): ServiceResult {
  const sector = d.sector || 'Otro';
  const primaActualAnual = d.primaActual || 0;
  const primaActualMensual = primaActualAnual / 12;

  // Calculo prima competitiva segun tipo
  let primaAnualPropuesta = 0;
  const desglose: { label: string; actual: number; propuesto: number }[] = [];
  const notas: string[] = [];

  if (d.tipoSeguro === 'Multirriesgo local') {
    // Contenido estimado: 15-20% de facturacion anual (minimo 30.000)
    const valorContenido = Math.max((d.facturacionAnual || 0) * 0.15, 30000);
    // Prima contenido: 2-4 por mil segun sector
    const primaContenido = valorContenido * (TASAS_SECTOR[sector] || 3.0) / 1000;
    // Prima inmueble: 0.5 por mil sobre valor estimado (1.500 EUR/m2)
    const valorInmueble = (d.superficieLocal || 50) * 1500;
    const primaInmueble = valorInmueble * 0.5 / 1000;
    // RC incluida
    const primaRC = (d.numEmpleados || 1) * (TASA_RC_EMPLEADO[sector] || 45);

    primaAnualPropuesta = primaContenido + primaInmueble + primaRC;
    desglose.push(
      { label: 'Contenido', actual: primaActualAnual * 0.5, propuesto: primaContenido },
      { label: 'Inmueble', actual: primaActualAnual * 0.3, propuesto: primaInmueble },
      { label: 'RC incluida', actual: primaActualAnual * 0.2, propuesto: primaRC },
    );
    notas.push(
      `Valor contenido estimado: ${eur(valorContenido)} (${(TASAS_SECTOR[sector] || 3.0)} ‰)`,
      `Valor inmueble estimado: ${eur(valorInmueble)} (${d.superficieLocal || 50}m2 x 1.500 EUR/m2)`,
      `Tasa sector "${sector}": ${TASAS_SECTOR[sector] || 3.0} por mil`,
    );
  } else if (d.tipoSeguro === 'Responsabilidad civil') {
    primaAnualPropuesta = (d.numEmpleados || 1) * (TASA_RC_EMPLEADO[sector] || 45) * 1.3;
    desglose.push({ label: 'RC profesional', actual: primaActualAnual, propuesto: primaAnualPropuesta });
    notas.push(`Tasa RC sector "${sector}": ${TASA_RC_EMPLEADO[sector] || 45} EUR/empleado/ano`);
  } else if (d.tipoSeguro === 'Vehiculos flota') {
    // Seguros flota: descuento 15-30% sobre polizas individuales
    primaAnualPropuesta = primaActualAnual * 0.75; // 25% descuento flota
    desglose.push({ label: 'Flota vehiculos', actual: primaActualAnual, propuesto: primaAnualPropuesta });
    notas.push('Descuento flota: 25% sobre primas individuales (minimo 3 vehiculos)');
  } else if (d.tipoSeguro === 'Salud colectivo') {
    // Seguro salud colectivo: ~45 EUR/empleado/mes (vs 60-80 individual)
    const precioIndividual = 65;
    const precioColectivo = 45;
    primaAnualPropuesta = (d.numEmpleados || 1) * precioColectivo * 12;
    const primaIndividual = (d.numEmpleados || 1) * precioIndividual * 12;
    desglose.push({ label: 'Salud colectivo', actual: primaActualAnual || primaIndividual, propuesto: primaAnualPropuesta });
    notas.push(
      `Individual: ~${precioIndividual} EUR/empleado/mes → Colectivo: ${precioColectivo} EUR/empleado/mes`,
      'Ventaja fiscal: deducible como gasto de empresa (hasta 500 EUR/empleado/ano exento IRPF)',
    );
  } else {
    primaAnualPropuesta = primaActualAnual * 0.85;
    desglose.push({ label: d.tipoSeguro, actual: primaActualAnual, propuesto: primaAnualPropuesta });
  }

  // Aplicar descuento multipoliza si ya tiene otros servicios
  primaAnualPropuesta *= 0.95; // 5% descuento por ser cliente multi-servicio
  notas.push('Incluye 5% descuento multipoliza por combinacion de servicios');

  const primaPropuestaMensual = primaAnualPropuesta / 12;
  const ahorro = primaActualMensual - primaPropuestaMensual;

  return {
    gastoActual: primaActualMensual,
    gastoPropuesto: primaPropuestaMensual,
    ahorroMensual: Math.max(ahorro, 0),
    ahorroAnual: Math.max(ahorro, 0) * 12,
    porcentaje: primaActualMensual > 0 ? Math.max((ahorro / primaActualMensual) * 100, 0) : 0,
    desglose: desglose.map(d => ({ ...d, actual: d.actual / 12, propuesto: d.propuesto / 12 })),
    notas,
  };
}

// ============================
// AGENTES IA - ROI real basado en tareas automatizables
// ============================
interface FormDataAgentesIA {
  atencionCliente: number;    // Horas/mes atencion telefonica/chat
  gestionCitas: number;       // Horas/mes gestion agenda
  respuestasEmail: number;    // Horas/mes respondiendo emails repetitivos
  entradaDatos: number;       // Horas/mes entrada manual de datos
  costeHora: number;          // Coste hora empleado (bruto empresa)
  plan: string;               // Plan IA: basico, profesional, enterprise
}

// Tasas de automatizacion por tarea (basado en benchmarks GPT/Claude/Dialogflow)
const AUTOMATIZACION_TASA: Record<string, number> = {
  atencionCliente: 0.60,   // Chatbot resuelve 60% de consultas L1
  gestionCitas: 0.85,       // Booking automatico >85%
  respuestasEmail: 0.70,    // Respuestas template + clasificacion
  entradaDatos: 0.90,       // OCR + extraccion automatica
};

const PLANES_IA: Record<string, { precio: number; label: string }> = {
  basico: { precio: 97, label: 'Basico (chatbot + agenda)' },
  profesional: { precio: 197, label: 'Profesional (+ email + datos)' },
  enterprise: { precio: 397, label: 'Enterprise (personalizado + API)' },
};

function calcAgentesIA(d: FormDataAgentesIA): ServiceResult {
  const costeHora = d.costeHora || 15;
  const plan = PLANES_IA[d.plan] || PLANES_IA.profesional;

  const tareas = [
    { key: 'atencionCliente', label: 'Atencion al cliente', horas: d.atencionCliente || 0 },
    { key: 'gestionCitas', label: 'Gestion de citas', horas: d.gestionCitas || 0 },
    { key: 'respuestasEmail', label: 'Respuestas email', horas: d.respuestasEmail || 0 },
    { key: 'entradaDatos', label: 'Entrada de datos', horas: d.entradaDatos || 0 },
  ];

  const totalHoras = tareas.reduce((s, t) => s + t.horas, 0);
  const costoActual = totalHoras * costeHora;

  // Horas ahorradas por automatizacion
  const horasAhorradas = tareas.reduce((s, t) => {
    return s + t.horas * (AUTOMATIZACION_TASA[t.key] || 0.5);
  }, 0);

  const costoPropuesto = (totalHoras - horasAhorradas) * costeHora + plan.precio;
  const ahorro = costoActual - costoPropuesto;

  return {
    gastoActual: costoActual,
    gastoPropuesto: costoPropuesto,
    ahorroMensual: Math.max(ahorro, 0),
    ahorroAnual: Math.max(ahorro, 0) * 12,
    porcentaje: costoActual > 0 ? Math.max((ahorro / costoActual) * 100, 0) : 0,
    desglose: tareas.filter(t => t.horas > 0).map(t => {
      const tasa = AUTOMATIZACION_TASA[t.key] || 0.5;
      return {
        label: `${t.label} (${(tasa * 100).toFixed(0)}% automat.)`,
        actual: t.horas * costeHora,
        propuesto: t.horas * (1 - tasa) * costeHora,
      };
    }).concat([{ label: `Plan ${plan.label}`, actual: 0, propuesto: plan.precio }]),
    notas: [
      `Total horas manuales: ${totalHoras}h/mes → ${(totalHoras - horasAhorradas).toFixed(1)}h/mes con IA`,
      `Horas liberadas: ${horasAhorradas.toFixed(1)}h/mes (${((horasAhorradas / Math.max(totalHoras, 1)) * 100).toFixed(0)}%)`,
      `Coste hora empleado (bruto empresa): ${costeHora} EUR/h`,
      'Tasas de automatizacion basadas en benchmarks del sector (Gartner 2024, McKinsey)',
    ],
  };
}

// ============================
// WEB - ROI real basado en conversion
// ============================
interface FormDataWeb {
  tieneWeb: string;
  visitasMensuales: number;   // Trafico actual (0 si no tiene)
  ticketMedio: number;        // Valor medio de un cliente nuevo
  clientesMes: number;        // Clientes nuevos actuales por mes
  gastoMarketingActual: number; // Google Ads, folletos, etc.
}

// Benchmarks conversion web pyme espanola
const CONVERSION_BENCHMARKS = {
  sinWeb: { visitasEstimadas: 200, tasaConversion: 0.02 },  // 2% conversion basica
  webBasica: { mejoraTasa: 1.5 },   // x1.5 mejora con web optimizada
  webOptimizada: { mejoraTasa: 2.5 }, // x2.5 con SEO + CRO
};

function calcWeb(d: FormDataWeb): ServiceResult {
  const ticketMedio = d.ticketMedio || 50;

  if (d.tieneWeb === 'No') {
    // Estimacion creacion web desde cero
    const inversionInicial = 1200; // Web basica WordPress/Wix
    const mantenimiento = 49; // Hosting + mantenimiento/mes
    const seoBasico = 150; // SEO local basico/mes
    const costoMensual = mantenimiento + seoBasico;

    // Beneficio estimado
    const visitasEstimadas = CONVERSION_BENCHMARKS.sinWeb.visitasEstimadas;
    const clientesNuevos = visitasEstimadas * CONVERSION_BENCHMARKS.sinWeb.tasaConversion;
    const ingresoNuevo = clientesNuevos * ticketMedio;

    const roi = ingresoNuevo - costoMensual;

    return {
      gastoActual: d.gastoMarketingActual || 0,
      gastoPropuesto: costoMensual,
      ahorroMensual: roi, // En este caso es "beneficio neto"
      ahorroAnual: roi * 12 - inversionInicial,
      porcentaje: costoMensual > 0 ? (roi / costoMensual) * 100 : 0,
      desglose: [
        { label: 'Marketing actual (folletos, etc)', actual: d.gastoMarketingActual || 0, propuesto: 0 },
        { label: 'Hosting + mantenimiento web', actual: 0, propuesto: mantenimiento },
        { label: 'SEO local', actual: 0, propuesto: seoBasico },
        { label: 'Ingresos estimados nuevos clientes', actual: 0, propuesto: -ingresoNuevo },
      ],
      notas: [
        `Inversion inicial web: ${eur(inversionInicial)} (amortizada en ano 1)`,
        `Trafico estimado: ${visitasEstimadas} visitas/mes (Google My Business + SEO local)`,
        `Conversion estimada: ${(CONVERSION_BENCHMARKS.sinWeb.tasaConversion * 100).toFixed(1)}% → ${clientesNuevos.toFixed(1)} clientes nuevos/mes`,
        `Ticket medio: ${eur(ticketMedio)}`,
        'ROI tipico web pyme: 3-6 meses para recuperar inversion',
      ],
    };
  }

  // Ya tiene web - optimizacion
  const visitasActuales = d.visitasMensuales || 100;
  const clientesActuales = d.clientesMes || 2;
  const tasaActual = visitasActuales > 0 ? clientesActuales / visitasActuales : 0.01;

  const mejora = d.tieneWeb === 'Desactualizada'
    ? CONVERSION_BENCHMARKS.webOptimizada.mejoraTasa
    : CONVERSION_BENCHMARKS.webBasica.mejoraTasa;

  const clientesMejorados = visitasActuales * tasaActual * mejora;
  const ingresosActuales = clientesActuales * ticketMedio;
  const ingresosMejorados = clientesMejorados * ticketMedio;

  const costoOptimizacion = 199; // SEO + CRO mensual
  const beneficioNeto = (ingresosMejorados - ingresosActuales) - costoOptimizacion;

  return {
    gastoActual: d.gastoMarketingActual || 0,
    gastoPropuesto: (d.gastoMarketingActual || 0) + costoOptimizacion,
    ahorroMensual: beneficioNeto,
    ahorroAnual: beneficioNeto * 12,
    porcentaje: ingresosActuales > 0 ? ((ingresosMejorados - ingresosActuales) / ingresosActuales * 100) : 0,
    desglose: [
      { label: 'Ingresos via web actuales', actual: ingresosActuales, propuesto: ingresosMejorados },
      { label: 'Coste optimizacion (SEO+CRO)', actual: 0, propuesto: costoOptimizacion },
    ],
    notas: [
      `Tasa conversion actual: ${(tasaActual * 100).toFixed(2)}% → Mejorada: ${(tasaActual * mejora * 100).toFixed(2)}%`,
      `Clientes nuevos: ${clientesActuales}/mes → ${clientesMejorados.toFixed(1)}/mes (+${((mejora - 1) * 100).toFixed(0)}%)`,
      `Optimizacion incluye: SEO on-page, Google My Business, CRO landing pages`,
    ],
  };
}

// ============================
// CRM - ROI basado en productividad comercial
// ============================
interface FormDataCRM {
  numComerciales: number;
  visitasDia: number;        // Visitas por comercial por dia
  tasaCierre: number;        // % actual de cierre (ej: 15%)
  ticketMedioVenta: number;  // Valor medio venta
  horasAdmin: number;        // Horas/semana en tareas admin por comercial
}

// Benchmarks CRM en equipos comerciales pyme
const CRM_BENCHMARKS = {
  mejoraVisitas: 1.25,      // +25% visitas/dia con rutas optimizadas
  mejoraCierre: 1.20,       // +20% tasa de cierre con seguimiento sistematico
  reduccionAdmin: 0.55,      // -45% tiempo admin
  costePorUsuario: 29,       // EUR/usuario/mes (HubSpot Starter, Pipedrive, Zoho)
  costeImplementacion: 500,  // Setup inicial por usuario
};

function calcCRM(d: FormDataCRM): ServiceResult {
  const numCom = d.numComerciales || 1;
  const visitasDia = d.visitasDia || 4;
  const tasaCierre = (d.tasaCierre || 15) / 100;
  const ticketVenta = d.ticketMedioVenta || 100;
  const horasAdmin = d.horasAdmin || 8;

  const diasLaborables = 22;

  // Situacion actual
  const visitasMesActual = visitasDia * diasLaborables * numCom;
  const ventasMesActual = visitasMesActual * tasaCierre;
  const ingresosMesActual = ventasMesActual * ticketVenta;
  const costeAdminActual = horasAdmin * 4.33 * 15 * numCom; // 15 EUR/h bruto

  // Con CRM
  const visitasMesCRM = visitasDia * CRM_BENCHMARKS.mejoraVisitas * diasLaborables * numCom;
  const ventasMesCRM = visitasMesCRM * (tasaCierre * CRM_BENCHMARKS.mejoraCierre);
  const ingresosMesCRM = ventasMesCRM * ticketVenta;
  const costeAdminCRM = costeAdminActual * (1 - CRM_BENCHMARKS.reduccionAdmin);
  const costeCRM = numCom * CRM_BENCHMARKS.costePorUsuario;

  const beneficioVentas = ingresosMesCRM - ingresosMesActual;
  const ahorroAdmin = costeAdminActual - costeAdminCRM;
  const beneficioNeto = beneficioVentas + ahorroAdmin - costeCRM;

  return {
    gastoActual: costeAdminActual,
    gastoPropuesto: costeAdminCRM + costeCRM,
    ahorroMensual: beneficioNeto,
    ahorroAnual: beneficioNeto * 12 - (numCom * CRM_BENCHMARKS.costeImplementacion),
    porcentaje: costeAdminActual > 0 ? (beneficioNeto / costeAdminActual) * 100 : 0,
    desglose: [
      { label: 'Mas ventas por mejor seguimiento', actual: 0, propuesto: -beneficioVentas },
      { label: 'Ahorro tiempo admin', actual: costeAdminActual, propuesto: costeAdminCRM },
      { label: `Coste CRM (${numCom} usuario${numCom > 1 ? 's' : ''})`, actual: 0, propuesto: costeCRM },
    ],
    notas: [
      `Visitas/mes: ${visitasMesActual} → ${visitasMesCRM.toFixed(0)} (+${((CRM_BENCHMARKS.mejoraVisitas - 1) * 100).toFixed(0)}% con rutas optimizadas)`,
      `Tasa cierre: ${(tasaCierre * 100).toFixed(1)}% → ${(tasaCierre * CRM_BENCHMARKS.mejoraCierre * 100).toFixed(1)}% (+${((CRM_BENCHMARKS.mejoraCierre - 1) * 100).toFixed(0)}%)`,
      `Ventas/mes: ${ventasMesActual.toFixed(1)} → ${ventasMesCRM.toFixed(1)} (+${(ventasMesCRM - ventasMesActual).toFixed(1)})`,
      `Implementacion: ${eur(numCom * CRM_BENCHMARKS.costeImplementacion)} (descontada en ahorro anual)`,
      'Benchmarks: Nucleus Research, Salesforce ROI Study 2023',
    ],
  };
}

// ============================
// APLICACIONES - Consolidacion licencias
// ============================
interface FormDataAplicaciones {
  licenciasOffice: number;     // Num licencias Office 365/Google Workspace
  precioLicencia: number;      // Precio actual por licencia
  otrasApps: number;           // Gasto en otras apps SaaS
  almacenamientoTB: number;    // TB almacenamiento cloud
  tieneERP: boolean;
  gastoERP: number;
}

// Precios reales Microsoft 365 / Google Workspace en Espana
const PRECIOS_APPS = {
  m365BasicMensual: 6.00,      // Microsoft 365 Business Basic
  m365StandardMensual: 12.50,  // Microsoft 365 Business Standard
  gWorkspaceStarter: 6.90,     // Google Workspace Starter
  gWorkspaceBusiness: 13.80,   // Google Workspace Business Standard
  almacenamientoTB: 2,         // EUR/TB/mes extra
  erpCloud: 49,                // ERP basico cloud (Holded, Sage 50c) por usuario
};

function calcAplicaciones(d: FormDataAplicaciones): ServiceResult {
  const numLicencias = d.licenciasOffice || 1;
  const precioActual = d.precioLicencia || 15;
  const otrasApps = d.otrasApps || 0;
  const gastoERP = d.tieneERP ? (d.gastoERP || 0) : 0;

  const totalActual = (numLicencias * precioActual) + otrasApps + gastoERP;

  // Propuesta optimizada: M365 Business Basic + consolidar apps
  const precioPropuesto = numLicencias <= 5
    ? PRECIOS_APPS.m365BasicMensual
    : PRECIOS_APPS.m365StandardMensual * 0.9; // descuento volumen
  const gastoLicenciasPropuesto = numLicencias * precioPropuesto;

  // Consolidar otras apps en suite (muchas incluidas en M365/Google)
  const otrasAppsPropuesto = otrasApps * 0.4; // 60% de apps se eliminan al consolidar

  // ERP: proponer alternativa cloud si es caro
  let erpPropuesto = gastoERP;
  const notasERP: string[] = [];
  if (gastoERP > numLicencias * PRECIOS_APPS.erpCloud && numLicencias <= 10) {
    erpPropuesto = numLicencias * PRECIOS_APPS.erpCloud;
    notasERP.push(`ERP cloud (Holded/Sage 50c): ${PRECIOS_APPS.erpCloud} EUR/usuario vs actual`);
  }

  const totalPropuesto = gastoLicenciasPropuesto + otrasAppsPropuesto + erpPropuesto;
  const ahorro = totalActual - totalPropuesto;

  return {
    gastoActual: totalActual,
    gastoPropuesto: totalPropuesto,
    ahorroMensual: Math.max(ahorro, 0),
    ahorroAnual: Math.max(ahorro, 0) * 12,
    porcentaje: totalActual > 0 ? Math.max((ahorro / totalActual) * 100, 0) : 0,
    desglose: [
      { label: `Licencias (${numLicencias})`, actual: numLicencias * precioActual, propuesto: gastoLicenciasPropuesto },
      ...(otrasApps > 0 ? [{ label: 'Otras apps SaaS', actual: otrasApps, propuesto: otrasAppsPropuesto }] : []),
      ...(gastoERP > 0 ? [{ label: 'ERP', actual: gastoERP, propuesto: erpPropuesto }] : []),
    ],
    notas: [
      `Propuesta: Microsoft 365 Business ${numLicencias <= 5 ? 'Basic' : 'Standard'} a ${eur(precioPropuesto)}/usuario/mes`,
      numLicencias > 5 ? 'Descuento volumen 10% aplicado (+5 licencias)' : '',
      otrasApps > 0 ? 'Consolidacion: Teams, SharePoint, OneDrive eliminan necesidad de apps independientes' : '',
      ...notasERP,
    ].filter(Boolean),
  };
}

// ============================
// Calculator map
// ============================
type AllFormData = {
  energia: FormDataEnergia;
  telecomunicaciones: FormDataTelecom;
  alarmas: FormDataAlarmas;
  seguros: FormDataSeguros;
  agentes_ia: FormDataAgentesIA;
  web: FormDataWeb;
  crm: FormDataCRM;
  aplicaciones: FormDataAplicaciones;
};

const initialFormData: AllFormData = {
  energia: {
    tarifa: '3.0TD', modalidad: 'fijo',
    potP1: 30, potP2: 30, potP3: 30, potP4: 30, potP5: 30, potP6: 30,
    conP1: 400, conP2: 600, conP3: 500, conP4: 400, conP5: 300, conP6: 800,
    precioP1: 0, precioP2: 0, precioP3: 0, precioP4: 0, precioP5: 0, precioP6: 0,
    tieneReactiva: false, cosPhi: 0.90,
    tieneCompensacion: false, potenciaFV: 0,
    optimizarPotencia: false,
  },
  telecomunicaciones: { tipoFibra: '300Mb', precioFibra: 55, numLineasMovil: 2, precioMovil: 25, tieneCentralita: false, precioCentralita: 0, numExtensiones: 0 },
  alarmas: { gastoMensualCRA: 45, tieneVideovigilancia: false, numCamaras: 2, tieneControlAcceso: false, superficieM2: 80 },
  seguros: { facturacionAnual: 200000, sector: 'Comercio minorista', superficieLocal: 80, numEmpleados: 3, tipoSeguro: 'Multirriesgo local', primaActual: 1200 },
  agentes_ia: { atencionCliente: 20, gestionCitas: 10, respuestasEmail: 15, entradaDatos: 8, costeHora: 15, plan: 'profesional' },
  web: { tieneWeb: 'No', visitasMensuales: 0, ticketMedio: 50, clientesMes: 0, gastoMarketingActual: 50 },
  crm: { numComerciales: 2, visitasDia: 5, tasaCierre: 15, ticketMedioVenta: 80, horasAdmin: 8 },
  aplicaciones: { licenciasOffice: 3, precioLicencia: 15, otrasApps: 50, almacenamientoTB: 0, tieneERP: false, gastoERP: 0 },
};

const calculators: Record<ServicioTipo, (d: any) => ServiceResult> = {
  energia: calcEnergia,
  telecomunicaciones: calcTelecom,
  alarmas: calcAlarmas,
  seguros: calcSeguros,
  agentes_ia: calcAgentesIA,
  web: calcWeb,
  crm: calcCRM,
  aplicaciones: calcAplicaciones,
};

// --- Format helpers ---
function eur(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// --- Component ---
export default function Calculadora() {
  const [activeService, setActiveService] = useState<ServicioTipo>('energia');
  const [formData, setFormData] = useState<AllFormData>({ ...initialFormData });
  const [results, setResults] = useState<Partial<Record<ServicioTipo, ServiceResult>>>({});
  const [billInfo, setBillInfo] = useState<{ confianza: number; campos: string[]; advertencias: string[]; comercializadora: string | null } | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    clienteNombre: '', clienteContacto: '', clienteDireccion: '',
    clienteTelefono: '', clienteEmail: '', clienteCups: '',
    validezDias: 30, notasAdicionales: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const [showUploader, setShowUploader] = useState(false);

  const handleBillData = (data: ParsedBillData) => {
    if (data.tarifa) setFormData(prev => ({ ...prev, energia: { ...prev.energia, tarifa: data.tarifa! } }));
    if (data.potencias.length > 0) {
      setFormData(prev => ({
        ...prev,
        energia: {
          ...prev.energia,
          potP1: data.potencias[0] ?? prev.energia.potP1,
          potP2: data.potencias[1] ?? prev.energia.potP2,
          potP3: data.potencias[2] ?? prev.energia.potP3,
          potP4: data.potencias[3] ?? prev.energia.potP4,
          potP5: data.potencias[4] ?? prev.energia.potP5,
          potP6: data.potencias[5] ?? prev.energia.potP6,
        },
      }));
    }
    if (data.consumos.length > 0) {
      setFormData(prev => ({
        ...prev,
        energia: {
          ...prev.energia,
          conP1: data.consumos[0] ?? prev.energia.conP1,
          conP2: data.consumos[1] ?? prev.energia.conP2,
          conP3: data.consumos[2] ?? prev.energia.conP3,
          conP4: data.consumos[3] ?? prev.energia.conP4,
          conP5: data.consumos[4] ?? prev.energia.conP5,
          conP6: data.consumos[5] ?? prev.energia.conP6,
        },
      }));
    }
    if (data.preciosEnergia.length > 0) {
      setFormData(prev => ({
        ...prev,
        energia: {
          ...prev.energia,
          precioP1: data.preciosEnergia[0] ?? prev.energia.precioP1,
          precioP2: data.preciosEnergia[1] ?? prev.energia.precioP2,
          precioP3: data.preciosEnergia[2] ?? prev.energia.precioP3,
          precioP4: data.preciosEnergia[3] ?? prev.energia.precioP4,
          precioP5: data.preciosEnergia[4] ?? prev.energia.precioP5,
          precioP6: data.preciosEnergia[5] ?? prev.energia.precioP6,
        },
      }));
    }
    setShowUploader(false);
    setActiveService('energia');
    toast.success(`Datos importados de ${data.comercializadora || 'factura'} (confianza: ${data.confianza}%)`);
  };

  const updateField = (service: ServicioTipo, field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [service]: { ...prev[service], [field]: value },
    }));
  };

  const handleCalc = () => {
    const calc = calculators[activeService];
    const result = calc(formData[activeService]);
    setResults((prev) => ({ ...prev, [activeService]: result }));
  };

  const handleReset = () => {
    setFormData((prev) => ({ ...prev, [activeService]: { ...initialFormData[activeService] } }));
    setResults((prev) => {
      const next = { ...prev };
      delete next[activeService];
      return next;
    });
    setBillInfo(null);
  };

  // === SUBIDA Y PARSEO DE FACTURA PDF (legacy - usado por input oculto) ===
  const handleBillUpload = async (file: File) => {
    setBillInfo(null);
    try {
      const fd = new FormData();
      fd.append('factura', file);
      const res = await api.post('/bill/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data.data;

      // Mapear datos parseados al formulario de energia
      const newEnergia: any = { ...formData.energia };

      // Tarifa
      if (data.tarifa) {
        newEnergia.tarifa = data.tarifa;
      }

      // Modalidad
      if (data.modalidad) {
        newEnergia.modalidad = data.modalidad;
      }

      // Potencias
      const is2TD = (data.tarifa || newEnergia.tarifa) === '2.0TD';
      if (data.potencias.length > 0) {
        const potFields = is2TD ? ['potP1', 'potP2'] : ['potP1', 'potP2', 'potP3', 'potP4', 'potP5', 'potP6'];
        data.potencias.forEach((p: number, i: number) => {
          if (i < potFields.length) newEnergia[potFields[i]] = p;
        });
        // Si solo hay una potencia, rellenar todas iguales
        if (data.potencias.length === 1) {
          potFields.forEach(f => { newEnergia[f] = data.potencias[0]; });
        }
      }

      // Consumos
      if (data.consumos.length > 0) {
        const conFields = is2TD ? ['conP1', 'conP2', 'conP3'] : ['conP1', 'conP2', 'conP3', 'conP4', 'conP5', 'conP6'];
        data.consumos.forEach((c: number, i: number) => {
          if (i < conFields.length) newEnergia[conFields[i]] = Math.round(c);
        });
      }

      // Precios (solo modo fijo)
      if (data.preciosEnergia.length > 0 && newEnergia.modalidad !== 'indexado') {
        const precioFields = is2TD ? ['precioP1', 'precioP2', 'precioP3'] : ['precioP1', 'precioP2', 'precioP3', 'precioP4', 'precioP5', 'precioP6'];
        data.preciosEnergia.forEach((p: number, i: number) => {
          if (i < precioFields.length) newEnergia[precioFields[i]] = p;
        });
      }

      // Reactiva
      if (data.tieneReactiva) {
        newEnergia.tieneReactiva = true;
        if (data.cosPhi) newEnergia.cosPhi = data.cosPhi;
      }

      setFormData(prev => ({ ...prev, energia: newEnergia }));
      setActiveService('energia');

      setBillInfo({
        confianza: data.confianza,
        campos: data.camposExtraidos,
        advertencias: data.advertencias,
        comercializadora: data.comercializadora,
      });

      if (data.confianza >= 60) {
        toast.success(`Factura leida (${data.confianza}% confianza). Revisa los datos y pulsa Calcular.`);
      } else if (data.confianza >= 30) {
        toast.warning(`Factura parcialmente leida (${data.confianza}%). Completa los datos que falten.`);
      } else {
        toast.error(`Solo se pudo leer ${data.confianza}% de la factura. Introduce los datos manualmente.`);
      }

    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al procesar la factura';
      toast.error(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // === GENERAR OFERTA PDF ===
  const handleGeneratePDF = async () => {
    if (!proposalForm.clienteNombre.trim()) {
      toast.error('Introduce el nombre del cliente');
      return;
    }

    setGeneratingPDF(true);
    try {
      const serviciosData = Object.entries(results).map(([key, r]) => {
        const cfg = SERVICIOS_CONFIG.find(s => s.id === key);
        return {
          servicio: cfg?.label || key,
          icon: cfg?.icon || '',
          gastoActual: r.gastoActual,
          gastoPropuesto: r.gastoPropuesto,
          ahorroMensual: r.ahorroMensual,
          ahorroAnual: r.ahorroAnual,
          porcentaje: r.porcentaje,
          desglose: r.desglose,
          notas: r.notas,
        };
      });

      const payload = {
        cliente: {
          nombre: proposalForm.clienteNombre,
          contacto: proposalForm.clienteContacto,
          direccion: proposalForm.clienteDireccion,
          telefono: proposalForm.clienteTelefono,
          email: proposalForm.clienteEmail,
          cups: proposalForm.clienteCups,
        },
        comercial: {
          nombre: user ? `${user.nombre} ${user.apellidos}` : 'Comercial',
          telefono: '',
          email: user?.email || '',
        },
        empresa: {
          nombre: 'Somos Sinergia',
          slogan: 'Tu socio en ahorro energetico',
        },
        servicios: serviciosData,
        validezDias: proposalForm.validezDias,
        notasAdicionales: proposalForm.notasAdicionales,
      };

      const response = await api.post('/proposals/generate', payload, {
        responseType: 'blob',
      });

      // Descargar PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Oferta_${proposalForm.clienteNombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Oferta PDF generada y descargada');
      setShowProposalModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar el PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const currentResult = results[activeService];

  // Resumen total
  const totalResults = Object.values(results);
  const totalAhorroMensual = totalResults.reduce((s, r) => s + r.ahorroMensual, 0);
  const totalAhorroAnual = totalResults.reduce((s, r) => s + r.ahorroAnual, 0);
  const totalGastoActual = totalResults.reduce((s, r) => s + r.gastoActual, 0);
  const totalPropuesto = totalResults.reduce((s, r) => s + r.gastoPropuesto, 0);

  const svcConfig = SERVICIOS_CONFIG.find((s) => s.id === activeService)!;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora de Ahorro</h1>
          <p className="text-sm text-gray-500">Formulas reales basadas en tarifas del mercado espanol 2025</p>
        </div>
        <div className="shrink-0">
          {/* Legacy hidden input kept for handleBillUpload compatibility */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBillUpload(file);
            }}
          />
          <button
            onClick={() => setShowUploader((v) => !v)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {showUploader ? 'Ocultar importador' : 'Importar desde factura'}
          </button>
          <p className="text-[10px] text-gray-400 mt-1 text-right">PDF o foto con IA</p>
        </div>
      </div>

      {/* BillUploader expandible */}
      {showUploader && (
        <BillUploader onResult={handleBillData} compact={false} />
      )}

      {/* Service selector */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {SERVICIOS_CONFIG.map((svc) => {
          const hasResult = !!results[svc.id];
          return (
            <button
              key={svc.id}
              onClick={() => setActiveService(svc.id)}
              className={`card p-2 text-center cursor-pointer transition-all ${
                activeService === svc.id
                  ? `ring-2 ring-blue-500 ${svc.bg}`
                  : hasResult
                  ? 'ring-1 ring-green-400 bg-green-50'
                  : 'hover:shadow-md'
              }`}
            >
              <span className="text-xl">{svc.icon}</span>
              <p className="text-xs font-medium text-gray-700 mt-1 truncate">{svc.label}</p>
              {hasResult && (
                <p className="text-[10px] text-green-700 font-semibold mt-0.5">
                  {eur(results[svc.id]!.ahorroMensual)}/mes
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content: form + results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{svcConfig.icon}</span>
            <h2 className="text-lg font-bold text-gray-900">{svcConfig.label}</h2>
          </div>

          {/* Bill parse info banner */}
          {billInfo && activeService === 'energia' && (
            <div className={`rounded-lg p-3 mb-4 text-sm ${
              billInfo.confianza >= 60 ? 'bg-green-50 border border-green-200' :
              billInfo.confianza >= 30 ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">
                  {billInfo.confianza >= 60 ? 'Factura leida correctamente' :
                   billInfo.confianza >= 30 ? 'Factura parcialmente leida' :
                   'Lectura limitada'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  billInfo.confianza >= 60 ? 'bg-green-200 text-green-800' :
                  billInfo.confianza >= 30 ? 'bg-amber-200 text-amber-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {billInfo.confianza}% confianza
                </span>
              </div>
              {billInfo.comercializadora && (
                <p className="text-xs text-gray-600">Comercializadora: <strong>{billInfo.comercializadora}</strong></p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Campos extraidos: {billInfo.campos.join(', ')}
              </p>
              {billInfo.advertencias.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {billInfo.advertencias.map((a, i) => (
                    <li key={i} className="text-xs text-amber-700 flex gap-1">
                      <span>!</span> {a}
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => setBillInfo(null)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">
                Cerrar
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ServiceForm
              service={activeService}
              data={formData[activeService]}
              onChange={(field, value) => updateField(activeService, field, value)}
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleCalc} className="btn-primary">
              Calcular ahorro
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Limpiar
            </button>
          </div>
        </div>

        {/* Results card */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resultado {svcConfig.label}
          </h3>
          {currentResult ? (
            <div className="space-y-3">
              <ResultRow label="Gasto actual mensual" value={eur(currentResult.gastoActual)} />
              <ResultRow label="Gasto propuesto mensual" value={eur(currentResult.gastoPropuesto)} />
              <div className="border-t pt-3">
                <ResultRow
                  label="Ahorro mensual"
                  value={eur(currentResult.ahorroMensual)}
                  className="text-green-700 font-bold text-lg"
                />
              </div>
              <ResultRow
                label="Ahorro anual"
                value={eur(currentResult.ahorroAnual)}
                className="text-green-700 font-extrabold text-xl"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Porcentaje ahorro</span>
                <span className="text-sm font-bold text-green-700">
                  {currentResult.porcentaje.toFixed(1)}%
                </span>
              </div>

              {/* Desglose */}
              {currentResult.desglose.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Desglose</p>
                  <div className="space-y-1.5">
                    {currentResult.desglose.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{d.label}</span>
                        <div className="flex gap-3">
                          <span className="text-gray-400 line-through">{eur(d.actual)}</span>
                          <span className="text-green-700 font-medium">{eur(d.propuesto)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {currentResult.notas.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Base del calculo</p>
                  <ul className="space-y-1">
                    {currentResult.notas.map((n, i) => (
                      <li key={i} className="text-[11px] text-gray-500 flex gap-1">
                        <span className="text-gray-400 shrink-0">•</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Introduce los datos y pulsa &quot;Calcular ahorro&quot;
            </div>
          )}
        </div>
      </div>

      {/* Resumen total */}
      {totalResults.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resumen total ({totalResults.length} servicio{totalResults.length > 1 ? 's' : ''})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryBox label="Total gasto actual" value={eur(totalGastoActual)} />
            <SummaryBox label="Total propuesto" value={eur(totalPropuesto)} />
            <SummaryBox label="Ahorro mensual" value={eur(totalAhorroMensual)} highlight />
            <SummaryBox label="Ahorro anual" value={eur(totalAhorroAnual)} highlight big />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowProposalModal(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generar oferta PDF
            </button>
          </div>
        </div>
      )}

      {/* Modal generar oferta */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Generar oferta PDF</h2>
                <button onClick={() => setShowProposalModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Se generara un PDF profesional con el desglose de ahorro de {Object.keys(results).length} servicio{Object.keys(results).length > 1 ? 's' : ''}.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
                  <input type="text" className="input-field" placeholder="Ej: Bar El Rinconcito"
                    value={proposalForm.clienteNombre}
                    onChange={(e) => setProposalForm(p => ({ ...p, clienteNombre: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Persona de contacto</label>
                    <input type="text" className="input-field" placeholder="Ej: Juan Garcia"
                      value={proposalForm.clienteContacto}
                      onChange={(e) => setProposalForm(p => ({ ...p, clienteContacto: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input type="text" className="input-field" placeholder="Ej: 612 345 678"
                      value={proposalForm.clienteTelefono}
                      onChange={(e) => setProposalForm(p => ({ ...p, clienteTelefono: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                  <input type="text" className="input-field" placeholder="Ej: C/ Gran Via 45, Madrid"
                    value={proposalForm.clienteDireccion}
                    onChange={(e) => setProposalForm(p => ({ ...p, clienteDireccion: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="input-field" placeholder="cliente@email.com"
                      value={proposalForm.clienteEmail}
                      onChange={(e) => setProposalForm(p => ({ ...p, clienteEmail: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CUPS</label>
                    <input type="text" className="input-field" placeholder="ES0021..."
                      value={proposalForm.clienteCups}
                      onChange={(e) => setProposalForm(p => ({ ...p, clienteCups: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validez oferta</label>
                    <select className="input-field"
                      value={proposalForm.validezDias}
                      onChange={(e) => setProposalForm(p => ({ ...p, validezDias: parseInt(e.target.value) }))}>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={60}>60 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                  <textarea className="input-field" rows={2} placeholder="Condiciones especiales, descuentos..."
                    value={proposalForm.notasAdicionales}
                    onChange={(e) => setProposalForm(p => ({ ...p, notasAdicionales: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowProposalModal(false)} className="btn-secondary">Cancelar</button>
                <button onClick={handleGeneratePDF} disabled={generatingPDF} className="btn-primary flex items-center gap-2">
                  {generatingPDF ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                      </svg>
                      Generando PDF...
                    </>
                  ) : (
                    'Descargar PDF'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function ResultRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={className || 'text-sm font-semibold text-gray-900'}>{value}</span>
    </div>
  );
}

function SummaryBox({ label, value, highlight, big }: { label: string; value: string; highlight?: boolean; big?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-green-50' : 'bg-gray-50'}`}>
      <p className={`font-bold ${big ? 'text-xl' : 'text-lg'} ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// --- Service-specific forms ---
function ServiceForm({
  service,
  data,
  onChange,
}: {
  service: ServicioTipo;
  data: any;
  onChange: (field: string, value: string | number | boolean) => void;
}) {
  const numInput = (field: string, label: string, placeholder?: string, step?: string, suffix?: string) => (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          className="input-field"
          placeholder={placeholder}
          step={step || '1'}
          min="0"
          value={data[field] || ''}
          onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );

  const selectInput = (field: string, label: string, options: { value: string; label: string }[]) => (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        className="input-field"
        value={data[field] || options[0]?.value}
        onChange={(e) => onChange(field, e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const checkInput = (field: string, label: string) => (
    <div key={field} className="flex items-center gap-2 py-2">
      <input
        type="checkbox"
        id={field}
        checked={!!data[field]}
        onChange={(e) => onChange(field, e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <label htmlFor={field} className="text-sm text-gray-700">{label}</label>
    </div>
  );

  switch (service) {
    case 'energia': {
      const is2TD = data.tarifa === '2.0TD';
      const periodLabels = is2TD
        ? ['P1 Punta (10-14h, 18-22h)', 'P2 Llano (8-10h, 14-18h, 22-24h)', 'P3 Valle (0-8h, fds)']
        : ['P1 Punta (alta: 9-14h, 18-22h)', 'P2 (alta: hombro + media-alta: central)', 'P3 (media: central + tarde)',
           'P4 (baja: central + tarde)', 'P5 (baja: hombro)', 'P6 Valle (noches 0-8h + fds/festivos)'];
      const potLabels = is2TD
        ? ['P1 Punta', 'P2 Valle']
        : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
      const potFields = is2TD ? ['potP1', 'potP2'] : ['potP1', 'potP2', 'potP3', 'potP4', 'potP5', 'potP6'];
      const conFields = is2TD ? ['conP1', 'conP2', 'conP3'] : ['conP1', 'conP2', 'conP3', 'conP4', 'conP5', 'conP6'];
      const precioFields = is2TD ? ['precioP1', 'precioP2', 'precioP3'] : ['precioP1', 'precioP2', 'precioP3', 'precioP4', 'precioP5', 'precioP6'];

      return (
        <>
          {/* Tarifa y modalidad */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-4">
            {selectInput('tarifa', 'Tarifa de acceso', [
              { value: '2.0TD', label: '2.0TD (≤ 15kW, comercio pequeno)' },
              { value: '3.0TD', label: '3.0TD (15-450kW, PYME)' },
              { value: '6.1TD', label: '6.1TD (> 450kW, AT 1-30kV)' },
            ])}
            {selectInput('modalidad', 'Modalidad de precio', [
              { value: 'fijo', label: 'Precio fijo (cerrado)' },
              { value: 'indexado', label: 'Indexado al pool OMIE' },
            ])}
          </div>

          {/* Potencias contratadas */}
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">Potencias contratadas (kW)</p>
            <div className={`grid gap-3 ${is2TD ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-6'}`}>
              {potFields.map((field, i) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{potLabels[i]}</label>
                  <input type="number" className="input-field text-sm" step="0.1" min="0"
                    value={data[field] || ''} onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)} />
                </div>
              ))}
            </div>
            {!is2TD && (
              <p className="text-[10px] text-gray-400 mt-1">Restriccion 3.0TD/6.1TD: P1 ≥ P2 ≥ P3 ≥ P4 ≥ P5 ≥ P6</p>
            )}
          </div>

          {/* Consumos por periodo */}
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">Consumos mensuales por periodo (kWh/mes)</p>
            <div className={`grid gap-3 ${is2TD ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
              {conFields.map((field, i) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{periodLabels[i].split(' (')[0]}</label>
                  <input type="number" className="input-field text-sm" step="1" min="0"
                    placeholder={`Ej: ${[400, 600, 500, 400, 300, 800][i]}`}
                    value={data[field] || ''} onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>

          {/* Precios actuales (solo modo fijo) */}
          {data.modalidad === 'fijo' && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-gray-700 mb-1">Precios actuales del cliente (EUR/kWh) <span className="text-xs text-gray-400 font-normal">— opcional, de la factura</span></p>
              <div className={`grid gap-3 ${is2TD ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
                {precioFields.map((field, i) => (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 mb-1">{periodLabels[i].split(' (')[0]}</label>
                    <input type="number" className="input-field text-sm" step="0.001" min="0"
                      placeholder={`Ej: ${(0.14 - i * 0.015).toFixed(3)}`}
                      value={data[field] || ''} onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Si no introduces precios, se estimaran con pool + margen incumbente</p>
            </div>
          )}

          {/* Opciones avanzadas */}
          <div className="sm:col-span-2 space-y-1">
            {checkInput('optimizarPotencia', 'Proponer optimizacion de potencia (-10%)')}
            {!is2TD && checkInput('tieneReactiva', 'Tiene penalizacion por energia reactiva')}
            {!is2TD && data.tieneReactiva && (
              <div className="ml-6">
                {numInput('cosPhi', 'Factor de potencia (cos φ)', 'Ej: 0.85', '0.01')}
                <p className="text-[10px] text-gray-400 mt-1">≥ 0.95: sin penalizacion | 0.80-0.95: moderada (0,0416 EUR/kVArh) | &lt; 0.80: alta (0,0623 EUR/kVArh)</p>
              </div>
            )}
            {checkInput('tieneCompensacion', 'Compensacion excedentes fotovoltaicos')}
            {data.tieneCompensacion && numInput('potenciaFV', 'Potencia FV instalada', 'Ej: 10', '0.1', 'kWp')}
          </div>

          {/* Info box */}
          <div className="sm:col-span-2 text-xs text-gray-500 bg-blue-50 rounded-lg p-3 space-y-1">
            <p><strong>Horarios {is2TD ? '2.0TD' : '3.0TD/6.1TD'} (Peninsula, L-V laborables):</strong></p>
            {is2TD ? (
              <p>P1: 10-14h y 18-22h | P2: 8-10h, 14-18h, 22-24h | P3: 0-8h + fds/festivos</p>
            ) : (
              <div className="text-[10px] leading-relaxed">
                <p><strong>Alta</strong> (Ene,Feb,Jul,Dic): 9-14h/18-22h=P1 | 8-9h/14-18h/22-24h=P2 | 0-8h=P6</p>
                <p><strong>Media-Alta</strong> (Mar,Nov): central/tarde=P2 | hombro=P3 | noche=P6</p>
                <p><strong>Media</strong> (Jun,Ago,Sep): central/tarde=P3 | hombro=P4 | noche=P6</p>
                <p><strong>Baja</strong> (Abr,May,Oct): central/tarde=P4 | hombro=P5 | noche=P6</p>
                <p><strong>Fds/festivos = P6 las 24h</strong></p>
              </div>
            )}
            {data.modalidad === 'indexado' && (
              <p className="mt-1"><strong>Indexado:</strong> Pool OMIE + perdidas + peajes + cargos + capacidad + FNEE + desvios + fee gestion</p>
            )}
          </div>
        </>
      );
    }

    case 'telecomunicaciones':
      return (
        <>
          {selectInput('tipoFibra', 'Velocidad fibra', [
            { value: '100Mb', label: '100 Mb' },
            { value: '300Mb', label: '300 Mb' },
            { value: '600Mb', label: '600 Mb' },
            { value: '1Gb', label: '1 Gbps' },
          ])}
          {numInput('precioFibra', 'Coste actual fibra', 'Ej: 55', '0.01', 'EUR/mes')}
          {numInput('numLineasMovil', 'Numero de lineas movil', 'Ej: 3')}
          {numInput('precioMovil', 'Coste por linea movil', 'Ej: 25', '0.01', 'EUR/mes')}
          {checkInput('tieneCentralita', 'Tiene centralita telefonica')}
          {data.tieneCentralita && (
            <>
              {numInput('precioCentralita', 'Coste actual centralita', 'Ej: 80', '0.01', 'EUR/mes')}
              {numInput('numExtensiones', 'Numero de extensiones', 'Ej: 5')}
            </>
          )}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            Comparamos tarifas de operadores incumbentes (Movistar, Vodafone, Orange) con operadores
            alternativos empresariales (MasMovil Negocios, Digi Business) que usan la misma red de fibra.
          </div>
        </>
      );

    case 'alarmas':
      return (
        <>
          {numInput('gastoMensualCRA', 'Cuota CRA actual', 'Ej: 45', '0.01', 'EUR/mes')}
          {numInput('superficieM2', 'Superficie del local', 'Ej: 80', '1', 'm2')}
          {checkInput('tieneVideovigilancia', 'Videovigilancia (camaras IP)')}
          {data.tieneVideovigilancia && numInput('numCamaras', 'Numero de camaras', 'Ej: 4')}
          {checkInput('tieneControlAcceso', 'Control de acceso (tarjetas/biometrico)')}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            Comparamos cuotas de Securitas Direct (~45 EUR/mes) y Prosegur (~42 EUR/mes) con
            CRA alternativas certificadas Grado 2 sin permanencia. Equipo en comodato incluido.
          </div>
        </>
      );

    case 'seguros':
      return (
        <>
          {selectInput('tipoSeguro', 'Tipo de seguro', [
            { value: 'Multirriesgo local', label: 'Multirriesgo local/negocio' },
            { value: 'Responsabilidad civil', label: 'Responsabilidad civil profesional' },
            { value: 'Vehiculos flota', label: 'Vehiculos / Flota' },
            { value: 'Salud colectivo', label: 'Salud colectivo empleados' },
          ])}
          {selectInput('sector', 'Sector de actividad', Object.keys(TASAS_SECTOR).map(s => ({ value: s, label: s })))}
          {numInput('primaActual', 'Prima anual actual', 'Ej: 1200', '0.01', 'EUR/ano')}
          {numInput('facturacionAnual', 'Facturacion anual del negocio', 'Ej: 200000', '1', 'EUR')}
          {numInput('superficieLocal', 'Superficie del local', 'Ej: 80', '1', 'm2')}
          {numInput('numEmpleados', 'Numero de empleados', 'Ej: 3')}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            Prima calculada con tasas reales por sector (por mil de facturacion), valor de contenido
            estimado al 15% de facturacion, y RC por empleado segun riesgo del sector.
          </div>
        </>
      );

    case 'agentes_ia':
      return (
        <>
          {selectInput('plan', 'Plan de IA', [
            { value: 'basico', label: 'Basico - Chatbot + Agenda (97 EUR/mes)' },
            { value: 'profesional', label: 'Profesional - + Email + Datos (197 EUR/mes)' },
            { value: 'enterprise', label: 'Enterprise - Personalizado + API (397 EUR/mes)' },
          ])}
          {numInput('atencionCliente', 'Horas/mes atencion al cliente', 'Ej: 20', '1', 'h/mes')}
          {numInput('gestionCitas', 'Horas/mes gestion de citas', 'Ej: 10', '1', 'h/mes')}
          {numInput('respuestasEmail', 'Horas/mes emails repetitivos', 'Ej: 15', '1', 'h/mes')}
          {numInput('entradaDatos', 'Horas/mes entrada manual datos', 'Ej: 8', '1', 'h/mes')}
          {numInput('costeHora', 'Coste hora empleado (bruto empresa)', 'Ej: 15', '0.5', 'EUR/h')}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            Tasas de automatizacion: Atencion al cliente 60% (chatbot L1), Citas 85% (booking auto),
            Email 70% (clasificacion + templates), Datos 90% (OCR + extraccion).
            Fuentes: Gartner 2024, McKinsey Digital.
          </div>
        </>
      );

    case 'web':
      return (
        <>
          {selectInput('tieneWeb', 'Estado web actual', [
            { value: 'No', label: 'No tiene pagina web' },
            { value: 'Si', label: 'Tiene web actualizada' },
            { value: 'Desactualizada', label: 'Tiene web desactualizada/sin SEO' },
          ])}
          {numInput('ticketMedio', 'Valor medio de un cliente nuevo', 'Ej: 50', '1', 'EUR')}
          {numInput('gastoMarketingActual', 'Gasto marketing actual (folletos, etc)', 'Ej: 50', '1', 'EUR/mes')}
          {data.tieneWeb !== 'No' && (
            <>
              {numInput('visitasMensuales', 'Visitas web mensuales', 'Ej: 500')}
              {numInput('clientesMes', 'Clientes nuevos via web al mes', 'Ej: 5')}
            </>
          )}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            {data.tieneWeb === 'No'
              ? 'Sin web: estimamos 200 visitas/mes via Google My Business + SEO local, con 2% conversion. Web basica WordPress desde 1.200 EUR.'
              : 'Con optimizacion SEO + CRO se mejora la tasa de conversion entre x1.5 y x2.5 segun estado actual de la web.'}
          </div>
        </>
      );

    case 'crm':
      return (
        <>
          {numInput('numComerciales', 'Numero de comerciales', 'Ej: 2')}
          {numInput('visitasDia', 'Visitas por comercial al dia', 'Ej: 5')}
          {numInput('tasaCierre', 'Tasa de cierre actual', 'Ej: 15', '0.5', '%')}
          {numInput('ticketMedioVenta', 'Ticket medio por venta', 'Ej: 80', '1', 'EUR')}
          {numInput('horasAdmin', 'Horas admin por comercial/semana', 'Ej: 8', '0.5', 'h/sem')}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            El CRM mejora: +25% visitas/dia (rutas optimizadas), +20% tasa cierre (seguimiento sistematico),
            -45% tiempo admin (automatizacion). Coste: 29 EUR/usuario/mes (HubSpot Starter / Pipedrive).
            Fuentes: Nucleus Research, Salesforce ROI Study 2023.
          </div>
        </>
      );

    case 'aplicaciones':
      return (
        <>
          {numInput('licenciasOffice', 'Num. licencias Office/Google', 'Ej: 5')}
          {numInput('precioLicencia', 'Precio actual por licencia', 'Ej: 15', '0.01', 'EUR/mes')}
          {numInput('otrasApps', 'Gasto en otras apps SaaS', 'Ej: 50', '0.01', 'EUR/mes')}
          {checkInput('tieneERP', 'Tiene ERP / software de gestion')}
          {data.tieneERP && numInput('gastoERP', 'Coste actual ERP', 'Ej: 200', '0.01', 'EUR/mes')}
          <div className="sm:col-span-2 text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
            Microsoft 365 Business Basic: 6 EUR/usuario/mes | Standard: 12,50 EUR/usuario/mes.
            Google Workspace: 6,90 - 13,80 EUR/usuario. Consolidar apps en suite elimina ~60% de costes SaaS independientes.
          </div>
        </>
      );

    default:
      return null;
  }
}

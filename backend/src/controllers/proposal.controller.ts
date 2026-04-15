import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import puppeteer from 'puppeteer';

interface PeriodoDesglose {
  label: string;
  actual: number;
  propuesto: number;
}

interface ServicioCalculo {
  servicio: string;
  icon: string;
  gastoActual: number;
  gastoPropuesto: number;
  ahorroMensual: number;
  ahorroAnual: number;
  porcentaje: number;
  desglose: PeriodoDesglose[];
  notas: string[];
}

interface ProposalData {
  // Datos del cliente
  cliente: {
    nombre: string;
    contacto?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    cups?: string;
  };
  // Datos del comercial
  comercial: {
    nombre: string;
    telefono?: string;
    email?: string;
  };
  // Datos de la empresa
  empresa: {
    nombre: string;
    slogan?: string;
  };
  // Servicios calculados
  servicios: ServicioCalculo[];
  // Notas adicionales
  notasAdicionales?: string;
  // Validez de la oferta (dias)
  validezDias?: number;
}

function eur(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function generateHTML(data: ProposalData): string {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const refNum = `OF-${Date.now().toString(36).toUpperCase()}`;
  const validez = data.validezDias || 30;
  const fechaValidez = new Date(Date.now() + validez * 86400000).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  const totalActual = data.servicios.reduce((s, sv) => s + sv.gastoActual, 0);
  const totalPropuesto = data.servicios.reduce((s, sv) => s + sv.gastoPropuesto, 0);
  const totalAhorroMensual = data.servicios.reduce((s, sv) => s + sv.ahorroMensual, 0);
  const totalAhorroAnual = data.servicios.reduce((s, sv) => s + sv.ahorroAnual, 0);
  const pctTotal = totalActual > 0 ? (totalAhorroMensual / totalActual * 100) : 0;

  // Generar secciones de servicios
  const serviciosSections = data.servicios.map((sv, idx) => `
    <div class="servicio-section ${idx > 0 ? 'page-break' : ''}">
      <div class="servicio-header">
        <span class="servicio-icon">${sv.icon}</span>
        <h3>${sv.servicio}</h3>
      </div>

      <div class="comparativa-grid">
        <div class="comparativa-box actual">
          <div class="comparativa-label">Coste actual</div>
          <div class="comparativa-valor">${eur(sv.gastoActual)}<span>/mes</span></div>
        </div>
        <div class="comparativa-arrow">→</div>
        <div class="comparativa-box propuesto">
          <div class="comparativa-label">Nuestra oferta</div>
          <div class="comparativa-valor">${eur(sv.gastoPropuesto)}<span>/mes</span></div>
        </div>
        <div class="comparativa-box ahorro">
          <div class="comparativa-label">Tu ahorro</div>
          <div class="comparativa-valor">${eur(sv.ahorroMensual)}<span>/mes</span></div>
          <div class="comparativa-sub">${eur(sv.ahorroAnual)}/año (${sv.porcentaje.toFixed(1)}%)</div>
        </div>
      </div>

      ${sv.desglose.length > 0 ? `
        <table class="desglose-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Actual</th>
              <th>Propuesto</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            ${sv.desglose.map(d => `
              <tr>
                <td>${d.label}</td>
                <td class="num">${eur(d.actual)}</td>
                <td class="num propuesto-cell">${eur(d.propuesto)}</td>
                <td class="num ${d.actual - d.propuesto > 0 ? 'ahorro-cell' : ''}">${eur(d.actual - d.propuesto)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${sv.notas.length > 0 ? `
        <div class="notas-box">
          <div class="notas-titulo">Base del calculo</div>
          <ul>
            ${sv.notas.filter(n => n).map(n => `<li>${n}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1a2e;
    font-size: 11px;
    line-height: 1.5;
    background: white;
  }

  .page {
    padding: 40px 50px;
    min-height: 100vh;
    position: relative;
  }

  .page-break {
    page-break-before: always;
    padding-top: 30px;
  }

  /* === HEADER === */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 3px solid #2563eb;
  }

  .header-left h1 {
    font-size: 28px;
    font-weight: 800;
    color: #2563eb;
    letter-spacing: -0.5px;
  }

  .header-left .slogan {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }

  .header-right {
    text-align: right;
  }

  .header-right .doc-type {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }

  .header-right .ref {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .header-right .fecha {
    font-size: 11px;
    color: #475569;
    margin-top: 4px;
  }

  /* === DATOS CLIENTE / COMERCIAL === */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }

  .info-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px 20px;
    border-left: 4px solid #2563eb;
  }

  .info-box.comercial {
    border-left-color: #10b981;
  }

  .info-box h4 {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .info-box .nombre {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .info-box .detalle {
    font-size: 10px;
    color: #64748b;
    line-height: 1.6;
  }

  /* === RESUMEN EJECUTIVO === */
  .resumen-ejecutivo {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    border-radius: 12px;
    padding: 24px 30px;
    margin-bottom: 30px;
    color: white;
  }

  .resumen-ejecutivo h2 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;
  }

  .resumen-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .resumen-item {
    text-align: center;
  }

  .resumen-item .valor {
    font-size: 24px;
    font-weight: 800;
  }

  .resumen-item .valor.highlight {
    color: #86efac;
  }

  .resumen-item .etiqueta {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.8;
    margin-top: 4px;
  }

  /* === SERVICIOS === */
  .servicio-section {
    margin-bottom: 24px;
  }

  .servicio-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
  }

  .servicio-icon {
    font-size: 22px;
  }

  .servicio-header h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }

  /* === COMPARATIVA === */
  .comparativa-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr 1fr;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }

  .comparativa-box {
    border-radius: 8px;
    padding: 14px 16px;
    text-align: center;
  }

  .comparativa-box.actual {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }

  .comparativa-box.propuesto {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }

  .comparativa-box.ahorro {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  .comparativa-arrow {
    font-size: 20px;
    color: #94a3b8;
    text-align: center;
  }

  .comparativa-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .comparativa-valor {
    font-size: 18px;
    font-weight: 800;
    color: #1e293b;
  }

  .comparativa-valor span {
    font-size: 11px;
    font-weight: 400;
    color: #94a3b8;
  }

  .comparativa-box.ahorro .comparativa-valor {
    color: #16a34a;
  }

  .comparativa-sub {
    font-size: 10px;
    color: #16a34a;
    font-weight: 600;
    margin-top: 2px;
  }

  /* === TABLA DESGLOSE === */
  .desglose-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 10px;
  }

  .desglose-table thead {
    background: #f1f5f9;
  }

  .desglose-table th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    color: #475569;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0;
  }

  .desglose-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }

  .desglose-table .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: 'Courier New', monospace;
  }

  .desglose-table .propuesto-cell {
    color: #2563eb;
    font-weight: 600;
  }

  .desglose-table .ahorro-cell {
    color: #16a34a;
    font-weight: 700;
  }

  .desglose-table tbody tr:hover {
    background: #f8fafc;
  }

  /* === NOTAS === */
  .notas-box {
    background: #f8fafc;
    border-radius: 6px;
    padding: 10px 14px;
    border-left: 3px solid #94a3b8;
  }

  .notas-titulo {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94a3b8;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .notas-box ul {
    list-style: none;
    padding: 0;
  }

  .notas-box li {
    font-size: 9px;
    color: #64748b;
    line-height: 1.5;
    padding-left: 10px;
    position: relative;
  }

  .notas-box li:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #94a3b8;
  }

  /* === RESUMEN SERVICIOS === */
  .resumen-servicios {
    margin-top: 20px;
  }

  .resumen-servicios table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .resumen-servicios th {
    background: #1e293b;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .resumen-servicios th:not(:first-child) {
    text-align: right;
  }

  .resumen-servicios td {
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }

  .resumen-servicios td:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: 'Courier New', monospace;
  }

  .resumen-servicios .row-total {
    background: #f0fdf4;
    font-weight: 800;
  }

  .resumen-servicios .row-total td {
    border-bottom: 2px solid #16a34a;
    color: #15803d;
    font-size: 13px;
  }

  /* === FOOTER === */
  .footer {
    margin-top: 30px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }

  .condiciones {
    font-size: 9px;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .condiciones h4 {
    font-size: 10px;
    color: #64748b;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .firma-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 30px;
  }

  .firma-box {
    text-align: center;
    padding-top: 60px;
    border-top: 1px solid #cbd5e1;
  }

  .firma-box .nombre {
    font-size: 11px;
    font-weight: 600;
    color: #1e293b;
  }

  .firma-box .cargo {
    font-size: 9px;
    color: #94a3b8;
  }

  /* === MARCA DE AGUA === */
  .watermark {
    position: fixed;
    bottom: 20px;
    right: 50px;
    font-size: 8px;
    color: #cbd5e1;
  }
</style>
</head>
<body>

<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <h1>${data.empresa.nombre}</h1>
      ${data.empresa.slogan ? `<div class="slogan">${data.empresa.slogan}</div>` : ''}
    </div>
    <div class="header-right">
      <div class="doc-type">Propuesta de Ahorro</div>
      <div class="ref">Ref: ${refNum}</div>
      <div class="fecha">${fecha}</div>
    </div>
  </div>

  <!-- DATOS CLIENTE / COMERCIAL -->
  <div class="info-grid">
    <div class="info-box">
      <h4>Cliente</h4>
      <div class="nombre">${data.cliente.nombre}</div>
      <div class="detalle">
        ${data.cliente.contacto ? `${data.cliente.contacto}<br>` : ''}
        ${data.cliente.direccion ? `${data.cliente.direccion}<br>` : ''}
        ${data.cliente.telefono ? `Tel: ${data.cliente.telefono}<br>` : ''}
        ${data.cliente.email ? `${data.cliente.email}<br>` : ''}
        ${data.cliente.cups ? `CUPS: ${data.cliente.cups}` : ''}
      </div>
    </div>
    <div class="info-box comercial">
      <h4>Su asesor</h4>
      <div class="nombre">${data.comercial.nombre}</div>
      <div class="detalle">
        ${data.empresa.nombre}<br>
        ${data.comercial.telefono ? `Tel: ${data.comercial.telefono}<br>` : ''}
        ${data.comercial.email ? `${data.comercial.email}` : ''}
      </div>
    </div>
  </div>

  <!-- RESUMEN EJECUTIVO -->
  <div class="resumen-ejecutivo">
    <h2>Resumen de ahorro</h2>
    <div class="resumen-grid">
      <div class="resumen-item">
        <div class="valor">${eur(totalActual)}</div>
        <div class="etiqueta">Gasto actual / mes</div>
      </div>
      <div class="resumen-item">
        <div class="valor">${eur(totalPropuesto)}</div>
        <div class="etiqueta">Nuestra propuesta / mes</div>
      </div>
      <div class="resumen-item">
        <div class="valor highlight">${eur(totalAhorroMensual)}</div>
        <div class="etiqueta">Ahorro mensual</div>
      </div>
      <div class="resumen-item">
        <div class="valor highlight">${eur(totalAhorroAnual)}</div>
        <div class="etiqueta">Ahorro anual (${pctTotal.toFixed(1)}%)</div>
      </div>
    </div>
  </div>

  <!-- DETALLE POR SERVICIO -->
  ${serviciosSections}

  <!-- RESUMEN TABLA -->
  ${data.servicios.length > 1 ? `
    <div class="resumen-servicios page-break">
      <div class="servicio-header">
        <h3>Resumen por servicio</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Actual</th>
            <th>Propuesta</th>
            <th>Ahorro/mes</th>
            <th>Ahorro/año</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          ${data.servicios.map(sv => `
            <tr>
              <td>${sv.icon} ${sv.servicio}</td>
              <td>${eur(sv.gastoActual)}</td>
              <td>${eur(sv.gastoPropuesto)}</td>
              <td>${eur(sv.ahorroMensual)}</td>
              <td>${eur(sv.ahorroAnual)}</td>
              <td>${sv.porcentaje.toFixed(1)}%</td>
            </tr>
          `).join('')}
          <tr class="row-total">
            <td>TOTAL</td>
            <td>${eur(totalActual)}</td>
            <td>${eur(totalPropuesto)}</td>
            <td>${eur(totalAhorroMensual)}</td>
            <td>${eur(totalAhorroAnual)}</td>
            <td>${pctTotal.toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <div class="condiciones">
      <h4>Condiciones de la oferta</h4>
      <p>• Esta propuesta tiene una validez de ${validez} dias (hasta el ${fechaValidez}).</p>
      <p>• Los precios incluyen todos los impuestos vigentes (IEE ${(0.0511269632 * 100).toFixed(2)}%, IVA 21%).</p>
      <p>• Los ahorros son estimaciones basadas en los consumos actuales declarados por el cliente.</p>
      <p>• Los peajes y cargos regulados (ATR) estan sujetos a la normativa vigente y pueden variar por decision del regulador.</p>
      <p>• El ahorro real dependera del consumo efectivo durante el periodo de contratacion.</p>
      ${data.notasAdicionales ? `<p>• ${data.notasAdicionales}</p>` : ''}
    </div>

    <div class="firma-grid">
      <div class="firma-box">
        <div class="nombre">${data.cliente.contacto || data.cliente.nombre}</div>
        <div class="cargo">Cliente</div>
      </div>
      <div class="firma-box">
        <div class="nombre">${data.comercial.nombre}</div>
        <div class="cargo">${data.empresa.nombre}</div>
      </div>
    </div>
  </div>
</div>

<div class="watermark">Generado el ${fecha} | ${data.empresa.nombre}</div>

</body>
</html>`;
}

export async function generateProposal(req: AuthRequest, res: Response, next: NextFunction) {
  let browser;
  try {
    const data: ProposalData = req.body;

    if (!data.servicios || data.servicios.length === 0) {
      return res.status(400).json({ error: 'Debes calcular al menos un servicio antes de generar la oferta' });
    }

    if (!data.cliente?.nombre) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }

    const html = generateHTML(data);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();
    browser = null;

    const filename = `Oferta_${data.cliente.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);

  } catch (error: any) {
    if (browser) try { await browser.close(); } catch { /* */ }
    next(error);
  }
}

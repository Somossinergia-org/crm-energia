# Spanish Electricity Market Reference - Calculator Data
# Last updated: April 2026
# Sources: CNMC, BOE, OMIE, REE, Orden TED/1487/2024

---

## 1. TARIFF STRUCTURE OVERVIEW

| Tariff | Voltage | Power Range | Power Periods | Energy Periods |
|--------|---------|-------------|---------------|----------------|
| 2.0TD  | BT (<1kV) | <= 15 kW | 2 (P1, P2) | 3 (P1, P2, P3) |
| 3.0TD  | BT (<1kV) | 15-450 kW | 6 (P1-P6) | 6 (P1-P6) |
| 6.1TD  | AT (1-30kV) | > 450 kW | 6 (P1-P6) | 6 (P1-P6) |
| 6.2TD  | AT (30-72.5kV) | > 450 kW | 6 (P1-P6) | 6 (P1-P6) |
| 6.3TD  | AT (72.5-145kV) | > 450 kW | 6 (P1-P6) | 6 (P1-P6) |
| 6.4TD  | AT (>145kV) | > 450 kW | 6 (P1-P6) | 6 (P1-P6) |

---

## 2. PEAJES DE TRANSPORTE Y DISTRIBUCION (CNMC) - 2025

### Values from BOE-A-2024-26218 (Resolution 4 Dec 2024, effective 1 Jan 2025)
### Peajes = set by CNMC (independent regulator)

### 2.1 Tarifa 2.0TD - PEAJES

**Potencia (EUR/kW/anio):**
| Periodo | EUR/kW/anio |
|---------|-------------|
| P1 (punta) | 21.8930 |
| P2 (valle)  | 3.1130  |

**Energia (EUR/kWh):**
| Periodo | EUR/kWh |
|---------|---------|
| P1 (punta) | 0.000780 |
| P2 (llano) | 0.000130 |
| P3 (valle) | 0.000016 |

### 2.2 Tarifa 3.0TD - PEAJES

**Potencia (EUR/kW/anio):**
| Periodo | EUR/kW/anio |
|---------|-------------|
| P1 | 13.3220 |
| P2 | 6.7590  |
| P3 | 4.9380  |
| P4 | 4.9380  |
| P5 | 4.9380  |
| P6 | 2.3960  |

**Energia (EUR/kWh):**
| Periodo | EUR/kWh |
|---------|---------|
| P1 | 0.008860 |
| P2 | 0.006880 |
| P3 | 0.004360 |
| P4 | 0.002380 |
| P5 | 0.001220 |
| P6 | 0.000650 |

### 2.3 Tarifa 6.1TD - PEAJES

**Potencia (EUR/kW/anio):**
| Periodo | EUR/kW/anio |
|---------|-------------|
| P1 | 10.2500 |
| P2 | 5.1990  |
| P3 | 3.7990  |
| P4 | 3.7990  |
| P5 | 3.7990  |
| P6 | 1.8440  |

**Energia (EUR/kWh):**
| Periodo | EUR/kWh |
|---------|---------|
| P1 | 0.005010 |
| P2 | 0.003880 |
| P3 | 0.002470 |
| P4 | 0.001330 |
| P5 | 0.000690 |
| P6 | 0.000360 |

---

## 3. CARGOS DEL SISTEMA ELECTRICO - 2025

### Values from Orden TED/1487/2024 (BOE-A-2024-27289, effective 1 Jan 2025)
### Cargos = set by Government (Ministerio Transicion Ecologica)
### Increased ~32.8% vs 2024 across all tariffs

### 3.1 Tarifa 2.0TD - CARGOS

**Potencia (EUR/kW/anio):**
| Periodo | EUR/kW/anio |
|---------|-------------|
| P1 (punta) | 8.5890 |
| P2 (valle)  | 1.0700  |

**Energia (EUR/kWh):**
| Periodo | EUR/kWh |
|---------|---------|
| P1 (punta) | 0.023980 |
| P2 (llano) | 0.005100 |
| P3 (valle) | 0.001020 |

### 3.2 Tarifa 3.0TD - CARGOS

**Potencia (EUR/kW/anio):**
| Periodo | EUR/kW/anio |
|---------|-------------|
| P1 | 11.0970 |
| P2 | 5.6340  |
| P3 | 4.1170  |
| P4 | 4.1170  |
| P5 | 4.1170  |
| P6 | 1.9980  |

**Energia (EUR/kWh):**
| Periodo | EUR/kWh |
|---------|---------|
| P1 | 0.013520 |
| P2 | 0.010500 |
| P3 | 0.006660 |
| P4 | 0.003630 |
| P5 | 0.001860 |
| P6 | 0.000990 |

### 3.3 Tarifa 6.1TD - CARGOS

**Potencia (EUR/kW/anio):**
| Periodo | EUR/kW/anio |
|---------|-------------|
| P1 | 7.7780  |
| P2 | 3.9470  |
| P3 | 2.8860  |
| P4 | 2.8860  |
| P5 | 2.8860  |
| P6 | 1.4010  |

**Energia (EUR/kWh):**
| Periodo | EUR/kWh |
|---------|---------|
| P1 | 0.008190 |
| P2 | 0.006360 |
| P3 | 0.004030 |
| P4 | 0.002200 |
| P5 | 0.001130 |
| P6 | 0.000600 |

---

## 4. TOTAL ATR (PEAJES + CARGOS) - 2025

### 4.1 Tarifa 2.0TD - TOTAL

**Potencia TOTAL (EUR/kW/anio):**
| Periodo | Peaje | Cargo | TOTAL |
|---------|-------|-------|-------|
| P1 | 21.8930 | 8.5890 | 30.4820 |
| P2 | 3.1130  | 1.0700 | 4.1830  |

**Energia TOTAL (EUR/kWh):**
| Periodo | Peaje | Cargo | TOTAL |
|---------|-------|-------|-------|
| P1 | 0.000780 | 0.023980 | 0.024760 |
| P2 | 0.000130 | 0.005100 | 0.005230 |
| P3 | 0.000016 | 0.001020 | 0.001036 |

### 4.2 Tarifa 3.0TD - TOTAL

**Potencia TOTAL (EUR/kW/anio):**
| Periodo | Peaje | Cargo | TOTAL |
|---------|-------|-------|-------|
| P1 | 13.3220 | 11.0970 | 24.4190 |
| P2 | 6.7590  | 5.6340  | 12.3930 |
| P3 | 4.9380  | 4.1170  | 9.0550  |
| P4 | 4.9380  | 4.1170  | 9.0550  |
| P5 | 4.9380  | 4.1170  | 9.0550  |
| P6 | 2.3960  | 1.9980  | 4.3940  |

**Energia TOTAL (EUR/kWh):**
| Periodo | Peaje | Cargo | TOTAL |
|---------|-------|-------|-------|
| P1 | 0.008860 | 0.013520 | 0.022380 |
| P2 | 0.006880 | 0.010500 | 0.017380 |
| P3 | 0.004360 | 0.006660 | 0.011020 |
| P4 | 0.002380 | 0.003630 | 0.006010 |
| P5 | 0.001220 | 0.001860 | 0.003080 |
| P6 | 0.000650 | 0.000990 | 0.001640 |

### 4.3 Tarifa 6.1TD - TOTAL

**Potencia TOTAL (EUR/kW/anio):**
| Periodo | Peaje | Cargo | TOTAL |
|---------|-------|-------|-------|
| P1 | 10.2500 | 7.7780  | 18.0280 |
| P2 | 5.1990  | 3.9470  | 9.1460  |
| P3 | 3.7990  | 2.8860  | 6.6850  |
| P4 | 3.7990  | 2.8860  | 6.6850  |
| P5 | 3.7990  | 2.8860  | 6.6850  |
| P6 | 1.8440  | 1.4010  | 3.2450  |

**Energia TOTAL (EUR/kWh):**
| Periodo | Peaje | Cargo | TOTAL |
|---------|-------|-------|-------|
| P1 | 0.005010 | 0.008190 | 0.013200 |
| P2 | 0.003880 | 0.006360 | 0.010240 |
| P3 | 0.002470 | 0.004030 | 0.006500 |
| P4 | 0.001330 | 0.002200 | 0.003530 |
| P5 | 0.000690 | 0.001130 | 0.001820 |
| P6 | 0.000360 | 0.000600 | 0.000960 |

---

## 5. HORARIOS POR PERIODOS - PENINSULA

### 5.1 Temporadas del anio

| Temporada | Meses | Tipo |
|-----------|-------|------|
| Alta      | Enero, Febrero, Julio, Diciembre | A |
| Media-Alta | Marzo, Noviembre | B |
| Media     | Junio, Agosto, Septiembre | B1 |
| Baja      | Abril, Mayo, Octubre | C |

### 5.2 Tarifa 2.0TD - Horarios Peninsula

**Potencia:** P1 = punta, P2 = valle
**Energia:**
| Horas | Temporada Alta/Media-Alta | Temporada Media | Temporada Baja |
|-------|--------------------------|-----------------|----------------|
| 00-08 | P3 (valle) | P3 (valle) | P3 (valle) |
| 08-10 | P2 (llano) | P2 (llano) | P2 (llano) |
| 10-14 | P1 (punta) | P1 (punta) | P2 (llano) |
| 14-18 | P2 (llano) | P2 (llano) | P2 (llano) |
| 18-22 | P1 (punta) | P1 (punta) | P2 (llano) |
| 22-00 | P2 (llano) | P2 (llano) | P2 (llano) |

Sabados, domingos y festivos nacionales: P3 todo el dia

### 5.3 Tarifa 3.0TD y 6.xTD - Horarios Peninsula (L-V laborables)

| Horas   | Alta (Ene,Feb,Jul,Dic) | Media-Alta (Mar,Nov) | Media (Jun,Ago,Sep) | Baja (Abr,May,Oct) |
|---------|----------------------|---------------------|--------------------|--------------------|
| 00-08   | P6 | P6 | P6 | P6 |
| 08-09   | P2 | P3 | P4 | P5 |
| 09-10   | P1 | P2 | P3 | P4 |
| 10-14   | P1 | P2 | P3 | P4 |
| 14-18   | P2 | P3 | P4 | P5 |
| 18-22   | P1 | P2 | P3 | P4 |
| 22-00   | P2 | P3 | P4 | P5 |

**Sabados, domingos y festivos nacionales: P6 las 24 horas**

### 5.4 Festivos nacionales (14 dias)
1 Ene, 6 Ene, Viernes Santo, 1 May, 15 Ago, 12 Oct, 1 Nov, 6 Dic, 8 Dic, 25 Dic
(+2 locales que varian por CCAA)

### 5.5 Resumen horas anuales por periodo (3.0TD/6.xTD, Peninsula aprox.)

| Periodo | Horas/anio aprox. | Descripcion |
|---------|-------------------|-------------|
| P1 | ~700h | Punta: horas centrales + tarde, meses alta |
| P2 | ~1.000h | Llano alto: hombro punta, alta + horas centrales media-alta |
| P3 | ~1.000h | Medio: horas centrales + tarde, temporada media |
| P4 | ~1.000h | Medio-bajo: idem temporada baja + hombro media |
| P5 | ~700h | Valle diurno: hombro temporada baja |
| P6 | ~4.360h | Super-valle: noches (00-08) L-V + 24h fines de semana/festivos |

---

## 6. PRECIO DE LA ENERGIA - MERCADO MAYORISTA (OMIE)

### 6.1 Precios medios anuales del pool (mercado diario OMIE)

| Anio | Precio medio EUR/MWh | Notas |
|------|---------------------|-------|
| 2021 | 111.93 | Crisis energetica, record |
| 2022 | 167.52 | Maximo historico, guerra Ucrania |
| 2023 | 87.10  | Bajada significativa |
| 2024 | 63.04  | -27.6% vs 2023, mucha renovable |
| 2025 (ene-ago) | ~55-70 | Estimado ~62 EUR/MWh media |

### 6.2 Precios mensuales orientativos 2024

| Mes | EUR/MWh aprox. |
|-----|----------------|
| Ene | 69 |
| Feb | 40 |
| Mar | 30 |
| Abr | 23 |
| May | 36 |
| Jun | 52 |
| Jul | 72 |
| Ago | 67 |
| Sep | 75 |
| Oct | 83 |
| Nov | 78 |
| Dic | 91 |

### 6.3 Volatilidad y horas

- El pool varia hora a hora (24 precios/dia, 8760/anio)
- Desde 30 Sep 2025: mercado cuarto-horario (96 precios/dia)
- Horas solares (11-16h): precios muy bajos (a veces 0 o negativos)
- Horas punta (19-22h invierno): precios altos
- Mediana vs media: la mediana es ~15-20% mas baja que la media

---

## 7. MODALIDADES DE CONTRATACION DE ENERGIA

### 7.1 PVPC (Precio Voluntario para el Pequeno Consumidor)
- Solo disponible para <= 10kW (desde 2024, antes <=15kW)
- Solo con CUR (Comercializador de Ultimo Recurso)
- Precio = pool horario + peajes + cargos + pagos capacidad + perdidas
- Sin margen comercial adicional
- Muy volatil pero historicamente mas barato que fijo para perfiles planos

### 7.2 Precio FIJO (mercado libre)
- Comercializadora ofrece precio cerrado por kWh por periodo
- Duracion: 12, 24 o 36 meses
- El precio incluye: coste energia estimado + prima de riesgo + margen comercial
- Prima sobre pool: tipicamente +15 a +30 EUR/MWh sobre pool forward
- Riesgo: lo asume la comercializadora (puede perder o ganar)
- Ventaja cliente: previsibilidad total
- Desventaja: suele ser mas caro que indexado a largo plazo

**Precios fijos orientativos mercado libre (2025, tarifa 3.0TD):**
| Periodo | Rango tipico EUR/kWh |
|---------|---------------------|
| P1 | 0.14 - 0.19 |
| P2 | 0.12 - 0.16 |
| P3 | 0.10 - 0.14 |
| P4 | 0.08 - 0.12 |
| P5 | 0.07 - 0.10 |
| P6 | 0.06 - 0.09 |

### 7.3 Precio INDEXADO al POOL

#### Variante A: Indexado Pass-Through (puro)
- Precio = Pool OMIE horario + peajes + cargos + pagos capacidad + perdidas + desvios + fee gestion
- TODOS los costes son variables y reales
- Fee gestion comercializadora: 1-4 EUR/MWh (0.001-0.004 EUR/kWh)
- Maximo ahorro pero maxima volatilidad
- Para clientes sofisticados que entienden el mercado

#### Variante B: Indexado Pass-Pool (gestionado)
- Precio = Pool OMIE horario + coste fijo de ajustes (prefijado) + fee gestion
- Los "servicios de ajuste" se fijan al inicio: desvios, perdidas, capacidad = fijo
- Coste fijo de ajustes: tipicamente 5-12 EUR/MWh
- Menos volatilidad que pass-through
- La modalidad mas comun en PYME

#### Variante C: Precio fijo con indexacion parcial
- Parte de la energia a fijo, parte indexada
- Ej: 70% fijo + 30% pool
- Estructura hibrida que reduce riesgo

### 7.4 Margenes tipicos de las comercializadoras

| Tipo de comercializadora | Margen sobre coste real | Notas |
|-------------------------|------------------------|-------|
| Incumbente (Endesa, Iberdrola, Naturgy) | +25-45 EUR/MWh | Marca, servicio, inercia cliente |
| Comercializadora grande competitiva | +10-20 EUR/MWh | Repsol, TotalEnergies |
| Comercializadora mediana | +5-15 EUR/MWh | Aldro, Fenie, Nabalia |
| Comercializadora agresiva/cooperativa | +2-8 EUR/MWh | Som Energia, HolaLuz |

**Esto significa que un cambio de incumbente a competitiva puede ahorrar 15-35 EUR/MWh, o sea ~15-30% de la factura de energia.**

---

## 8. OTROS COSTES DEL SISTEMA

### 8.1 Pagos por Capacidad (2025)

Regulados en Orden ITC/2794/2007 (Anexo III) y Orden ITC/3127/2011.
Reduccion ~16% en 2025 vs 2024.

| Periodo | EUR/MWh (2025 aprox.) |
|---------|----------------------|
| Punta (P1-P2) | 2.5730 |
| Llano (P3-P4) | 1.2000 |
| Valle (P5-P6) | 0.3340 |

Nota: Los pagos por capacidad se aplican sobre la energia consumida.
En contratos indexados pass-through se repercuten al cliente.
En contratos a precio fijo, la comercializadora los incluye en su precio.

### 8.2 Coeficientes de Perdidas de Red

Los coeficientes de perdidas (publicados por REE/CNMC) se aplican multiplicativamente
sobre el coste de la energia para reflejar las perdidas fisicas en la red.

| Nivel de tension | Coeficiente de perdidas medio |
|-----------------|------------------------------|
| Baja tension (<1kV) - 2.0TD, 3.0TD | ~14-16% (coef. 1.14-1.16) |
| Alta tension 1kV-36kV - 6.1TD | ~5-7% (coef. 1.05-1.07) |
| Alta tension 36-72.5kV - 6.2TD | ~3-4% (coef. 1.03-1.04) |
| Alta tension >72.5kV - 6.3TD/6.4TD | ~1.5-2.5% (coef. 1.015-1.025) |

**Variacion por periodo horario (BT, 3.0TD, aprox.):**
| Periodo | Coeficiente |
|---------|-------------|
| P1 | 1.177 |
| P2 | 1.159 |
| P3 | 1.146 |
| P4 | 1.130 |
| P5 | 1.114 |
| P6 | 1.097 |

**Variacion por periodo horario (AT, 6.1TD, aprox.):**
| Periodo | Coeficiente |
|---------|-------------|
| P1 | 1.073 |
| P2 | 1.063 |
| P3 | 1.056 |
| P4 | 1.046 |
| P5 | 1.037 |
| P6 | 1.028 |

### 8.3 Coste de Desvios

- Los desvios son la diferencia entre la energia programada y la realmente consumida
- El coste de desvios se repercute al consumidor en contratos indexados
- Coste tipico: 1-3 EUR/MWh
- En pass-through: variable real
- En pass-pool: incluido en el coste fijo de ajustes

### 8.4 Garantia de Origen (GdO)

- Certificado que acredita que la energia proviene de fuentes renovables
- Precio mercado GdO en Espana: 0.20-1.00 EUR/MWh (muy barato)
- Opcional: el cliente puede solicitar GdO 100% renovable
- Algunas comercializadoras lo incluyen gratis (marketing verde)

### 8.5 Fondo Nacional de Eficiencia Energetica (FNEE)

- 2024: 0.975 EUR/MWh
- 2025: 1.429 EUR/MWh (+46.6%)
- Obligacion de las comercializadoras, repercutido al cliente

---

## 9. IMPUESTOS

### 9.1 Impuesto Especial sobre la Electricidad (IEE)

| Periodo | Tipo impositivo |
|---------|----------------|
| Hasta jun 2021 | 5.11269632% |
| Jul 2021 - Dic 2023 | 0.5% (reduccion temporal) |
| Ene-Mar 2024 | 0.5% |
| Abr-Jun 2024 | 2.5% |
| Jul-Sep 2024 | 3.8% |
| Oct-Dic 2024 | 5.0% |
| Desde Ene 2025 | 5.11269632% (tipo normal restablecido) |

Base imponible: termino de potencia + termino de energia (SIN peajes ni cargos desde 2015)
Formula: IEE = (Coste potencia contratada + Coste energia consumida) * 0.0511269632
Minimo: 0.5 EUR/MWh (1 EUR/MWh para usos industriales segun CNAE)

### 9.2 IVA

| Periodo | Tipo IVA |
|---------|---------|
| Hasta jun 2021 | 21% |
| Jul 2021 - Dic 2021 | 10% |
| Ene 2022 - Dic 2024 | 10% (para <=10kW) / 21% (resto) |
| Desde Ene 2025 | 21% (para todos, tipo general restablecido) |

Base imponible: TODA la factura incluyendo IEE
IVA Canarias: IGIC 3% (en vez de IVA)
IVA Ceuta/Melilla: IPSI 1%

### 9.3 Impuesto sobre el Valor de la Produccion de Energia Electrica (IVPEE)
- 7% sobre el valor de la produccion
- Lo pagan los generadores, NO los consumidores directamente
- Pero se traslada al precio del pool
- En 2025 se mantiene al 7%

---

## 10. ALQUILER DE EQUIPO DE MEDIDA

| Tipo de contador | EUR/mes (2025) |
|-----------------|---------------|
| Monofasico simple (sin telemedida) | 0.54 |
| Monofasico electronico con telemedida | 0.81 |
| Trifasico electronico con telemedida | 1.36 |
| Trifasico con maximetro (3.0TD) | 1.50-2.50 |
| Equipo medida alta tension (6.1TD) | 9.72-15.00 |
| Equipo medida AT con trafo medida (>1MW) | 12.00-25.00 |

Nota: El cliente puede ser propietario del contador y no pagar alquiler.
En 3.0TD y 6.xTD, normalmente el equipo es propiedad de la distribuidora.

---

## 11. PENALIZACION POR ENERGIA REACTIVA

### 11.1 Aplicabilidad
- Se aplica a tarifas >= 15kW (3.0TD, 6.xTD)
- NO se aplica a tarifa 2.0TD (<= 15kW)
- Se factura en periodos P1 a P5 (NO en P6)
- Se mide con el contador en cada cuarto de hora

### 11.2 Umbrales y precios

| cos(phi) | EUR/kVArh | Descripcion |
|----------|-----------|-------------|
| >= 0.95  | 0.000000  | Sin penalizacion |
| 0.80 - 0.95 | 0.041554 | Penalizacion moderada |
| < 0.80  | 0.062332  | Penalizacion alta |

### 11.3 Formula de calculo

```
Si cos(phi) >= 0.95 --> No hay penalizacion
Si 0.80 <= cos(phi) < 0.95:
  Reactiva_penalizable = Reactiva_total - (Activa * tan(arccos(0.95)))
  Penalizacion = Reactiva_penalizable * 0.041554
Si cos(phi) < 0.80:
  Reactiva_penalizable = Reactiva_total - (Activa * tan(arccos(0.80)))
  Penalizacion = Reactiva_penalizable * 0.062332
```

**Relaciones utiles:**
| cos(phi) | tan(phi) | Reactiva = Activa * tan(phi) |
|----------|----------|------------------------------|
| 1.00 | 0.000 | 0% de la activa |
| 0.95 | 0.329 | 32.9% de la activa |
| 0.90 | 0.484 | 48.4% de la activa |
| 0.85 | 0.620 | 62.0% de la activa |
| 0.80 | 0.750 | 75.0% de la activa |
| 0.70 | 1.020 | 102.0% de la activa |

### 11.4 Reactiva capacitiva (nueva penalizacion)
- Desde 2025, la CNMC tambien penaliza la reactiva CAPACITIVA
- (inyeccion de reactiva, cos phi capacitivo)
- Mismos umbrales y precios que la inductiva
- Afecta a instalaciones con baterias de condensadores sobredimensionadas
- O instalaciones fotovoltaicas con inversores mal configurados

---

## 12. PENALIZACION POR EXCESO DE POTENCIA

### 12.1 Metodo de calculo (desde abril 2025)
- Se mide la potencia maxima demandada en cada cuarto-hora (maximetro)
- Si supera la potencia contratada en cualquier periodo, se penaliza
- BOE-A-2025-5341: nuevos coeficientes de exceso de potencia

### 12.2 Formula
```
Exceso_potencia_periodo_i = max(0, P_demandada_i - P_contratada_i)
Coste_exceso = Sum(Exceso_potencia_i * 2 * Precio_potencia_periodo_i / (horas_periodo * 4))
```

El factor "2" es la penalizacion: pagas el doble del precio normal de potencia
por cada kW de exceso en cada cuarto de hora.

### 12.3 Nota importante para 3.0TD
- Los 6 periodos de potencia se contratan independientemente
- Se puede contratar distinta potencia en cada periodo
- Restriccion: P1 >= P2 >= P3 >= P4 >= P5 >= P6 (decreciente obligatorio)
- Optimizar las 6 potencias contratadas es una fuente clave de ahorro

---

## 13. FORMULAS DE FACTURACION COMPLETA

### 13.1 Factura mensual simplificada (precio fijo)

```
FACTURA = Termino_Potencia + Termino_Energia + Reactiva + Exceso_Potencia
         + IEE + Alquiler_Contador + IVA

Termino_Potencia = SUM(i=1 a N) [
  P_contratada_i (kW) * (Peaje_pot_i + Cargo_pot_i) * dias/365
]

Termino_Energia = SUM(i=1 a N) [
  E_consumida_i (kWh) * Precio_energia_i
]
  donde Precio_energia_i = Precio_fijo_comercializadora_i (ya incluye todo)

IEE = (Termino_Potencia_comercializadora + Termino_Energia_puro) * 0.0511269632
  Nota: Los peajes y cargos NO estan en la base del IEE

IVA = (FACTURA_sin_IVA) * 0.21
```

### 13.2 Factura mensual detallada (precio indexado pass-through)

```
Termino_Energia = SUM(hora=1 a H) [
  E_hora (kWh) * (
    Precio_OMIE_hora (EUR/MWh) / 1000
    * Coef_perdidas_periodo(hora)
    + Peaje_energia_periodo(hora)
    + Cargo_energia_periodo(hora)
    + Pago_capacidad_periodo(hora) / 1000
    + Coste_desvios / 1000
    + FNEE / 1000
    + Fee_gestion_comercializadora / 1000
  )
]
```

### 13.3 Ejemplo calculo indexado pass-pool

```
Para una hora con:
- Pool OMIE: 65 EUR/MWh
- Periodo P1 en BT (3.0TD)
- Consumo: 50 kWh

Coste energia bruta = 50 * 65/1000 * 1.177 = 3.825 EUR
  (1.177 = coeficiente perdidas P1 BT)

Peaje energia P1 = 50 * 0.008860 = 0.443 EUR
Cargo energia P1 = 50 * 0.013520 = 0.676 EUR
Pago capacidad P1 = 50 * 2.573/1000 = 0.129 EUR
Desvios = 50 * 2.0/1000 = 0.100 EUR
FNEE = 50 * 1.429/1000 = 0.071 EUR
Fee gestion = 50 * 3.0/1000 = 0.150 EUR

Total energia hora = 3.825 + 0.443 + 0.676 + 0.129 + 0.100 + 0.071 + 0.150
                   = 5.394 EUR
                   = 0.10788 EUR/kWh efectivo
```

---

## 14. CALCULADORA DE AHORRO - LOGICA DE NEGOCIO

### 14.1 Inputs necesarios del cliente

**Basicos:**
- Tarifa actual (2.0TD, 3.0TD, 6.1TD)
- Potencia contratada por periodo (kW)
- Consumo mensual o anual por periodo (kWh)
- Precio actual por periodo (EUR/kWh) o factura mensual total

**Para calculo detallado:**
- Curva de carga horaria (idealmente del contador inteligente)
- Datos de reactiva (kVArh por periodo)
- Datos de maximetro (excesos de potencia)

### 14.2 Escenarios de ahorro tipicos para el comercial

| Escenario | Ahorro tipico | Descripcion |
|-----------|--------------|-------------|
| Cambio de incumbente a competitiva (fijo) | 10-25% | El mas comun en PYME |
| Cambio a indexado al pool | 15-35% | Si el pool esta bajo y cliente flexible |
| Optimizacion de potencias contratadas | 5-15% | Ajustar los 6 periodos de potencia |
| Correccion de excesos de potencia | 3-8% | Ajustar P_contratada a P_demandada_max |
| Instalacion bateria condensadores (reactiva) | 2-5% | Eliminar penalizaciones reactiva |
| Cambio de horario productivo | 3-10% | Mover consumo a P5/P6 |

### 14.3 Formula rapida de ahorro estimado

```
Ahorro_anual_estimado = Factura_anual_actual * Porcentaje_ahorro

Para cambio de comercializadora (fijo a fijo):
  Ahorro = SUM(periodos) [Consumo_periodo * (Precio_actual_i - Precio_nuevo_i)]

Para cambio de fijo a indexado:
  Ahorro = SUM(periodos) [Consumo_periodo * (Precio_fijo_actual_i - Precio_indexado_estimado_i)]
  donde Precio_indexado_estimado_i = Pool_medio_forward * Coef_perdidas_i + ATR_i + Fee_gestion
```

### 14.4 Datos tipicos de consumo PYME por sector

| Sector | Tarifa tipica | Potencia | Consumo anual | Factura anual aprox. |
|--------|--------------|----------|---------------|---------------------|
| Oficina pequena | 2.0TD | 5-10 kW | 8.000-15.000 kWh | 1.500-3.500 EUR |
| Comercio/tienda | 3.0TD | 15-30 kW | 20.000-60.000 kWh | 4.000-12.000 EUR |
| Restaurante | 3.0TD | 20-50 kW | 40.000-100.000 kWh | 8.000-20.000 EUR |
| Hotel pequeno | 3.0TD | 50-100 kW | 100.000-300.000 kWh | 20.000-60.000 EUR |
| Taller/fabrica peq | 3.0TD | 30-100 kW | 50.000-200.000 kWh | 10.000-40.000 EUR |
| Supermercado | 3.0TD | 50-150 kW | 150.000-400.000 kWh | 30.000-80.000 EUR |
| Industria mediana | 6.1TD | 200-1000 kW | 500.000-3.000.000 kWh | 60.000-300.000 EUR |
| Industria grande | 6.1TD+ | >1000 kW | >3.000.000 kWh | >300.000 EUR |

---

## 15. NOTAS PARA EL DESARROLLADOR

### 15.1 Precision de los datos
- Los valores de peajes y cargos en este documento son los vigentes para 2025
- Se actualizan anualmente (peajes por CNMC en diciembre, cargos por Orden TED en diciembre)
- Los valores exactos deben verificarse contra BOE-A-2024-26218 (peajes 2025)
  y BOE-A-2024-27289 (cargos 2025) - enlaces en seccion Fuentes
- Para 2026: BOE-A-2025-26348 (peajes) y BOE-A-2025-26705 (cargos)

### 15.2 Consideraciones de implementacion
- Almacenar peajes/cargos en BD para poder actualizar anualmente sin deploy
- Los horarios por periodo son fijos (definidos en Circular 3/2020) y NO cambian anualmente
- Los coeficientes de perdidas se publican diariamente por REE en esios.ree.es
- El pool OMIE se puede obtener via API en omie.es (datos publicos)
- Para la calculadora del comercial NO se necesita precision horaria:
  basta con consumos mensuales por periodo y precios medios por periodo

### 15.3 API y fuentes de datos en tiempo real
- OMIE API: https://www.omie.es/es/market-results/daily/daily-market/day-ahead-price
- REE ESIOS API: https://api.esios.ree.es (necesita token gratuito)
  - Indicador 1001: PVPC
  - Indicador 600: Precio pool
  - Indicadores perdidas: 1739-1744 (BT por periodo)
- CNMC: https://gdo.cnmc.es (garantias de origen)

### 15.4 Fuentes oficiales
- Peajes 2025: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-26218
- Cargos 2025: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-27289
- Peajes 2026: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-26348
- Cargos 2026: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-26705
- OMIE precios: https://www.omie.es/es/market-results/daily/daily-market/day-ahead-price
- OMIE informe 2024: https://www.omel.es/sites/default/files/2025-01/omie_informe_precios_2024_es.pdf
- REE perdidas: https://www.ree.es/en/node/16767
- Circular 3/2020 (metodologia): https://www.boe.es/buscar/act.php?id=BOE-A-2020-1066
- Reactiva: https://enchufesolar.com/blog/penalizaciones-energia-reactiva/
- Indexado vs fijo: https://www.audinforsystem.es/todo-energia/pass-pool-y-pass-through/

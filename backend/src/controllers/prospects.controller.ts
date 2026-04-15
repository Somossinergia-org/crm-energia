import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import * as ProspectModel from '../models/prospect.model';
import * as UserModel from '../models/user.model';

// Esquemas de validación
const createProspectSchema = z.object({
  nombre_negocio: z.string().min(1, 'Nombre del negocio requerido'),
  nombre_contacto: z.string().optional().default(''),
  categoria: z.string().optional().default('otro'),
  subcategoria: z.string().optional().default(''),
  zona_id: z.string().uuid().optional().nullable(),
  codigo_cnae: z.string().optional().default(''),
  telefono_fijo: z.string().optional().default(''),
  telefono_movil: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  email_principal: z.string().email().optional().or(z.literal('')).default(''),
  email_secundario: z.string().optional().default(''),
  web: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  facebook: z.string().optional().default(''),
  direccion_completa: z.string().optional().default(''),
  codigo_postal: z.string().optional().default(''),
  municipio: z.string().optional().default(''),
  provincia: z.string().optional().default(''),
  coordenadas_lat: z.coerce.number().optional().nullable(),
  coordenadas_lng: z.coerce.number().optional().nullable(),
  comercializadora_actual: z.string().optional().default(''),
  tarifa_actual: z.string().optional().default(''),
  potencia_p1_kw: z.coerce.number().optional().nullable(),
  potencia_p2_kw: z.coerce.number().optional().nullable(),
  potencia_p3_kw: z.coerce.number().optional().nullable(),
  consumo_anual_kwh: z.coerce.number().optional().nullable(),
  gasto_mensual_estimado_eur: z.coerce.number().optional().nullable(),
  cups: z.string().optional().default(''),
  fecha_vencimiento_contrato: z.string().optional().nullable(),
  estado: z.string().optional().default('pendiente'),
  prioridad: z.string().optional().default('media'),
  temperatura: z.string().optional().default('frio'),
  asignado_a: z.string().uuid().optional().nullable(),
  fuente: z.string().optional().default('manual'),
  etiquetas: z.array(z.string()).optional().default([]),
  notas_internas: z.string().optional().default(''),
});

// GET /api/prospects
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters: ProspectModel.ProspectFilters = {
    estado: req.query.estado as string,
    prioridad: req.query.prioridad as string,
    temperatura: req.query.temperatura as string,
    categoria: req.query.categoria as string,
    zona_id: req.query.zona_id as string,
    asignado_a: req.query.asignado_a as string,
    provincia: req.query.provincia as string,
    fuente: req.query.fuente as string,
    search: req.query.search as string,
    sort_by: req.query.sort_by as string,
    sort_order: (req.query.sort_order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 25,
  };

  const result = await ProspectModel.findAll(filters, req.user!.id, req.user!.role);

  res.json({ success: true, ...result });
});

// GET /api/prospects/clients
export const getClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters: ProspectModel.ProspectFilters = {
    categoria: req.query.categoria as string,
    provincia: req.query.provincia as string,
    search: req.query.search as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 25,
  };

  const result = await ProspectModel.findClients(filters, req.user!.id, req.user!.role);
  res.json({ success: true, ...result });
});

// GET /api/prospects/clients/stats
export const getClientStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await ProspectModel.getClientStats(req.user!.id, req.user!.role);
  res.json({ success: true, data: stats });
});

// GET /api/prospects/stats
export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await ProspectModel.getStats(req.user!.id, req.user!.role);
  const byStatus = await ProspectModel.countByStatus(req.user!.id, req.user!.role);

  res.json({ success: true, data: { ...stats, byStatus } });
});

// GET /api/prospects/:id
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const prospect = await ProspectModel.findById(req.params.id);
  if (!prospect) {
    throw new AppError('Prospecto no encontrado', 404);
  }

  // Verificar acceso: comercial solo puede ver los suyos
  if (req.user!.role === 'comercial' && prospect.asignado_a !== req.user!.id) {
    throw new AppError('No tienes acceso a este prospecto', 403);
  }

  res.json({ success: true, data: prospect });
});

// POST /api/prospects
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createProspectSchema.parse(req.body);

  const prospect = await ProspectModel.create({
    ...data,
    created_by: req.user!.id,
    asignado_a: data.asignado_a || req.user!.id,
  });

  await UserModel.logActivity(req.user!.id, 'prospect_created', `Prospecto creado: ${prospect.nombre_negocio}`);

  res.status(201).json({ success: true, data: prospect });
});

// PUT /api/prospects/:id
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await ProspectModel.findById(req.params.id);
  if (!existing) {
    throw new AppError('Prospecto no encontrado', 404);
  }

  if (req.user!.role === 'comercial' && existing.asignado_a !== req.user!.id) {
    throw new AppError('No tienes acceso a este prospecto', 403);
  }

  const prospect = await ProspectModel.update(req.params.id, req.body);
  res.json({ success: true, data: prospect });
});

// PATCH /api/prospects/:id/status
export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { estado } = req.body;
  if (!estado) {
    throw new AppError('Estado requerido', 400);
  }

  // Verificar acceso para comercial
  const existing = await ProspectModel.findById(req.params.id);
  if (!existing) {
    throw new AppError('Prospecto no encontrado', 404);
  }
  if (req.user!.role === 'comercial' && existing.asignado_a !== req.user!.id) {
    throw new AppError('No tienes acceso a este prospecto', 403);
  }

  const prospect = await ProspectModel.updateStatus(req.params.id, estado);
  if (!prospect) {
    throw new AppError('Prospecto no encontrado', 404);
  }

  await UserModel.logActivity(req.user!.id, 'prospect_status_changed',
    `${prospect.nombre_negocio}: ${estado}`);

  res.json({ success: true, data: prospect });
});

// DELETE /api/prospects/:id
export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await ProspectModel.remove(req.params.id);
  if (!deleted) {
    throw new AppError('Prospecto no encontrado', 404);
  }

  res.json({ success: true, message: 'Prospecto eliminado' });
});

// POST /api/prospects/:id/duplicate
export const duplicate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const original = await ProspectModel.findById(req.params.id);
  if (!original) {
    throw new AppError('Prospecto no encontrado', 404);
  }

  if (req.user!.role === 'comercial' && original.asignado_a !== req.user!.id) {
    throw new AppError('No tienes acceso a este prospecto', 403);
  }

  // Copiar datos sin IDs ni timestamps
  const { id, created_at, updated_at, zona_nombre, zona_color, asignado_nombre, ...data } = original;

  const prospect = await ProspectModel.create({
    ...data,
    nombre_negocio: `${original.nombre_negocio} (copia)`,
    estado: 'pendiente',
    created_by: req.user!.id,
  });

  res.status(201).json({ success: true, data: prospect });
});

// POST /api/prospects/import
export const importCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('Archivo CSV requerido', 400);
  }

  const csv = req.file.buffer.toString('utf-8');
  const lines = csv.split('\n').filter(l => l.trim());

  if (lines.length < 2) {
    throw new AppError('El CSV debe tener al menos una fila de datos', 400);
  }

  // Parsear headers
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  // Mapeo de columnas comunes
  const columnMap: Record<string, string> = {
    'nombre': 'nombre_negocio',
    'negocio': 'nombre_negocio',
    'nombre_negocio': 'nombre_negocio',
    'contacto': 'nombre_contacto',
    'nombre_contacto': 'nombre_contacto',
    'telefono': 'telefono_movil',
    'telefono_movil': 'telefono_movil',
    'movil': 'telefono_movil',
    'email': 'email_principal',
    'email_principal': 'email_principal',
    'correo': 'email_principal',
    'direccion': 'direccion_completa',
    'direccion_completa': 'direccion_completa',
    'ciudad': 'municipio',
    'municipio': 'municipio',
    'provincia': 'provincia',
    'cp': 'codigo_postal',
    'codigo_postal': 'codigo_postal',
    'categoria': 'categoria',
    'web': 'web',
    'notas': 'notas_internas',
    'notas_internas': 'notas_internas',
    'fijo': 'telefono_fijo',
    'telefono_fijo': 'telefono_fijo',
    'whatsapp': 'whatsapp',
    'zona_id': 'zona_id',
    'rating_google': 'rating_google',
    'rating': 'rating_google',
    'prioridad': 'prioridad',
    'temperatura': 'temperatura',
    'subcategoria': 'subcategoria',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'comercializadora': 'comercializadora_actual',
    'tarifa': 'tarifa_actual',
    'consumo': 'consumo_anual_kwh',
    'gasto': 'gasto_mensual_estimado_eur',
    'cups': 'cups',
  };

  const mappedHeaders = headers.map(h => columnMap[h] || h);

  // Parsear filas
  const prospects: Partial<ProspectModel.Prospect>[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map(v => v.trim());
    const row: any = {};

    mappedHeaders.forEach((header, idx) => {
      if (values[idx] && values[idx] !== '') {
        row[header] = values[idx];
      }
    });

    if (!row.nombre_negocio) {
      errors.push({ row: i + 1, error: 'nombre_negocio requerido' });
      continue;
    }

    row.fuente = 'csv_importado';
    row.created_by = req.user!.id;
    row.asignado_a = req.user!.id;
    prospects.push(row);
  }

  const inserted = await ProspectModel.bulkCreate(prospects);

  await UserModel.logActivity(req.user!.id, 'csv_import',
    `Importados ${inserted} de ${prospects.length} prospectos`);

  res.json({
    success: true,
    data: {
      total_rows: lines.length - 1,
      imported: inserted,
      errors: errors.length,
      error_details: errors.slice(0, 20),
    },
  });
});

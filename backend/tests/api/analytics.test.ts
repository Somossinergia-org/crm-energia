import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/user.model', () => ({
  default: { findById: vi.fn() },
  findById: vi.fn(),
}));

import app from '../../src/index';
import { query } from '../../src/config/database';
import { findById as userFindById } from '../../src/models/user.model';

function tokenFor(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  return jwt.sign({ id, email: `${role}@test.com`, role, nombre: role }, env.JWT_SECRET, { expiresIn: '1h' });
}

function mockAuthUser(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  vi.mocked(userFindById).mockResolvedValue({
    id, email: `${role}@test.com`, nombre: role, apellidos: '', role,
    telefono: '', foto_url: null, activo: true, created_at: new Date(),
  } as any);
}

describe('Analytics API Routes - authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Return empty rows for any analytics queries
    vi.mocked(query).mockResolvedValue({ rows: [{ total: 0, ahorro_potencial: 0, ahorro_generado: 0, gasto_gestionado: 0 }] } as any);
  });

  it('rejects comercial on /kpis (aggregate data)', async () => {
    mockAuthUser('comercial');
    const res = await request(app)
      .get('/api/analytics/kpis')
      .set('Authorization', `Bearer ${tokenFor('comercial')}`);
    expect(res.status).toBe(403);
  });

  it('allows supervisor on /kpis', async () => {
    mockAuthUser('supervisor');
    const res = await request(app)
      .get('/api/analytics/kpis')
      .set('Authorization', `Bearer ${tokenFor('supervisor')}`);
    expect(res.status).toBe(200);
  });

  it('allows admin on /kpis', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .get('/api/analytics/kpis')
      .set('Authorization', `Bearer ${tokenFor('admin')}`);
    expect(res.status).toBe(200);
  });

  it('rejects comercial on export endpoints', async () => {
    mockAuthUser('comercial');
    const res = await request(app)
      .get('/api/analytics/export/excel')
      .set('Authorization', `Bearer ${tokenFor('comercial')}`);
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/analytics/kpis');
    expect(res.status).toBe(401);
  });
});

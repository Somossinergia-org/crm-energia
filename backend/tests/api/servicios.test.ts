import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/servicios.model', () => ({
  serviciosModel: {
    getByProspect: vi.fn(),
    getById: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
    getAllWithProspect: vi.fn(),
    getGlobalStats: vi.fn(),
  },
}));

vi.mock('../../src/models/user.model', () => ({
  default: { findById: vi.fn() },
  findById: vi.fn(),
}));

import app from '../../src/index';
import { serviciosModel } from '../../src/models/servicios.model';
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

describe('Servicios API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/servicios/prospect/:prospectId', () => {
    it('admin can view any prospect servicios', async () => {
      mockAuthUser('admin');
      vi.mocked(serviciosModel.getByProspect).mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/servicios/prospect/p-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
    });

    it('comercial can view own prospect servicios', async () => {
      mockAuthUser('comercial', 'user-1');
      // DB query for access check: returns 1 row (has access)
      vi.mocked(query).mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      vi.mocked(serviciosModel.getByProspect).mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/servicios/prospect/p-1')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`);

      expect(res.status).toBe(200);
    });

    it('comercial blocked from other user prospect', async () => {
      mockAuthUser('comercial', 'user-1');
      vi.mocked(query).mockResolvedValueOnce({ rows: [] } as any);

      const res = await request(app)
        .get('/api/servicios/prospect/p-1')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/servicios/prospect/p-1');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/servicios/:id', () => {
    it('admin can delete', async () => {
      mockAuthUser('admin');
      (serviciosModel.getById as any).mockResolvedValue({ id: 's-1', prospect_id: 'p-1' });
      (serviciosModel.delete as any).mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/servicios/s-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
    });

    it('returns 404 when servicio not found', async () => {
      mockAuthUser('admin');
      (serviciosModel.getById as any).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/servicios/nonexistent')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(404);
    });

    it('comercial cannot delete', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .delete('/api/servicios/s-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });
  });
});

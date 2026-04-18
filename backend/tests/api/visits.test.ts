import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/visit.model', () => ({
  findByDateRange: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findToday: vi.fn(),
}));

vi.mock('../../src/models/user.model', () => ({
  default: { findById: vi.fn() },
  findById: vi.fn(),
}));

import app from '../../src/index';
import * as VisitModel from '../../src/models/visit.model';
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

describe('Visits API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/visits', () => {
    it('any authenticated user lists visits', async () => {
      mockAuthUser('comercial');
      vi.mocked(VisitModel.findByDateRange).mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/visits?start=2026-04-01&end=2026-04-30')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);

      expect(res.status).toBe(200);
    });

    it('rejects without date range', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/visits');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/visits', () => {
    it('comercial can create visit', async () => {
      mockAuthUser('comercial');
      vi.mocked(VisitModel.create).mockResolvedValue({ id: 'v-1' } as any);

      const res = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({
          prospect_id: '00000000-0000-0000-0000-000000000001',
          titulo: 'Visita inicial',
          fecha_inicio: '2026-04-20T10:00:00Z',
          fecha_fin: '2026-04-20T11:00:00Z',
        });

      expect(res.status).toBe(201);
    });

    it('rejects without required fields', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ prospect_id: 'not-a-uuid' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/visits/:id', () => {
    it('comercial can update', async () => {
      mockAuthUser('comercial');
      vi.mocked(VisitModel.update).mockResolvedValue({ id: 'v-1', completada: true } as any);

      const res = await request(app)
        .put('/api/visits/v-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ completada: true });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/visits/:id', () => {
    it('admin can delete', async () => {
      mockAuthUser('admin');
      vi.mocked(VisitModel.remove).mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/visits/v-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
    });

    it('comercial cannot delete', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .delete('/api/visits/v-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });

    it('supervisor cannot delete', async () => {
      mockAuthUser('supervisor');
      const res = await request(app)
        .delete('/api/visits/v-1')
        .set('Authorization', `Bearer ${tokenFor('supervisor')}`);
      expect(res.status).toBe(403);
    });
  });
});

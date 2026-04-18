import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/zone.model', () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../src/models/user.model', () => ({
  default: { findById: vi.fn() },
  findById: vi.fn(),
}));

import app from '../../src/index';
import * as ZoneModel from '../../src/models/zone.model';
import { findById as userFindById } from '../../src/models/user.model';

function tokenFor(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  return jwt.sign({ id, email: `${role}@test.com`, role, nombre: role }, env.JWT_SECRET, { expiresIn: '1h' });
}

function mockAuthUser(role: 'admin' | 'comercial' | 'supervisor') {
  vi.mocked(userFindById).mockResolvedValue({
    id: 'user-1', email: `${role}@test.com`, nombre: role, apellidos: '', role,
    telefono: '', foto_url: null, activo: true, created_at: new Date(),
  } as any);
}

describe('Zones API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/zones', () => {
    it('any authenticated user can list zones', async () => {
      mockAuthUser('comercial');
      vi.mocked(ZoneModel.findAll).mockResolvedValue([
        { id: 'z-1', nombre: 'Madrid', color: '#f00' } as any,
      ]);

      const res = await request(app)
        .get('/api/zones')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/zones');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/zones', () => {
    it('admin can create zone', async () => {
      mockAuthUser('admin');
      vi.mocked(ZoneModel.create).mockResolvedValue({ id: 'z-new', nombre: 'Malaga' } as any);

      const res = await request(app)
        .post('/api/zones')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({ nombre: 'Malaga' });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).toBe('Malaga');
    });

    it('comercial cannot create zone', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .post('/api/zones')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ nombre: 'Malaga' });
      expect(res.status).toBe(403);
    });

    it('supervisor cannot create zone (admin-only)', async () => {
      mockAuthUser('supervisor');
      const res = await request(app)
        .post('/api/zones')
        .set('Authorization', `Bearer ${tokenFor('supervisor')}`)
        .send({ nombre: 'Malaga' });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/zones/:id', () => {
    it('admin can update zone', async () => {
      mockAuthUser('admin');
      vi.mocked(ZoneModel.update).mockResolvedValue({ id: 'z-1', nombre: 'Madrid Centro' } as any);

      const res = await request(app)
        .put('/api/zones/z-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({ nombre: 'Madrid Centro' });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe('Madrid Centro');
    });

    it('comercial cannot update zone', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .put('/api/zones/z-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ nombre: 'Madrid' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/zones/:id', () => {
    it('admin can delete zone', async () => {
      mockAuthUser('admin');
      vi.mocked(ZoneModel.remove).mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/zones/z-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
    });

    it('comercial cannot delete zone', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .delete('/api/zones/z-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/prospect.model', () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  updateStatus: vi.fn(),
  getStats: vi.fn(),
  countByStatus: vi.fn(),
  findClients: vi.fn(),
  getClientStats: vi.fn(),
  bulkCreate: vi.fn(),
}));

vi.mock('../../src/models/user.model', () => ({
  default: {
    findById: vi.fn(),
    logActivity: vi.fn(),
  },
  findById: vi.fn(),
  logActivity: vi.fn(),
}));

import app from '../../src/index';
import * as ProspectModel from '../../src/models/prospect.model';
import { findById as userFindById } from '../../src/models/user.model';

function tokenFor(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  return jwt.sign({ id, email: `${role}@test.com`, role, nombre: role }, env.JWT_SECRET, { expiresIn: '1h' });
}

function mockAuthUser(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  vi.mocked(userFindById).mockResolvedValue({
    id, email: `${role}@test.com`, nombre: role, apellidos: '', role, telefono: '', foto_url: null, activo: true, created_at: new Date(),
  } as any);
}

const sampleProspect = {
  id: 'p-1',
  nombre_negocio: 'Bar La Esquina',
  nombre_contacto: 'Juan Perez',
  estado: 'pendiente',
  asignado_a: 'user-1',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('Prospects API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('auth', () => {
    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/prospects');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prospects', () => {
    it('returns prospects list for authenticated user', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.findAll).mockResolvedValue({
        data: [sampleProspect as any],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      } as any);

      const res = await request(app)
        .get('/api/prospects')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('passes filters to model', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.findAll).mockResolvedValue({ data: [], pagination: {} } as any);

      await request(app)
        .get('/api/prospects?estado=cliente&temperatura=caliente&page=2')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      const call = vi.mocked(ProspectModel.findAll).mock.calls[0][0];
      expect(call.estado).toBe('cliente');
      expect(call.temperatura).toBe('caliente');
      expect(call.page).toBe(2);
    });
  });

  describe('GET /api/prospects/:id', () => {
    it('returns 404 when not found', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.findById).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/prospects/nonexistent')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(404);
    });

    it('comercial cannot access prospect owned by another user', async () => {
      mockAuthUser('comercial', 'user-1');
      vi.mocked(ProspectModel.findById).mockResolvedValue({ ...sampleProspect, asignado_a: 'other-user' } as any);

      const res = await request(app)
        .get('/api/prospects/p-1')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`);

      expect(res.status).toBe(403);
    });

    it('admin can access any prospect', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.findById).mockResolvedValue({ ...sampleProspect, asignado_a: 'some-comercial' } as any);

      const res = await request(app)
        .get('/api/prospects/p-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('p-1');
    });
  });

  describe('POST /api/prospects', () => {
    it('creates prospect with valid data', async () => {
      mockAuthUser('comercial');
      vi.mocked(ProspectModel.create).mockResolvedValue(sampleProspect as any);

      const res = await request(app)
        .post('/api/prospects')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ nombre_negocio: 'Bar La Esquina' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('p-1');
      expect(vi.mocked(ProspectModel.create).mock.calls[0][0].nombre_negocio).toBe('Bar La Esquina');
    });

    it('rejects creation without nombre_negocio', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .post('/api/prospects')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ nombre_contacto: 'Juan' });
      expect(res.status).toBe(400);
    });

    it('assigns creator as asignado_a by default', async () => {
      mockAuthUser('comercial', 'creator-id');
      vi.mocked(ProspectModel.create).mockResolvedValue(sampleProspect as any);

      await request(app)
        .post('/api/prospects')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'creator-id')}`)
        .send({ nombre_negocio: 'Test' });

      const arg = vi.mocked(ProspectModel.create).mock.calls[0][0];
      expect(arg.asignado_a).toBe('creator-id');
      expect(arg.created_by).toBe('creator-id');
    });
  });

  describe('DELETE /api/prospects/:id', () => {
    it('requires admin role', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .delete('/api/prospects/p-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });

    it('admin can delete', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.remove).mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/prospects/p-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
      expect(vi.mocked(ProspectModel.remove)).toHaveBeenCalledWith('p-1');
    });

    it('returns 404 when prospect does not exist', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.remove).mockResolvedValue(false);

      const res = await request(app)
        .delete('/api/prospects/nonexistent')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/prospects/:id/status', () => {
    it('updates status for own prospect as comercial', async () => {
      mockAuthUser('comercial', 'user-1');
      vi.mocked(ProspectModel.findById).mockResolvedValue({ ...sampleProspect, asignado_a: 'user-1' } as any);
      vi.mocked(ProspectModel.updateStatus).mockResolvedValue({ ...sampleProspect, estado: 'cliente' } as any);

      const res = await request(app)
        .patch('/api/prospects/p-1/status')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`)
        .send({ estado: 'cliente' });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('cliente');
    });

    it('rejects when estado missing', async () => {
      mockAuthUser('admin');
      const res = await request(app)
        .patch('/api/prospects/p-1/status')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('comercial cannot change status of prospect owned by other', async () => {
      mockAuthUser('comercial', 'user-1');
      vi.mocked(ProspectModel.findById).mockResolvedValue({ ...sampleProspect, asignado_a: 'other' } as any);

      const res = await request(app)
        .patch('/api/prospects/p-1/status')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`)
        .send({ estado: 'cliente' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/prospects/stats', () => {
    it('returns aggregated stats', async () => {
      mockAuthUser('admin');
      vi.mocked(ProspectModel.getStats).mockResolvedValue({ total: 20, clientes: 5 } as any);
      vi.mocked(ProspectModel.countByStatus).mockResolvedValue([{ estado: 'pendiente', total: '10' }] as any);

      const res = await request(app)
        .get('/api/prospects/stats')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(20);
      expect(res.body.data.byStatus).toHaveLength(1);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/contactHistory.model', () => ({
  findByProspect: vi.fn(),
  findRecent: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countByType: vi.fn(),
  countToday: vi.fn(),
}));

vi.mock('../../src/models/prospect.model', () => ({
  findById: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock('../../src/models/user.model', () => ({
  default: { findById: vi.fn() },
  findById: vi.fn(),
}));

import app from '../../src/index';
import * as ContactModel from '../../src/models/contactHistory.model';
import * as ProspectModel from '../../src/models/prospect.model';
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

describe('Contacts API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/contacts/recent', () => {
    it('returns recent contacts for authenticated user', async () => {
      mockAuthUser('comercial');
      vi.mocked(ContactModel.findRecent).mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/contacts/recent')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);

      expect(res.status).toBe(200);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/contacts/recent');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/contacts', () => {
    it('comercial can log a contact on own prospect', async () => {
      mockAuthUser('comercial', 'user-1');
      vi.mocked(ProspectModel.findById).mockResolvedValue({ id: 'p-1', asignado_a: 'user-1', estado: 'pendiente' } as any);
      vi.mocked(ContactModel.create).mockResolvedValue({ id: 'c-1' } as any);

      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`)
        .send({
          prospect_id: '00000000-0000-0000-0000-000000000001',
          tipo: 'llamada',
          resultado: 'positivo',
        });

      expect(res.status).toBe(201);
    });

    it('rejects with invalid tipo', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({
          prospect_id: '00000000-0000-0000-0000-000000000001',
          tipo: 'tipo_invalido',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('admin can delete', async () => {
      mockAuthUser('admin');
      vi.mocked(ContactModel.remove).mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/contacts/c-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
    });

    it('comercial cannot delete', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .delete('/api/contacts/c-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });
  });
});

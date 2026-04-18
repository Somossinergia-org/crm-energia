import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/user.model', () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
  },
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
}));

import app from '../../src/index';
import * as UserModel from '../../src/models/user.model';

function tokenFor(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  return jwt.sign({ id, email: `${role}@test.com`, role, nombre: role }, env.JWT_SECRET, { expiresIn: '1h' });
}

function mockAuthUser(role: 'admin' | 'comercial' | 'supervisor', id = 'user-1') {
  vi.mocked(UserModel.findById).mockResolvedValue({
    id, email: `${role}@test.com`, nombre: role, apellidos: '', role, telefono: '', foto_url: null, activo: true, created_at: new Date(),
  } as any);
}

describe('Users API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/users', () => {
    it('admin can list users', async () => {
      mockAuthUser('admin');
      vi.mocked(UserModel.findAll).mockResolvedValue([
        { id: '1', email: 'a@b.com', role: 'admin' },
      ] as any);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('supervisor can list users', async () => {
      mockAuthUser('supervisor');
      vi.mocked(UserModel.findAll).mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor('supervisor')}`);

      expect(res.status).toBe(200);
    });

    it('comercial cannot list users', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('admin gets user by id', async () => {
      mockAuthUser('admin');
      vi.mocked(UserModel.findById).mockResolvedValue({ id: '42', email: 'x@y.com', role: 'comercial' } as any);

      const res = await request(app)
        .get('/api/users/42')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('42');
    });

    it('returns 404 when user not found', async () => {
      const adminUser = { id: 'user-1', role: 'admin', email: 'admin@test.com', nombre: 'admin', apellidos: '', telefono: '', foto_url: null, activo: true, created_at: new Date() };
      vi.mocked(UserModel.findById).mockImplementation(async (id: string) =>
        id === 'user-1' ? (adminUser as any) : null
      );

      const res = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('admin can update user', async () => {
      mockAuthUser('admin');
      vi.mocked(UserModel.update).mockResolvedValue({ id: '42', nombre: 'Updated' } as any);

      const res = await request(app)
        .put('/api/users/42')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .send({ nombre: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe('Updated');
    });

    it('supervisor cannot update user (admin only)', async () => {
      mockAuthUser('supervisor');
      const res = await request(app)
        .put('/api/users/42')
        .set('Authorization', `Bearer ${tokenFor('supervisor')}`)
        .send({ nombre: 'Updated' });
      expect(res.status).toBe(403);
    });

    it('comercial cannot update user', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .put('/api/users/42')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`)
        .send({ nombre: 'Updated' });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('any authenticated user can update own profile', async () => {
      mockAuthUser('comercial', 'user-1');
      vi.mocked(UserModel.update).mockResolvedValue({ id: 'user-1', nombre: 'NewName' } as any);

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${tokenFor('comercial', 'user-1')}`)
        .send({ nombre: 'NewName' });

      expect(res.status).toBe(200);
      // Controller should call update with logged-in user id
      expect(vi.mocked(UserModel.update).mock.calls[0][0]).toBe('user-1');
    });
  });
});

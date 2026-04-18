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

// Mock documents controller methods via the module
vi.mock('../../src/controllers/documents.controller', async () => {
  const multer = (await import('multer')).default;
  return {
    getByProspect: async (_req: any, res: any) => res.json({ data: [] }),
    uploadDocument: async (_req: any, res: any) => res.status(201).json({ data: { id: 'd-1' } }),
    remove: async (_req: any, res: any) => res.json({ message: 'deleted' }),
    upload: multer({ storage: multer.memoryStorage() }),
  };
});

import app from '../../src/index';
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

describe('Documents API Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/documents/prospect/:prospectId', () => {
    it('any authenticated user can read', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .get('/api/documents/prospect/p-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(200);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/documents/prospect/p-1');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('admin can delete', async () => {
      mockAuthUser('admin');
      const res = await request(app)
        .delete('/api/documents/d-1')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);
      expect(res.status).toBe(200);
    });

    it('comercial cannot delete', async () => {
      mockAuthUser('comercial');
      const res = await request(app)
        .delete('/api/documents/d-1')
        .set('Authorization', `Bearer ${tokenFor('comercial')}`);
      expect(res.status).toBe(403);
    });

    it('supervisor cannot delete', async () => {
      mockAuthUser('supervisor');
      const res = await request(app)
        .delete('/api/documents/d-1')
        .set('Authorization', `Bearer ${tokenFor('supervisor')}`);
      expect(res.status).toBe(403);
    });
  });
});

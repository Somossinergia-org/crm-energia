import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

// Mock rate limiter before importing app
vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

// Mock the auth service (namespace import)
vi.mock('../../src/services/auth.service', () => ({
  login: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  changePassword: vi.fn(),
}));

// Mock user model
vi.mock('../../src/models/user.model', () => ({
  default: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
    saveRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllSessions: vi.fn(),
    logActivity: vi.fn(),
  },
  findById: vi.fn(),
}));

import app from '../../src/index';
import * as authService from '../../src/services/auth.service';

const mockedLogin = vi.mocked(authService.login);
const mockedLogout = vi.mocked(authService.logout);

describe('Auth API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('returns access token on valid login', async () => {
      mockedLogin.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: {
          id: '1',
          email: 'admin@test.com',
          nombre: 'Admin',
          apellidos: 'User',
          role: 'admin',
          telefono: '',
          foto_url: null,
        },
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('test-access-token');
      expect(res.body.data.user.email).toBe('admin@test.com');
    });

    it('sets refresh token cookie on login', async () => {
      mockedLogin.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'a@b.com', nombre: 'A', apellidos: '', role: 'admin', telefono: '', foto_url: null },
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@b.com', password: 'password123' });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('rejects login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects login with short password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const userPayload = { id: '1', email: 'admin@test.com', role: 'admin', nombre: 'Admin' };
      const token = jwt.sign(userPayload, env.JWT_SECRET, { expiresIn: '1h' });

      const { findById } = await import('../../src/models/user.model');
      vi.mocked(findById).mockResolvedValue({
        id: '1',
        email: 'admin@test.com',
        nombre: 'Admin',
        apellidos: 'User',
        role: 'admin',
        telefono: '',
        foto_url: null,
        activo: true,
        created_at: new Date(),
      } as any);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token de autenticacion requerido');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns success and clears cookie', async () => {
      const token = jwt.sign(
        { id: '1', email: 'test@test.com', role: 'admin', nombre: 'Test' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      mockedLogout.mockResolvedValue(undefined as any);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sesion cerrada');
    });
  });
});

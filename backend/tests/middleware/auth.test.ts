import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/errorHandler';
import { env } from '../../src/config/env';

function createApp(...handlers: express.RequestHandler[]) {
  const app = express();
  app.get('/test', ...handlers, (_req: any, res) => {
    res.json({ success: true, user: (_req as any).user });
  });
  app.use(errorHandler);
  return app;
}

function createToken(payload: object, secret = env.JWT_SECRET, expiresIn = '1h') {
  return jwt.sign(payload, secret, { expiresIn });
}

const testUser = {
  id: '123',
  email: 'test@example.com',
  role: 'admin' as const,
  nombre: 'Test User',
};

describe('authenticate middleware', () => {
  it('passes with valid Bearer token', async () => {
    const token = createToken(testUser);
    const app = createApp(authenticate);

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects request without Authorization header', async () => {
    const app = createApp(authenticate);

    const res = await request(app).get('/test');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token de autenticacion requerido');
  });

  it('rejects request with non-Bearer token', async () => {
    const app = createApp(authenticate);

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Basic abc123');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token de autenticacion requerido');
  });

  it('rejects expired token', async () => {
    const token = createToken(testUser, env.JWT_SECRET, '-1s');
    const app = createApp(authenticate);

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token expirado');
  });

  it('rejects token signed with wrong secret', async () => {
    const token = createToken(testUser, 'wrong-secret-key');
    const app = createApp(authenticate);

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token invalido');
  });

  it('rejects malformed token', async () => {
    const app = createApp(authenticate);

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer not.a.valid.jwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token invalido');
  });
});

describe('authorize middleware', () => {
  it('allows user with matching role', async () => {
    const token = createToken({ ...testUser, role: 'admin' });
    const app = createApp(authenticate, authorize('admin', 'supervisor'));

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('denies user without matching role', async () => {
    const token = createToken({ ...testUser, role: 'comercial' });
    const app = createApp(authenticate, authorize('admin'));

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('No tienes permisos para esta accion');
  });

  it('allows any of multiple roles', async () => {
    const token = createToken({ ...testUser, role: 'supervisor' });
    const app = createApp(authenticate, authorize('admin', 'supervisor'));

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

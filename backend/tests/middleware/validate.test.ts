import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate';
import { errorHandler } from '../../src/middleware/errorHandler';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

function createApp(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  const app = express();
  app.use(express.json());

  if (source === 'body') {
    app.post('/test', validate(schema, source), (req, res) => {
      res.json({ success: true, data: req.body });
    });
  } else if (source === 'query') {
    app.get('/test', validate(schema, source), (req, res) => {
      res.json({ success: true, data: req.query });
    });
  }

  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  it('passes valid body data through', async () => {
    const app = createApp(loginSchema);

    const res = await request(app)
      .post('/test')
      .send({ email: 'user@test.com', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('user@test.com');
  });

  it('rejects invalid body with Zod error format', async () => {
    const app = createApp(loginSchema);

    const res = await request(app)
      .post('/test')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Error de validacion');
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects empty body', async () => {
    const app = createApp(loginSchema);

    const res = await request(app).post('/test').send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validates query params', async () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1),
    });
    const app = createApp(querySchema, 'query');

    const res = await request(app).get('/test?page=2');

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(2);
  });

  it('strips unknown fields from validated data', async () => {
    const app = createApp(loginSchema);

    const res = await request(app)
      .post('/test')
      .send({ email: 'user@test.com', password: '123456', extra: 'field' });

    expect(res.status).toBe(200);
    expect(res.body.data.extra).toBeUndefined();
  });
});

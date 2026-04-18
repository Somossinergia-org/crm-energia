import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ZodError, ZodIssueCode } from 'zod';
import { AppError, errorHandler, asyncHandler } from '../../src/middleware/errorHandler';

function createApp(handler: express.RequestHandler) {
  const app = express();
  app.use(express.json());
  app.get('/test', handler);
  app.use(errorHandler);
  return app;
}

describe('AppError', () => {
  it('creates error with custom status code', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('defaults to 500 status code', () => {
    const err = new AppError('Server error');
    expect(err.statusCode).toBe(500);
  });
});

describe('errorHandler middleware', () => {
  it('handles AppError with correct status and response format', async () => {
    const app = createApp((_req, _res) => {
      throw new AppError('Recurso no encontrado', 404);
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Recurso no encontrado',
    });
  });

  it('handles ZodError with 400 status and field errors', async () => {
    const app = createApp((_req, _res) => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Email requerido',
          path: ['email'],
        },
      ]);
      throw zodError;
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Error de validacion');
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0]).toEqual({
      campo: 'email',
      mensaje: 'Email requerido',
    });
  });

  it('handles unknown errors with 500 status', async () => {
    const app = createApp((_req, _res) => {
      throw new Error('Something unexpected');
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Error interno del servidor',
    });
  });

  it('handles middleware errors with status codes (e.g. body-parser)', async () => {
    const app = createApp((_req, _res) => {
      const err: any = new Error('Request entity too large');
      err.statusCode = 413;
      throw err;
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });
});

describe('asyncHandler', () => {
  it('passes async errors to error handler', async () => {
    const app = express();
    app.get(
      '/test',
      asyncHandler(async () => {
        throw new AppError('Async error', 422);
      })
    );
    app.use(errorHandler);

    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Async error');
  });

  it('passes resolved responses through', async () => {
    const app = express();
    app.get(
      '/test',
      asyncHandler(async (_req, res) => {
        res.json({ success: true, data: 'ok' });
      })
    );
    app.use(errorHandler);

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: 'ok' });
  });
});

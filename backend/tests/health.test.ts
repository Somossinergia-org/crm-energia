import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock rate limiter before importing app
vi.mock('../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

import app from '../src/index';
import { pool } from '../src/config/database';

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns valid ISO timestamp', async () => {
    const res = await request(app).get('/api/health');
    const date = new Date(res.body.timestamp);
    expect(date.toISOString()).toBe(res.body.timestamp);
  });
});

describe('Detailed Health Check', () => {
  it('GET /api/health/detailed returns healthy when DB is up', async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);

    const res = await request(app).get('/api/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.memory.rss).toBeGreaterThan(0);
    expect(res.body.checks.database.status).toBe('ok');
    expect(res.body.checks.database.latency).toBeGreaterThanOrEqual(0);
  });

  it('returns 503 when DB is down', async () => {
    vi.mocked(pool.query).mockRejectedValue(new Error('Connection refused'));

    const res = await request(app).get('/api/health/detailed');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.database.status).toBe('error');
    expect(res.body.checks.database.error).toBe('Connection refused');
  });
});

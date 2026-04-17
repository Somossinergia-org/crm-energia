import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

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

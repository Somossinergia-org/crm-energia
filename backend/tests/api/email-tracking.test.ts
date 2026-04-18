import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/middleware/rateLimiter', () => ({
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../src/models/email.model', () => ({
  emailTemplatesModel: {},
  emailAccountsModel: {},
  emailsEnviadosModel: {
    markOpened: vi.fn(),
    incrementClicks: vi.fn(),
  },
  emailCampaignsModel: {},
  emailTrackingModel: {
    create: vi.fn(),
  },
  emailSecuenciasModel: {},
}));

import app from '../../src/index';
import { emailsEnviadosModel, emailTrackingModel } from '../../src/models/email.model';

describe('Email Tracking Public Endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/email/track/open/:emailId', () => {
    it('returns 1x1 transparent gif without auth', async () => {
      (emailsEnviadosModel.markOpened as any).mockResolvedValue(undefined);
      (emailTrackingModel.create as any).mockResolvedValue({ id: 't-1' });

      const res = await request(app).get('/api/email/track/open/email-abc');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/gif');
      expect(res.headers['cache-control']).toContain('no-store');
    });

    it('records the open event with email id', async () => {
      (emailsEnviadosModel.markOpened as any).mockResolvedValue(undefined);
      (emailTrackingModel.create as any).mockResolvedValue({ id: 't-1' });

      await request(app).get('/api/email/track/open/email-xyz');

      expect(emailsEnviadosModel.markOpened).toHaveBeenCalledWith('email-xyz');
      expect(emailTrackingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email_id: 'email-xyz', tipo: 'apertura' })
      );
    });

    it('swallows model errors silently and still returns pixel', async () => {
      (emailsEnviadosModel.markOpened as any).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/email/track/open/email-abc');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/gif');
    });
  });

  describe('GET /api/email/track/click/:emailId', () => {
    it('redirects to destination url', async () => {
      (emailsEnviadosModel.incrementClicks as any).mockResolvedValue(undefined);
      (emailTrackingModel.create as any).mockResolvedValue({ id: 't-2' });

      const res = await request(app).get(
        '/api/email/track/click/email-abc?url=https://example.com/landing'
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://example.com/landing');
    });

    it('records click with url', async () => {
      (emailsEnviadosModel.incrementClicks as any).mockResolvedValue(undefined);
      (emailTrackingModel.create as any).mockResolvedValue({ id: 't-2' });

      await request(app).get('/api/email/track/click/email-123?url=https://x.com');

      expect(emailTrackingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email_id: 'email-123',
          tipo: 'click',
          url: 'https://x.com',
        })
      );
    });
  });
});

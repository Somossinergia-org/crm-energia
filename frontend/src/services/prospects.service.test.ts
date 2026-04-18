import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./api', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

import { prospectsApi } from './prospects.service';

describe('prospects service', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
  });

  describe('getAll', () => {
    it('calls GET /prospects with empty query when no filters', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [], pagination: {} } });
      await prospectsApi.getAll();
      expect(mockGet).toHaveBeenCalledWith('/prospects?');
    });

    it('encodes filters into URLSearchParams', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [], pagination: {} } });
      await prospectsApi.getAll({ estado: 'cliente', page: 2, search: 'Bar' });
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('estado=cliente');
      expect(url).toContain('page=2');
      expect(url).toContain('search=Bar');
    });

    it('skips empty/null/undefined filter values', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: [], pagination: {} } });
      await prospectsApi.getAll({ estado: 'cliente', search: '', prioridad: undefined as any });
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('estado=cliente');
      expect(url).not.toContain('search=');
      expect(url).not.toContain('prioridad');
    });
  });

  describe('getById', () => {
    it('calls GET /prospects/:id', async () => {
      mockGet.mockResolvedValue({ data: { success: true, data: { id: '1' } } });
      const res = await prospectsApi.getById('abc-123');
      expect(mockGet).toHaveBeenCalledWith('/prospects/abc-123');
      expect(res.data.id).toBe('1');
    });
  });

  describe('create', () => {
    it('posts data to /prospects', async () => {
      mockPost.mockResolvedValue({ data: { success: true, data: { id: 'new' } } });
      await prospectsApi.create({ nombre_negocio: 'Test' } as any);
      expect(mockPost).toHaveBeenCalledWith('/prospects', { nombre_negocio: 'Test' });
    });
  });

  describe('update', () => {
    it('puts data to /prospects/:id', async () => {
      mockPut.mockResolvedValue({ data: { success: true, data: { id: 'x' } } });
      await prospectsApi.update('x', { temperatura: 'caliente' } as any);
      expect(mockPut).toHaveBeenCalledWith('/prospects/x', { temperatura: 'caliente' });
    });
  });

  describe('updateStatus', () => {
    it('patches /:id/status with estado', async () => {
      mockPatch.mockResolvedValue({ data: { success: true, data: {} } });
      await prospectsApi.updateStatus('x', 'cliente');
      expect(mockPatch).toHaveBeenCalledWith('/prospects/x/status', { estado: 'cliente' });
    });
  });

  describe('delete', () => {
    it('calls DELETE /prospects/:id', async () => {
      mockDelete.mockResolvedValue({ data: {} });
      await prospectsApi.delete('x');
      expect(mockDelete).toHaveBeenCalledWith('/prospects/x');
    });
  });

  describe('duplicate', () => {
    it('posts to /:id/duplicate', async () => {
      mockPost.mockResolvedValue({ data: { success: true, data: {} } });
      await prospectsApi.duplicate('x');
      expect(mockPost).toHaveBeenCalledWith('/prospects/x/duplicate');
    });
  });
});

import { vi } from 'vitest';

// Set test environment before anything else
process.env.NODE_ENV = 'test';
process.env.VERCEL = '1'; // Prevent server auto-start on import

// Mock database module to avoid real DB connections in tests
vi.mock('../src/config/database', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
  query: vi.fn(),
  transaction: vi.fn(),
  testConnection: vi.fn().mockResolvedValue(true),
}));

// Mock logger to keep test output clean
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

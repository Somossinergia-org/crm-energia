import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

// Pool de conexiones PostgreSQL
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento de conexión
pool.on('connect', () => {
  logger.debug('Nueva conexion a PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('Error inesperado en PostgreSQL:', err);
});

// Helper para ejecutar queries
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug(`Query ejecutada en ${duration}ms: ${text.substring(0, 80)}...`);
  return result;
}

// Transacciones
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Verificar conexión
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`PostgreSQL conectado: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('Error conectando a PostgreSQL:', error);
    return false;
  }
}

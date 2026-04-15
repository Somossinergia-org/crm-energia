import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
  logger.info('Redis conectado');
});

redisClient.on('error', (err) => {
  logger.error('Error en Redis:', err);
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('No se pudo conectar a Redis:', error);
  }
}

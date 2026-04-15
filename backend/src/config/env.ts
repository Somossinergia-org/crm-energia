import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Buscar .env en la raíz del proyecto (un nivel arriba de backend/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Fallback: buscar en el directorio actual
dotenv.config();

// Esquema de validación para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // PostgreSQL
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('crm_energia'),
  DB_USER: z.string().default('crm_user'),
  DB_PASSWORD: z.string().default('crm_password_segura_2024'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  // JWT
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Cifrado
  ENCRYPTION_KEY: z.string().min(16).default('dev-encryption-key-32-chars-ok!'),

  // IA
  GEMINI_API_KEY: z.string().optional().default(''),

  // Gmail OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().optional().default('http://localhost:3000/api/gmail/callback'),

  // SMTP
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_NAME: z.string().optional().default('CRM Energia'),
  SMTP_FROM_EMAIL: z.string().optional().default(''),

  // Logs
  LOG_LEVEL: z.string().default('debug'),
  LOG_DIR: z.string().default('./logs'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10485760),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno invalidas:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

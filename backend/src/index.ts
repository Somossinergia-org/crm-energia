import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { testConnection } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Rutas
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import debugRoutes from './routes/debug.routes';
import usersRoutes from './routes/users.routes';
import prospectsRoutes from './routes/prospects.routes';
import zonesRoutes from './routes/zones.routes';
import contactsRoutes from './routes/contacts.routes';
import visitsRoutes from './routes/visits.routes';
import emailRoutes from './routes/email.routes';
import serviciosRoutes from './routes/servicios.routes';
import documentsRoutes from './routes/documents.routes';
import billParserRoutes from './routes/billParser.routes';
import proposalRoutes from './routes/proposal.routes';
import aiRoutes from './routes/ai.routes';
import gmailRoutes from './routes/gmail.routes';
import agentRoutes from './routes/agent.routes';
import analyticsRoutes from './routes/analytics.routes';
import salesRoutes from './routes/sales.routes';
import path from 'path';

const app = express();
app.set('trust proxy', true);

// ── Middleware global ──
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// Logging HTTP
app.use(morgan('short', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// ── Rutas API ──
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
if (env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}
app.use('/api/users', usersRoutes);
app.use('/api/prospects', prospectsRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/bill', billParserRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo de errores ──
app.use(errorHandler);

// ── Iniciar servidor ──
async function waitForDB(maxRetries = 10, delayMs = 3000): Promise<boolean> {
  for (let i = 1; i <= maxRetries; i++) {
    const ok = await testConnection();
    if (ok) return true;
    if (i < maxRetries) {
      logger.warn(`PostgreSQL no disponible (intento ${i}/${maxRetries}). Reintentando en ${delayMs / 1000}s... (¿Docker esta corriendo?)`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

async function start() {
  // Iniciar servidor inmediatamente (no bloqueante)
  const server = app.listen(env.PORT, () => {
    logger.info(`Servidor CRM Energia corriendo en puerto ${env.PORT}`);
    logger.info(`Entorno: ${env.NODE_ENV}`);
    logger.info(`Frontend: ${env.FRONTEND_URL}`);
  });

  // Conectar a dependencias en background (sin bloquear)
  (async () => {
    try {
      const dbOk = await waitForDB();
      if (dbOk) {
        logger.info('✅ PostgreSQL conectado');
      } else {
        logger.warn('⚠️  PostgreSQL no disponible - API operará en modo limitado');
      }
    } catch (err) {
      logger.warn('⚠️  Error conectando a PostgreSQL:', err);
    }

  })();

  return server;
}

// Only start server if not on Vercel (Vercel handles the server)
if (!process.env.VERCEL) {
  start().catch((err) => {
    logger.error('Error al iniciar:', err);
    process.exit(1);
  });
}

export default app;

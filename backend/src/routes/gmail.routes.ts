import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as gc from '../controllers/gmail.controller';

const router = Router();

// Unsubscribe público (sin auth)
router.get('/unsubscribe/:token', gc.publicUnsubscribe);

// Todas las demás rutas requieren auth
router.use(authenticate);

// OAuth
router.get('/auth', gc.startOAuth);
router.get('/callback', gc.oauthCallback);

// Cuentas
router.get('/accounts', gc.getAccounts);
router.delete('/accounts/:id', gc.disconnectAccount);

// Sync
router.post('/sync', gc.syncEmails);

// Inbox
router.get('/inbox', gc.getInbox);
router.get('/inbox/stats', gc.getInboxStats);
router.patch('/inbox/:id/read', gc.markRead);

// Hilos por prospecto
router.get('/threads/:prospectId', gc.getProspectThread);

export default router;

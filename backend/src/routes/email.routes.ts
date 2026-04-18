import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ec from '../controllers/email.controller';

const router = Router();

// ── Tracking (public, no auth - must be before authenticate) ──
router.get('/track/open/:emailId', ec.trackOpen);
router.get('/track/click/:emailId', ec.trackClick);

// ── Protected routes ──
router.use(authenticate);

// Templates: lectura libre, escritura admin+supervisor
router.get('/templates', ec.getTemplates);
router.get('/templates/:id', ec.getTemplate);
router.post('/templates', authorize('admin', 'supervisor'), ec.createTemplate);
router.put('/templates/:id', authorize('admin', 'supervisor'), ec.updateTemplate);
router.delete('/templates/:id', authorize('admin'), ec.deleteTemplate);
router.post('/templates/preview', ec.previewTemplate);

// Accounts SMTP: solo admin (credenciales)
router.get('/accounts', authorize('admin'), ec.getAccounts);
router.post('/accounts', authorize('admin'), ec.createAccount);
router.put('/accounts/:id', authorize('admin'), ec.updateAccount);
router.delete('/accounts/:id', authorize('admin'), ec.deleteAccount);
router.post('/accounts/test', authorize('admin'), ec.testAccount);

// Sending: individual libre, bulk admin+supervisor
router.post('/send', ec.sendSingleEmail);
router.post('/send/bulk', authorize('admin', 'supervisor'), ec.sendBulkEmail);

// History & Stats
router.get('/history', ec.getEmailHistory);
router.get('/stats', ec.getEmailStats);
router.get('/prospect/:prospectId', ec.getEmailsByProspect);

// Campaigns: lectura libre, escritura/launch admin+supervisor
router.get('/campaigns', ec.getCampaigns);
router.get('/campaigns/:id', ec.getCampaign);
router.post('/campaigns', authorize('admin', 'supervisor'), ec.createCampaign);
router.put('/campaigns/:id', authorize('admin', 'supervisor'), ec.updateCampaign);
router.delete('/campaigns/:id', authorize('admin'), ec.deleteCampaign);
router.post('/campaigns/:id/launch', authorize('admin', 'supervisor'), ec.launchCampaign);

// Secuencias (Drip): lectura+inscripcion libre, config admin+supervisor
router.get('/secuencias', ec.getSecuencias);
router.get('/secuencias/:id', ec.getSecuencia);
router.post('/secuencias', authorize('admin', 'supervisor'), ec.createSecuencia);
router.put('/secuencias/:id', authorize('admin', 'supervisor'), ec.updateSecuencia);
router.delete('/secuencias/:id', authorize('admin'), ec.deleteSecuencia);
router.post('/secuencias/:id/pasos', authorize('admin', 'supervisor'), ec.addPasoSecuencia);
router.delete('/secuencias/:id/pasos/:pasoId', authorize('admin', 'supervisor'), ec.deletePasoSecuencia);
router.post('/secuencias/:id/inscribir', ec.inscribirProspecto);
router.delete('/secuencias/:id/inscritos/:prospectId', ec.desinscribirProspecto);

export default router;

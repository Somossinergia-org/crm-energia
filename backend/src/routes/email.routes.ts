import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ec from '../controllers/email.controller';

const router = Router();

// ── Tracking (public, no auth - must be before authenticate) ──
router.get('/track/open/:emailId', ec.trackOpen);
router.get('/track/click/:emailId', ec.trackClick);

// ── Protected routes ──
router.use(authenticate);

// Templates
router.get('/templates', ec.getTemplates);
router.get('/templates/:id', ec.getTemplate);
router.post('/templates', ec.createTemplate);
router.put('/templates/:id', ec.updateTemplate);
router.delete('/templates/:id', ec.deleteTemplate);
router.post('/templates/preview', ec.previewTemplate);

// Accounts
router.get('/accounts', ec.getAccounts);
router.post('/accounts', ec.createAccount);
router.put('/accounts/:id', ec.updateAccount);
router.delete('/accounts/:id', ec.deleteAccount);
router.post('/accounts/test', ec.testAccount);

// Sending
router.post('/send', ec.sendSingleEmail);
router.post('/send/bulk', ec.sendBulkEmail);

// History & Stats
router.get('/history', ec.getEmailHistory);
router.get('/stats', ec.getEmailStats);
router.get('/prospect/:prospectId', ec.getEmailsByProspect);

// Campaigns
router.get('/campaigns', ec.getCampaigns);
router.get('/campaigns/:id', ec.getCampaign);
router.post('/campaigns', ec.createCampaign);
router.put('/campaigns/:id', ec.updateCampaign);
router.delete('/campaigns/:id', ec.deleteCampaign);
router.post('/campaigns/:id/launch', ec.launchCampaign);

// Secuencias (Drip)
router.get('/secuencias', ec.getSecuencias);
router.get('/secuencias/:id', ec.getSecuencia);
router.post('/secuencias', ec.createSecuencia);
router.put('/secuencias/:id', ec.updateSecuencia);
router.delete('/secuencias/:id', ec.deleteSecuencia);
router.post('/secuencias/:id/pasos', ec.addPasoSecuencia);
router.delete('/secuencias/:id/pasos/:pasoId', ec.deletePasoSecuencia);
router.post('/secuencias/:id/inscribir', ec.inscribirProspecto);
router.delete('/secuencias/:id/inscritos/:prospectId', ec.desinscribirProspecto);

export default router;

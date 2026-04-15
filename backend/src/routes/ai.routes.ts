import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ai from '../controllers/ai.controller';

const router = Router();
router.use(authenticate);

// Briefing diario
router.get('/briefing', ai.getDailyBriefing);

// Email con IA
router.post('/generate-email', ai.generateEmailAI);

// Scoring
router.post('/prospects/:id/score', ai.scoreProspect);
router.get('/prospects/:id/score', ai.getScore);
router.post('/prospects/score/bulk', ai.scoreBulk);

// Briefing de llamada
router.get('/prospects/:id/briefing', ai.getCallBriefing);

export default router;

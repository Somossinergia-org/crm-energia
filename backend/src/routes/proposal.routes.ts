import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generateProposal } from '../controllers/proposal.controller';

const router = Router();

// POST /api/proposals/generate - Generate PDF proposal
router.post('/generate', authenticate, generateProposal);

export default router;

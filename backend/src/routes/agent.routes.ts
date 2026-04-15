import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as agent from '../controllers/agent.controller';

const router = Router();
router.use(authenticate);

router.post('/chat', agent.agentChat);
router.get('/logs', agent.getAgentLogs);

export default router;

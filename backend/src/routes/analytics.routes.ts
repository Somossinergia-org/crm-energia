import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ac from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

router.get('/kpis', ac.getKPIs);
router.get('/monthly', ac.getMonthlyEvolution);
router.get('/by-estado', ac.getByEstado);
router.get('/top-municipios', ac.getTopMunicipios);
router.get('/radar', ac.getRadarOportunidades);
router.get('/prediccion-cierres', ac.getPrediccionCierres);
router.get('/heatmap', ac.getActivityHeatmap);
router.get('/weekly-report', ac.getWeeklyReport);
router.get('/export/excel', ac.exportExcel);
router.get('/export/pdf', ac.exportPDF);

export default router;

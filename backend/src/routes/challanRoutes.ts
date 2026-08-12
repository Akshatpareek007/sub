import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  exportChallanPDF,
} from '../controllers/challanController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getChallans);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getChallanById);
router.get('/:id/pdf', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), exportChallanPDF);
router.post('/', requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), createChallan);
router.patch('/:id/status', requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), updateChallanStatus);

export default router;

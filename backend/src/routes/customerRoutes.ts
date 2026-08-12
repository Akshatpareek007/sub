import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
} from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomers);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomerById);
router.post('/', requireRole(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', requireRole(['ADMIN', 'SALES']), updateCustomer);
router.post('/:id/follow-ups', requireRole(['ADMIN', 'SALES']), addFollowUpNote);

export default router;

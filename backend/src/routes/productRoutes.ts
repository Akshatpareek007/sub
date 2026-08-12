import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockLogs,
} from '../controllers/productController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getProducts);
router.get('/stock-logs', requireRole(['ADMIN', 'WAREHOUSE', 'ACCOUNTS', 'SALES']), getStockLogs);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getProductById);
router.post('/', requireRole(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', requireRole(['ADMIN', 'WAREHOUSE']), updateProduct);
router.post('/:id/stock', requireRole(['ADMIN', 'WAREHOUSE']), adjustStock);

export default router;

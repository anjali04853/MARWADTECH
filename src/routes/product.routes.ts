import { Router } from 'express';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/product.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.route('/')
    .get(getProducts)
    .post(protect, authorize('admin'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('admin'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

export default router;

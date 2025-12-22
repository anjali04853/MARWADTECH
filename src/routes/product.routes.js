const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth');
const { 
  createProductValidation, 
  updateProductValidation, 
  productQueryValidation, 
  validate 
} = require('../middleware/validators/product.validator');
const { uploadFile, uploadFiles } = require('../utils/fileUpload');

// Public routes
router.get(
  '/',
  productQueryValidation,
  validate,
  productController.getProducts
);

router.get(
  '/:id',
  productController.getProduct
);

// Protected routes (require authentication and authorization)
router.use(protect);

// Only admin can create, update, delete products
router.post(
  '/',
  authorize('admin'),
  createProductValidation,
  validate,
  productController.createProduct
);

router.put(
  '/:id',
  authorize('admin'),
  updateProductValidation,
  validate,
  productController.updateProduct
);

router.delete(
  '/:id',
  authorize('admin'),
  productController.deleteProduct
);

// Upload single product photo (main image)
router.put(
  '/:id/photo',
  authorize('admin'),
  uploadFile('image'),
  productController.productPhotoUpload
);

// Upload multiple product photos
router.put(
  '/:id/photos',
  authorize('admin'),
  uploadFiles('images', 5), // Max 5 files
  productController.productPhotosUpload
);

// Delete product photo
router.delete(
  '/:id/photo/:filename',
  authorize('admin'),
  productController.deleteProductPhoto
);

// Search products by name
router.get(
  '/search',
  productQueryValidation,
  validate,
  productController.searchProducts
);

// Get products by category
router.get(
  '/category/:category',
  productQueryValidation,
  validate,
  productController.getProductsByCategory
);

module.exports = router;

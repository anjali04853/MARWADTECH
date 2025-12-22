const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Validation rules for creating a product
exports.createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Beauty', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters'),
];

// Validation rules for updating a product
exports.updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  
  body('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Beauty', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters'),
];

// Validation rules for product query parameters
exports.productQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .matches(/^[a-zA-Z0-9_,\s-]+$/)
    .withMessage('Invalid sort parameter'),
  
  query('select')
    .optional()
    .matches(/^[a-zA-Z0-9_,\s]+$/)
    .withMessage('Invalid select parameter'),
  
  query('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Beauty', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  
  query('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  query('price[gt]')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  query('price[gte]')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  query('price[lt]')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  query('price[lte]')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  query('createdAt[gt]')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00.000Z)'),
  
  query('createdAt[gte]')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00.000Z)'),
  
  query('createdAt[lt]')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00.000Z)'),
  
  query('createdAt[lte]')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00.000Z)'),
];

// Middleware to handle validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  
  return res.status(422).json({
    success: false,
    error: 'Validation failed',
    errors: extractedErrors,
  });
};

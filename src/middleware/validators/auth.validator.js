const { body, validationResult } = require('express-validator');

// Validation rules for user registration
exports.registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Validation rules for user login
exports.loginValidation = [
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
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

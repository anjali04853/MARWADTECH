const { query, param, validationResult } = require('express-validator');

// Validation for dashboard analytics
exports.dashboardAnalyticsValidation = [
  query('range')
    .optional()
    .isIn(['today', 'yesterday', 'weekly', 'monthly', 'custom'])
    .withMessage('Invalid range parameter. Must be one of: today, yesterday, weekly, monthly, custom'),
  
  query('startDate')
    .if(query('range').equals('custom'))
    .notEmpty()
    .withMessage('startDate is required when range is custom')
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  
  query('endDate')
    .if(query('range').equals('custom'))
    .notEmpty()
    .withMessage('endDate is required when range is custom')
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('endDate must be greater than or equal to startDate');
      }
      return true;
    })
];

// Validation for sales report
exports.salesReportValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('endDate must be greater than or equal to startDate');
      }
      return true;
    })
];

// Validation for user analytics
exports.userAnalyticsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be an integer between 1 and 365')
    .toInt()
];

// Validation for product analytics
exports.productAnalyticsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt()
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

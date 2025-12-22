const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');
const {
  dashboardAnalyticsValidation,
  salesReportValidation,
  userAnalyticsValidation,
  productAnalyticsValidation,
  validate,
} = require('../middleware/validators/analytics.validator');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private/Admin
router.get(
  '/dashboard',
  dashboardAnalyticsValidation,
  validate,
  analyticsController.getDashboardAnalytics
);

// @desc    Get sales report
// @route   GET /api/v1/analytics/sales-report
// @access  Private/Admin
router.get(
  '/sales-report',
  salesReportValidation,
  validate,
  analyticsController.getSalesReport
);

// @desc    Get user analytics
// @route   GET /api/v1/analytics/users
// @access  Private/Admin
router.get(
  '/users',
  userAnalyticsValidation,
  validate,
  analyticsController.getUserAnalytics
);

// @desc    Get product analytics
// @route   GET /api/v1/analytics/products
// @access  Private/Admin
router.get(
  '/products',
  productAnalyticsValidation,
  validate,
  analyticsController.getProductAnalytics
);

module.exports = router;

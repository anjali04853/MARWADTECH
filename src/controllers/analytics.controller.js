const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private/Admin
exports.getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  // Get date range from query params (today, yesterday, weekly, monthly, or custom)
  const { range = 'today' } = req.query;
  let startDate, endDate;

  // Set date range based on the selected option
  const now = new Date();
  
  switch (range.toLowerCase()) {
    case 'yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return next(new ErrorResponse('Invalid date range', 400));
      }
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default: // today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
  }

  // Get total users
  const totalUsers = await User.countDocuments({
    createdAt: { $lte: endDate }
  });

  // Get new users in date range
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Get total products
  const totalProducts = await Product.countDocuments({
    createdAt: { $lte: endDate }
  });

  // Get new products in date range
  const newProducts = await Product.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Get total orders and revenue
  const orders = await Order.aggregate([
    {
      $match: {
        createdAt: { $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        avgOrderValue: { $avg: "$totalAmount" }
      }
    }
  ]);

  // Get orders and revenue for the selected date range
  const periodOrders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        periodOrders: { $sum: 1 },
        periodRevenue: { $sum: "$totalAmount" },
        avgPeriodOrderValue: { $avg: "$totalAmount" }
      }
    }
  ]);

  // Get sales data for chart (group by day)
  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        sales: { $sum: "$totalAmount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get top selling products
  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  // Format the response
  const result = {
    success: true,
    data: {
      summary: {
        totalUsers,
        newUsers,
        totalProducts,
        newProducts,
        totalOrders: orders[0]?.totalOrders || 0,
        totalRevenue: orders[0]?.totalRevenue || 0,
        avgOrderValue: orders[0]?.avgOrderValue || 0,
        periodOrders: periodOrders[0]?.periodOrders || 0,
        periodRevenue: periodOrders[0]?.periodRevenue || 0,
        avgPeriodOrderValue: periodOrders[0]?.avgPeriodOrderValue || 0,
        dateRange: {
          start: startDate,
          end: endDate,
          range
        }
      },
      charts: {
        salesData,
        topProducts
      }
    }
  };

  res.status(200).json(result);
});

// @desc    Get sales report
// @route   GET /api/v1/analytics/sales-report
// @access  Private/Admin
exports.getSalesReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  // Validate dates
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ErrorResponse('Invalid date range', 400));
  }
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  // Get orders in date range
  const orders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        date: { $first: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
        itemsSold: { $sum: { $size: "$items" } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Calculate totals
  const totals = orders.reduce((acc, curr) => {
    return {
      totalOrders: acc.totalOrders + curr.orders,
      totalRevenue: acc.totalRevenue + curr.revenue,
      totalItemsSold: acc.totalItemsSold + curr.itemsSold
    };
  }, { totalOrders: 0, totalRevenue: 0, totalItemsSold: 0 });
  
  res.status(200).json({
    success: true,
    data: {
      dateRange: { start, end },
      totals,
      dailyData: orders
    }
  });
});

// @desc    Get user analytics
// @route   GET /api/v1/analytics/users
// @access  Private/Admin
exports.getUserAnalytics = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  // Get user signups by day
  const userSignups = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Get user count by role
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      dateRange: { start: startDate, end: endDate },
      userSignups,
      usersByRole
    }
  });
});

// @desc    Get product analytics
// @route   GET /api/v1/analytics/products
// @access  Private/Admin
exports.getProductAnalytics = asyncHandler(async (req, res, next) => {
  // Get top selling products
  const topSelling = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);
  
  // Get products by category
  const productsByCategory = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        totalStock: { $sum: "$stock" }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Get products by status
  const productsByStatus = await Product.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        totalStock: { $sum: "$stock" }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      topSelling,
      productsByCategory,
      productsByStatus
    }
  });
});

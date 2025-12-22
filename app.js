const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { PORT, UPLOAD_FOLDER } = require('./src/config/config');
const ErrorResponse = require('./src/utils/errorResponse');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

// Initialize express app
const app = express();

// Create uploads and logs folders if they don't exist
const fs = require('fs');
const createFolderIfNotExists = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

createFolderIfNotExists(UPLOAD_FOLDER);
createFolderIfNotExists('logs');

// Configure Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'marwadtech-api' },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  exitOnError: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_FOLDER)));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Default route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to MarwadTech API',
    version: '1.0.0',
    documentation: '/api/v1/docs', // Will be added when we implement API documentation
  });
});

// API documentation route (to be implemented)
app.get('/api/v1/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      auth: {
        register: { method: 'POST', path: '/api/v1/auth/register' },
        login: { method: 'POST', path: '/api/v1/auth/login' },
        getMe: { method: 'GET', path: '/api/v1/auth/me', protected: true },
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Log to file
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized, token failed';
    error = new ErrorResponse(message, 401);
  }

  // Handle JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
});

// 404 handler - Must be last route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;

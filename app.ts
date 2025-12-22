import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { PORT, UPLOAD_FOLDER, NODE_ENV } from './src/config/config';
import ErrorResponse from './src/utils/errorResponse';
import fs from 'fs';

// Import routes
import authRoutes from './src/routes/auth.routes';
import productRoutes from './src/routes/product.routes';

// Initialize express app
const app = express();

// Create folders if they don't exist
const createFolderIfNotExists = (folder: string) => {
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
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
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
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_FOLDER)));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);

// Default route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to MarwadTech API (TS/Sequelize)',
        version: '1.0.0',
    });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

    if (NODE_ENV === 'development') {
        console.error(err.stack);
    }

    logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
    });
});

export default app;

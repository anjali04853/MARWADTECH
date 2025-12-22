import jwt from 'jsonwebtoken';
import asyncHandler from './async';
import ErrorResponse from '../utils/errorResponse';
import User from '../models/User';
import { JWT_SECRET } from '../config/config';
import { Request, Response, NextFunction } from 'express';

// Protect routes
export const protect = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        req.user = await User.findByPk(decoded.id);

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role ${req.user.role} is not authorized to access this route`,
                    403
                )
            );
        }
        next();
    };
};

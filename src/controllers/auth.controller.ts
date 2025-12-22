import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { fullName, mobileNumber, password, role } = req.body;

    // Create user
    const user = await User.create({
        fullName,
        mobileNumber,
        password,
        role,
    });

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { mobileNumber, password } = req.body;

    // Validate mobile & password
    if (!mobileNumber || !password) {
        return next(new ErrorResponse('Please provide a mobile number and password', 400));
    }

    // Check for user
    const user = await User.findOne({ where: { mobileNumber } });

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const user = await User.findByPk(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user: User, statusCode: number, res: Response) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
    });
};

const User = require('../models/user.model');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { fullName, mobileNumber, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ mobileNumber });
  if (userExists) {
    return next(new ErrorResponse('User already exists with this mobile number', 400));
  }

  // Create user
  const user = await User.create({
    fullName,
    mobileNumber,
    password,
  });

  // Create token
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      role: user.role,
    },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { mobileNumber, password } = req.body;

  // Check for user
  const user = await User.findOne({ mobileNumber }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      role: user.role,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

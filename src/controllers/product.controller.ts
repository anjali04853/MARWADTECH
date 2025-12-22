import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const products = await Product.findAll();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products,
    });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        data: product,
    });
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let product = await Product.findByPk(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    product = await product.update(req.body);

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    await product.destroy();

    res.status(200).json({
        success: true,
        data: {},
    });
});

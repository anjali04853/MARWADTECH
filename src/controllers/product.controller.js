const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const { UPLOAD_FOLDER } = require('../config/config');
const { uploadFile, deleteFile } = require('../utils/fileUpload');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  let query = Product.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Product.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const products = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: products.length,
    pagination,
    data: products,
  });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: 'reviews',
    select: 'title text rating',
  });

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
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
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this product`,
        401
      )
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this product`,
        401
      )
    );
  }

  await product.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Upload photo for product
// @route   PUT /api/v1/products/:id/photo
// @access  Private/Admin
exports.productPhotoUpload = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this product`,
        401
      )
    );
  }

  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // If there was an existing image, delete it
  if (product.image && product.image !== 'no-photo.jpg') {
    await deleteFile(product.image);
  }

  // Update product with new image filename
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { image: req.file.filename },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      product: updatedProduct
    }
  });
});

// @desc    Upload multiple photos for product
// @route   PUT /api/v1/products/:id/photos
// @access  Private/Admin
exports.productPhotosUpload = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this product`,
        401
      )
    );
  }

  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('Please upload at least one file', 400));
  }

  // Get existing images
  let images = product.images || [];
  
  // Add new images
  const newImages = req.files.map(file => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    uploadedAt: new Date()
  }));

  // Combine existing and new images
  images = [...images, ...newImages];

  // Update product with new images
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { images },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    count: newImages.length,
    data: updatedProduct.images
  });
});

// @desc    Delete product photo
// @route   DELETE /api/v1/products/:id/photo/:filename
// @access  Private/Admin
exports.deleteProductPhoto = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this product`,
        401
      )
    );
  }

  // If it's the main image
  if (product.image === req.params.filename) {
    await deleteFile(req.params.filename);
    product.image = 'no-photo.jpg';
    await product.save();
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  }
  
  // If it's in the images array
  if (product.images && product.images.length > 0) {
    const imageIndex = product.images.findIndex(
      img => img.filename === req.params.filename
    );
    
    if (imageIndex !== -1) {
      const [deletedImage] = product.images.splice(imageIndex, 1);
      await deleteFile(deletedImage.filename);
      await product.save();
      
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
  }

  return next(
    new ErrorResponse(`File ${req.params.filename} not found for this product`, 404)
  );
});

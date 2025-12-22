const mongoose = require('mongoose');
const { UPLOAD_FOLDER } = require('../config/config');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be a positive number'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be less than 0'],
      max: [100, 'Discount cannot be more than 100'],
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be less than 0'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: [
        'Electronics',
        'Clothing',
        'Books',
        'Home & Kitchen',
        'Beauty',
        'Sports',
        'Other',
      ],
    },
    // Main product image
    image: {
      type: String,
      default: 'no-photo.jpg',
    },
    // Additional product images
    images: [
      {
        filename: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate discounted price
productSchema.virtual('discountedPrice').get(function () {
  return this.price * (1 - this.discount / 100);
});

// Cascade delete product reviews when a product is deleted
productSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ product: this._id });
  next();
});

// Reverse populate with virtuals
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});

// Static method to get average rating of a product
productSchema.statics.getAverageRating = async function (productId) {
  const obj = await this.model('Review').aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      averageRating: obj[0] ? Math.ceil(obj[0].averageRating * 10) / 10 : 0,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
productSchema.post('save', function () {
  this.constructor.getAverageRating(this._id);
});

// Call getAverageRating before remove
productSchema.pre('remove', function () {
  this.constructor.getAverageRating(this._id);
});

module.exports = mongoose.model('Product', productSchema);

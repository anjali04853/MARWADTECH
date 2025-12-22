const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be a positive number'],
  },
  image: {
    type: String,
    default: 'no-image.jpg',
  },
});

const shippingAddressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const paymentResultSchema = new mongoose.Schema({
  id: { type: String },
  status: { type: String },
  update_time: { type: String },
  email_address: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cod', 'card', 'upi', 'netbanking'],
    },
    paymentResult: paymentResultSchema,
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate total amount before saving
orderSchema.pre('save', async function (next) {
  // Calculate items price
  this.itemsPrice = this.orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Calculate shipping price (free shipping for orders over $100)
  this.shippingPrice = this.itemsPrice > 100 ? 0 : 10;

  // Calculate tax (10% of items price)
  this.taxPrice = Number((this.itemsPrice * 0.1).toFixed(2));

  // Calculate total price
  this.totalAmount = Number(
    (this.itemsPrice + this.shippingPrice + this.taxPrice).toFixed(2)
  );

  next();
});

// Update product stock when an order is placed
orderSchema.post('save', async function (doc) {
  if (doc.status === 'processing') {
    for (const item of doc.orderItems) {
      await this.model('Product').updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
    }
  }
});

// Update product stock when an order is cancelled
orderSchema.post('findOneAndUpdate', async function (doc) {
  if (doc.status === 'cancelled' && this._update.status === 'cancelled') {
    for (const item of doc.orderItems) {
      await this.model('Product').updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }
  }
});

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

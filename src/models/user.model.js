const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/config');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Please add a mobile number'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Please add a valid 10-digit mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Don't return password in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Prevent duplicate mobile numbers
userSchema.index({ mobileNumber: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);

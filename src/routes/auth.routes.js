const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerValidation, loginValidation, validate } = require('../middleware/validators/auth.validator');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;

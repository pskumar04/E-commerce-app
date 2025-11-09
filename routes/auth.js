const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const registerValidation = [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 })
];

// ✅ ADD DIRECT DEBUGGING TO REGISTER ROUTE
router.post('/register', registerValidation, (req, res, next) => {
  console.log('=== DIRECT ROUTE DEBUGGING ===');
  console.log('Route: /api/auth/register');
  console.log('Request body received:', JSON.stringify(req.body, null, 2));
  console.log('Phone field in route:', req.body.phone);
  console.log('Phone field type:', typeof req.body.phone);
  console.log('All fields:', Object.keys(req.body));
  console.log('=== END ROUTE DEBUGGING ===');
  next();
}, authController.registerCustomer);

router.post('/register/supplier', registerValidation, authController.registerSupplier);
router.post('/login', loginValidation, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
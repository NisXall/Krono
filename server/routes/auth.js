const express = require('express');
const router = express.Router();
const {registerUser, loginUser, verifyOtp, forgetPassword, resetPassword, logoutUser} = require('../controllers/authController.js');
const {protect} = require('../middleware/auth.js');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logoutUser);

module.exports = router;

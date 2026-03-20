const express = require('express');
const router = express.Router();
const {bookEvent, sendBookingOtp, getMyBookings, confirmBooking, cancelBooking} = require('../controllers/bookingController.js');
const {protect, admin} = require('../middleware/auth.js');

router.post('/', protect, bookEvent);
router.post('/send-otp', protect, sendBookingOtp);
router.get('/my',protect,getMyBookings);
router.put('/:id/confirm',protect, admin, confirmBooking);
router.delete('/:id', protect, cancelBooking);

module.exports = router;

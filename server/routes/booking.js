const express = require('express');
const router = express.Router();
const {bookEvent, sendBookingOtp, getMyBookings, getAllBookings, processBookingPayment, confirmBooking, cancelBooking} = require('../controllers/bookingController.js');
const {protect, admin} = require('../middleware/auth.js');

router.post('/', protect, bookEvent);
router.post('/send-otp', protect, sendBookingOtp);
router.get('/my',protect,getMyBookings);
router.get('/all', protect, admin, getAllBookings);
router.put('/:id/pay', protect, processBookingPayment);
router.put('/:id/confirm',protect, admin, confirmBooking);
router.delete('/:id', protect, cancelBooking);

module.exports = router;

const Booking = require('../models/Bookings.js');
const { Otp } = require('../models/OTP');
const Event = require('../models/Event');
const {sendOtpEmail, sendBookingEmail} = require('../utils/email');

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


exports.sendBookingOtp = async (req, res) => {
    try {
        const otp = generateOtp();
        await Otp.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await Otp.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOtpEmail(req.user.email, otp, 'event_booking');
        console.log(`Booking OTP for ${req.user.email}: ${otp}`);
        res.json({ message: 'OTP sent to your email for booking confirmation' });
    } catch (error) {
        console.error('Error sending booking OTP:', error);
        res.status(500).json({ error: 'Error sending OTP' });
    }
}

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        const otpRecord = await Otp.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({ error: 'No seats available for this event' });
        }

        const existingBooking = await Booking.findOne({ userId: req.user._id, eventId });
        if (existingBooking) {
            return res.status(400).json({ error: 'You have already booked this event' });
        }

        const booking = await Booking.create({
            userId: req.user._id,
            eventId,
            amount: event.ticketPrice,
            status: 'pending',
            paymentStatus: 'not_paid',
        });

        await Otp.deleteMany({ email: req.user.email, action: 'event_booking' });
        res.json({ message: 'Booking Created. Please check your email for booking confirmation.', bookingId: booking._id });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Error creating booking' });
    }
}

exports.confirmBooking = async (req, res) => {
    try {
        const paymentStatus = req.body.paymentStatus;
        if (!['paid', 'not_paid'].includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        const booking = await Booking.findById(req.params.id).populate('eventId');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.status === 'confirmed') {
            return res.status(400).json({ error: 'Booking is already confirmed' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.availableSeats <= 0) {
            return res.status(400).json({ error: 'No seats available for this event' });
        }

        booking.status = 'confirmed';
        booking.paymentStatus = paymentStatus;
        await booking.save();

        event.availableSeats -= 1;
        await event.save();

        await sendBookingEmail(req.user.email, event.title, booking._id);
        res.json({ message: 'Booking confirmed successfully' });
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({ error: 'Error confirming booking' });
    }
}

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id }).populate('eventId');
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
        }
        if (booking.status === 'confirmed') {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        booking.status = 'cancelled';
        await booking.save();
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Error cancelling booking' });
    }
}

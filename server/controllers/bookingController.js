const Booking = require('../models/Bookings.js');
const { Otp } = require('../models/OTP');
const Event = require('../models/Event');
const {sendOtpEmail, sendBookingEmail} = require('../utils/email');

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


exports.sendBookingOtp = async (req, res) => {
    try {
        const { eventId, numberOfTickets } = req.body;
        
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const parsedTickets = Number(numberOfTickets);
        if (!Number.isInteger(parsedTickets) || parsedTickets < 1 || parsedTickets > 5) {
            return res.status(400).json({ error: 'You can book between 1 and 5 tickets in one booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.availableSeats < parsedTickets) {
            return res.status(400).json({ error: `Only ${event.availableSeats} seats available for this event` });
        }

        // Check if user already has a booking for this event
        const existingBooking = await Booking.findOne({ userId: req.user._id, eventId });
        if (existingBooking) {
            return res.status(400).json({ error: 'You have already booked this event' });
        }

        const otp = generateOtp();
        await Otp.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await Otp.create({ email: req.user.email, otp, action: 'event_booking' });
        
        try {
            await sendOtpEmail(req.user.email, otp, 'event_booking');
            console.log(`Booking OTP for ${req.user.email}: ${otp}`);
            res.json({ message: 'OTP sent to your email for booking confirmation', otp: otp });
        } catch (emailError) {
            console.error('Email send failed, but OTP stored:', emailError);
            res.json({ message: 'OTP generated. Check console or use: ' + otp, otp: otp });
        }
    } catch (error) {
        console.error('Error sending booking OTP:', error);
        res.status(500).json({ error: 'Error creating OTP' });
    }
}

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp, numberOfTickets } = req.body;
        console.log(req.body);
        const otpRecord = await Otp.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const parsedTickets = Number(numberOfTickets);
        if (!Number.isInteger(parsedTickets) || parsedTickets < 1 || parsedTickets > 5) {
            return res.status(400).json({ error: 'You can book between 1 and 5 tickets in one booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.availableSeats < parsedTickets) {
            return res.status(400).json({ error: `Only ${event.availableSeats} seats available for this event` });
        }

        const existingBooking = await Booking.findOne({ userId: req.user._id, eventId });
        if (existingBooking) {
            return res.status(400).json({ error: 'You have already booked this event' });
        }

        const booking = await Booking.create({
            userId: req.user._id,
            eventId,
            numberOfTickets: parsedTickets,
            amount: event.ticketPrice * parsedTickets,
            status: 'pending',
            paymentStatus: 'not_paid',
        });

        // Send booking confirmation email with event details
        await sendBookingEmail(req.user.email, event.title, booking._id, event.date);

        await Otp.deleteMany({ email: req.user.email, action: 'event_booking' });
        res.json({
            message: 'Booking created. Please complete payment to move it for admin verification.',
            bookingId: booking._id,
            booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Error creating booking', message: 'Error creating booking' });
    }
}

exports.processBookingPayment = async (req, res) => {
    try {
        const { paymentAmount } = req.body;
        const booking = await Booking.findById(req.params.id).populate('eventId').populate('userId', 'email');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bookingOwnerId = booking.userId?._id ? booking.userId._id.toString() : booking.userId.toString();
        if (bookingOwnerId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You are not authorized to update this booking' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Cancelled booking cannot be paid' });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({ error: 'Booking is already confirmed' });
        }

        const parsedAmount = Number(paymentAmount);
        if (!Number.isFinite(parsedAmount)) {
            return res.status(400).json({ error: 'Please enter a valid payment amount' });
        }

        if (parsedAmount !== booking.amount) {
            return res.status(400).json({ error: `Amount must be exactly ${booking.amount}` });
        }

        booking.paymentStatus = 'paid';
        await booking.save();

        res.json({ message: 'Payment successful. Your booking is pending admin verification.', booking });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: 'Internal server error while processing payment' });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('eventId').populate('userId', 'email');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.status === 'confirmed') {
            return res.status(400).json({ error: 'Booking is already confirmed' });
        }
        if (booking.paymentStatus !== 'paid') {
            return res.status(400).json({ error: 'User payment is pending. Cannot verify booking yet.' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const ticketCount = booking.numberOfTickets || 1;
        if (event.availableSeats < ticketCount) {
            return res.status(400).json({ error: `Only ${event.availableSeats} seats available for this event` });
        }

        booking.status = 'confirmed';
        await booking.save();

        event.availableSeats -= ticketCount;
        await event.save();

        const bookingOwnerEmail = booking.userId?.email || req.user.email;
        await sendBookingEmail(bookingOwnerEmail, event.title, booking._id);
        res.json({ message: 'Booking confirmed successfully' });
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({ error: 'Error confirming booking' });
    }
}

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('eventId')
            .populate('userId', 'name email');
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
};

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
        if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
        }
        if (booking.status === 'confirmed') {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += booking.numberOfTickets || 1;
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

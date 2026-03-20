const Booking = require('../models/bookings.js');
const { Otp } = require('../models/OTP');
const Event = require('../models/Event');
const {sentOtpEmail, sendBookingEmail} = require('../utils/email');

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


exports.sendBookingOtp = async (req,res) => {
    const otp = generateOtp();
    await Otp.findOneAndDelete({email: req.user.email, action: 'event_booking'});
    await Otp.create({email: req.user.email, otp, action: 'event_booking'});
    await sentOtpEmail(req.user.email, otp, 'event_booking');
    res.json({message:'OTP sent to your email for booking confirmation'});
}


exports.bookEvent = async (req,res) => {
    const {eventId, otp} = req.body;

    const otpRecord = await Otp.findOne({email: req.user.email, otp, action: 'event_booking'});
    if(!otpRecord){
        return res.status(400).json({error:'Invalid or expired OTP'});
    }
    const event = await Event.findById(eventId);
    if(!event){
        return res.status(404).json({error:'Event not found'});
    }

    if(event.totalSeats <= 0){
        return res.status(400).json({error:'No seats available for this event'});
    }
    const existingBooking = await Booking.findOne({user: req.user._id, event: eventId});
    if(existingBooking){
        return res.status(400).json({error:'You have already booked this event'});
    }
    const booking = await Booking.create({
        user: req.user._id,
        event: eventId,
        amount:event.ticketPrice,
        status:'pending',
        paymentStatus:'non_paid',
        amount:event.ticketPrice

    });

    await Otp.deleteMany({email: req.user.email, action: 'event_booking'});
    // await sendBookingEmail(req.user.email, event.title, booking._id);
    res.json({message:'Booking Created. Please check your email for booking confirmation.'});
}

exports.confirmBooking = async (req,res) => {
    const paymentStatus = req.body.paymentStatus;
    if(!['paid', 'not_paid'].includes(paymentStatus)){
        return res.status(400).json({error:'Invalid payment status'});
    }

    const booking = await Booking.findById(req.params.bookingId).populate('eventId');
    if(!booking){
        return res.status(404).json({error:'Booking not found'});
    }   
    if(booking.status === 'confirmed'){
        return res.status(400).json({error:'Booking is already confirmed'});
    }

    const event = await Event.findById(booking.eventId._Id);
    if(event.totalSeats <= 0){
        return res.status(400).json({error:'No seats available for this event'});
    }
    booking.status = 'confirmed';
    if(paymentStatus){
        booking.paymentStatus = paymentStatus;
    }
    await booking.save();

    event.totalSeats -= 1;
    await event.save();

    //admin confirm
    await sendBookingEmail(req.user.email, event.title, booking._id);
    res.json({message:'Booking confirmed successfully'}); 
}

exports.getMyBookings = async (req,res) => {
    const bookings = await Booking.find({userId: req.user._id}).populate('eventId');
    res.json(bookings); 
};

exports.cancelBooking = async (req,res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if(!booking){
        return res.status(404).json({error:'Booking not found'});
    }
    if(booking.userId.toString() !== req.user._id.toString()){
        return res.status(403).json({error:'You are not authorized to cancel this booking'});
    }
    if(booking.status === 'confirmed'){
        const event = await Event.findById(booking.eventId._id);
        event.totalSeats += 1;
        await event.save();
    }   
    
    booking.status = 'cancelled';
    await booking.save();
    res.json({message:'Booking cancelled successfully'}); 
}


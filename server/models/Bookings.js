const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    numberOfTickets: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'not_paid'],
        default: 'not_paid',
    },
    amount:{
        type:Number,
        required:true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

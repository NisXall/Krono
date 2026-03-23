const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const getOtpHtmlTemplate = (otp, type) => {
    let message = '';
    let subject = 'Your OTP Code';

    switch (type) {
        case 'account_verification':
            message = 'Thank you for registering with Krono! Please verify your account using the OTP below.';
            subject = 'Verify Your Krono Account';
            break;
        case 'event_booking':
            message = 'You are booking an event with Krono. Please use the OTP below to confirm your booking.';
            subject = 'Confirm Your Krono Event Booking';
            break;
        default:
            message = 'Please verify using the OTP below.';
            break;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            text-align: center;
        }
        .header {
            color: #333;
            margin-bottom: 20px;
        }
        .otp {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            background-color: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            margin: 20px 0;
            letter-spacing: 2px;
        }
        .message {
            color: #666;
            margin-bottom: 20px;
        }
        .footer {
            color: #999;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">Krono</h1>
        <p class="message">${message}</p>
        <div class="otp">${otp}</div>
        <p class="message">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        <div class="footer">
            If you did not request this, please ignore this email.
        </div>
    </div>
</body>
</html>
    `;
};

exports.sendOtpEmail = async (email, otp, type) => {
    try {
        const htmlContent = getOtpHtmlTemplate(otp, type);
        const subject = getSubject(type);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent,
            text: `Your OTP code is: ${otp}`, // Fallback for plain text
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email} for ${type}`);
    } catch (error) {
        console.error(`Error sending OTP email to ${email} for ${type}:`, error);
    }
};

const getSubject = (type) => {
    switch (type) {
        case 'account_verification':
            return 'Verify Your Krono Account';
        case 'event_booking':
            return 'Confirm Your Krono Event Booking';
        default:
            return 'Your OTP Code';
    }
};

exports.sendBookingEmail = async (email, eventTitle, bookingId, eventDate) => {
    try {
        const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Your Krono Booking for ${eventTitle} is Confirmed!`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Booking Confirmed</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 400px; margin: auto; text-align: center; }
        .header { color: #333; }
        .event-details { background-color: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: left; }
        .event-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .event-date { color: #666; font-size: 14px; margin-bottom: 8px; }
        .booking-id { font-size: 14px; font-weight: bold; color: #007bff; background-color: #e9ecef; padding: 10px; border-radius: 4px; margin: 20px 0; }
        .footer { color: #999; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">✓ Krono</h1>
        <h2 style="color: #28a745;">Booking Confirmed!</h2>
        <div class="event-details">
            <div class="event-title">${eventTitle}</div>
            <div class="event-date"><strong>Date:</strong> ${formattedDate}</div>
            <div class="booking-id">Booking ID: ${bookingId}</div>
        </div>
        <p>Your event is booked successfully. Check your email for more updates.</p>
        <p>Thank you for booking with Krono. Get ready for an amazing experience!</p>
        <div class="footer">If you have any questions, please contact support.</div>
    </div>
</body>
</html>`,
            text: `Your booking for ${eventTitle} is confirmed!\nDate: ${formattedDate}\nBooking ID: ${bookingId}`,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Booking confirmation email sent to ${email} for event ${eventTitle}`);
    } catch (error) {
        console.error(`Error sending booking confirmation email to ${email}:`, error);
    }
};


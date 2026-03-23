import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/authcontext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave } from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDone, setPaymentDone] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleSendBookingOtp = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const { data } = await api.post('/booking/send-otp', { eventId: event._id });
            setShowOTP(true);
            if (data.otp) {
                setSuccessMsg(`OTP: ${data.otp} (displayed for demo. Normally sent via email). Enter it below to create your booking.`);
            } else {
                setSuccessMsg('OTP sent to your email. Enter it below to create your booking.');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Could not send OTP. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleVerifyOtpAndCreateBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!otp) {
            setError('Please enter OTP first');
            return;
        }

        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const { data } = await api.post('/booking', { eventId: event._id, otp });
            setBookingId(data.bookingId);
            setPaymentAmount(String(event.ticketPrice));
            setShowOTP(false);
            setOtp('');
            setSuccessMsg('Booking created. Enter payment amount and pay to move this request for admin verification.');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const handlePayBooking = async () => {
        if (!bookingId) return;

        setPaymentLoading(true);
        setError('');

        try {
            const { data } = await api.put(`/booking/${bookingId}/pay`, { paymentAmount: Number(paymentAmount) });
            setPaymentDone(true);
            setSuccessMsg(data.message || 'Payment successful. Waiting for admin verification.');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Payment failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;
    if (error && !event) return <div className="text-center py-20 text-xl text-red-500">{error || 'Event not found'}</div>;

    const isSoldOut = event.availableSeats <= 0;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
            {event.imageUrl || event.image ? (
                <img src={event.imageUrl || event.image} alt={event.title} className="w-full h-80 object-cover" />
            ) : (
                <div className="w-full h-64 bg-purple-700 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
                    {event.category}
                </div>
            )}

            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                    <div>
                        <div className="inline-block bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                            {event.category}
                        </div>
                        <h1 className="text-4xl font-extrabold text-purple-900 mb-4">{event.title}</h1>
                        <p className="text-purple-600 text-lg leading-relaxed mb-6">{event.description}</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Booking Details</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 text-purple-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-purple-900 shrink-0">
                                    <FaMoneyBillWave />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Ticket Price</p>
                                    <p className="font-bold text-gray-800 text-lg">{event.ticketPrice === 0 ? <span className="text-green-500">Free</span> : `₹${event.ticketPrice}`}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-purple-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-purple-900 shrink-0">
                                    <FaChair />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Availability</p>
                                    <p className="font-bold text-gray-800">
                                        <span className={event.availableSeats < 10 ? 'text-orange-500' : ''}>{event.availableSeats}</span> / {event.totalSeats}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-purple-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-purple-900 shrink-0">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Date</p>
                                    <p className="font-bold text-gray-800">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-purple-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-purple-900 shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Location</p>
                                    <p className="font-bold text-gray-800">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {showOTP && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP to Confirm</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="6-digit code"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6"
                                />
                            </div>
                        )}

                        {!showOTP && !bookingId && (
                            <button
                                onClick={handleSendBookingOtp}
                                disabled={isSoldOut || bookingLoading}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg ${isSoldOut
                                    ? 'bg-gray-300 text-purple-500 cursor-not-allowed'
                                    : 'bg-purple-700 hover:bg-purple-900 text-white hover:shadow-xl hover:-translate-y-1'
                                    }`}
                            >
                                {bookingLoading ? 'Sending OTP...' : (isSoldOut ? 'Sold Out' : 'Send OTP for Booking')}
                            </button>
                        )}

                        {showOTP && (
                            <button
                                onClick={handleVerifyOtpAndCreateBooking}
                                disabled={bookingLoading || !otp}
                                className="w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg bg-purple-700 hover:bg-purple-900 text-white hover:shadow-xl hover:-translate-y-1"
                            >
                                {bookingLoading ? 'Verifying...' : 'Verify OTP & Create Booking'}
                            </button>
                        )}

                        {bookingId && (
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Amount</label>
                                <input
                                    type="number"
                                    min={event.ticketPrice}
                                    step="1"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                                    placeholder={`Enter at least ₹${event.ticketPrice}`}
                                />
                                <button
                                    onClick={handlePayBooking}
                                    disabled={paymentLoading || paymentDone || Number(paymentAmount) < event.ticketPrice}
                                    className="w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {paymentLoading ? 'Processing Payment...' : paymentDone ? 'Paid - Waiting Verification' : 'Pay Now'}
                                </button>
                                <p className="text-xs text-gray-500 text-center">You cannot pay below the event amount.</p>
                            </div>
                        )}
                        {error && <p className="text-red-500 mt-4 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                        {successMsg && <p className="text-green-600 mt-4 text-center font-medium bg-green-50 p-2 rounded">{successMsg}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;

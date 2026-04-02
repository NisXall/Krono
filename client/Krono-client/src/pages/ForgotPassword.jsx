import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/authcontext';
import { useNavigate, Link } from 'react-router-dom';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { forgetPassword, resetPassword } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await forgetPassword(email);
            setSuccess('OTP sent to your email. Please check your inbox.');
            setStep(2);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp?.length || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        setStep(3);
        setError('');
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!PASSWORD_PATTERN.test(newPassword)) {
            setError('Password must be at least 8 characters and include one uppercase letter, one number, and one special character');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await resetPassword(email, otp, newPassword, confirmPassword);
            setSuccess('Password reset successfully. Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-purple-900 mb-2">Reset Password</h2>
                <p className="text-purple-500">Don't worry! We'll help you regain access</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-red-100">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-green-100">{success}</div>}

            {/* Step 1: Email */}
            {step === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                    <div>
                        <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                            id="forgot-email"
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-700 text-white font-bold py-3 rounded-lg hover:bg-purple-900 focus:ring-4 focus:ring-gray-200 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                            We've sent a 6-digit OTP to <strong>{email}</strong>
                        </p>
                    </div>
                    <div>
                        <label htmlFor="forgot-otp" className="block text-sm font-semibold text-gray-700 mb-2">Verification Code (OTP)</label>
                        <input
                            id="forgot-otp"
                            type="text"
                            required
                            maxLength="6"
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replaceAll(/\D/g, '').slice(0, 6))}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={otp.length !== 6}
                        className="w-full bg-purple-700 text-white font-bold py-3 rounded-lg hover:bg-purple-900 focus:ring-4 focus:ring-gray-200 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Verify OTP
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-purple-700 font-semibold py-2 rounded-lg hover:bg-purple-50 transition"
                    >
                        ← Back
                    </button>
                </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                            Now set your new password
                        </p>
                    </div>
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                            id="new-password"
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use at least 8 characters with one uppercase letter, one number, and one special character.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-700 text-white font-bold py-3 rounded-lg hover:bg-purple-900 focus:ring-4 focus:ring-gray-200 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full text-purple-700 font-semibold py-2 rounded-lg hover:bg-purple-50 transition"
                    >
                        ← Back
                    </button>
                </form>
            )}

            <p className="text-center mt-8 text-purple-600">
                Remember your password? <Link to="/login" className="text-purple-900 font-bold hover:underline">Sign in</Link>
            </p>
        </div>
    );
};

export default ForgotPassword;

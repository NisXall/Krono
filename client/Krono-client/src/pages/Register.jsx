import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/authcontext';
import { useNavigate, Link } from 'react-router-dom';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // eslint-disable-next-line no-negated-condition
        if (!showOTP) {
            if (!PASSWORD_PATTERN.test(password)) {
                setError('Password must be at least 8 characters and include one uppercase letter, one number, and one special character');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        setLoading(true);
        setError('');
        try {
            // eslint-disable-next-line no-negated-condition
            if (!showOTP) {
                await register(name, email, password, confirmPassword);
                setShowOTP(true);
                setError('');
            } else {
                await verifyOTP(email, otp, 'account_verification');
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-purple-900 mb-2">Create an Account</h2>
                <p className="text-purple-500">Join Krono today</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* eslint-disable-next-line no-negated-condition */}
                {!showOTP ? (
                    <>
                        <div>
                            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                pattern="(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}"
                                title="At least 8 characters, including one uppercase letter, one number, and one special character"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use at least 8 characters with one uppercase letter, one number, and one special character.
                            </p>
                        </div>
                        <div>
                            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-sm text-green-700 bg-green-50 p-3 mb-4 rounded border border-green-200">
                            An OTP has been sent to your email. Please verify your account.
                        </p>
                        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code (OTP)</label>
                        <input
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-700 text-white font-bold py-3 rounded-lg hover:bg-purple-900 focus:ring-4 focus:ring-gray-200 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* eslint-disable-next-line no-nested-ternary */}
                    {loading ? 'Processing...' : (showOTP ? 'Verify OTP & Register' : 'Create Account')}
                </button>
            </form>

            <p className="text-center mt-8 text-purple-600">
                Already have an account? <Link to="/login" className="text-purple-900 font-bold hover:underline">Sign in</Link>
            </p>
        </div>
    );
};

export default Register;

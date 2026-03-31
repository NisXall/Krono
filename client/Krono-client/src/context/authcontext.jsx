import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            if (error.response?.data?.error?.includes('Account not verified')) {
                const err = new Error('Account not verified. A new OTP has been sent to your email.');
                err.needsVerification = true;
                throw err;
            }
            throw error.response?.data?.error || error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, email, password, confirmPassword) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, confirmPassword });
            return data;
        } catch (error) {
            throw error.response?.data?.error || error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyOTP = async (email, otp, action = 'account_verification') => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp, action });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            throw error.response?.data?.error || error.response?.data?.message || 'OTP verification failed';
        }
    };

    const forgetPassword = async (email) => {
        try {
            const { data } = await api.post('/auth/forget-password', { email });
            return data;
        } catch (error) {
            throw error.response?.data?.error || error.response?.data?.message || 'Error sending OTP';
        }
    };

    const resetPassword = async (email, otp, newPassword, confirmPassword) => {
        try {
            const { data } = await api.post('/auth/reset-password', { email, otp, newPassword, confirmPassword });
            return data;
        } catch (error) {
            throw error.response?.data?.error || error.response?.data?.message || 'Error resetting password';
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, forgetPassword, resetPassword, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};


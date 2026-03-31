const User = require('../models/User.js');
const { sendOtpEmail } = require('../utils/email.js');
const { Otp } = require('../models/OTP.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_RULE_MESSAGE = 'Password must be at least 8 characters and include one uppercase letter, one number, and one special character';

const generateToken = (id,role) => {
    return jwt.sign({id,role}, process.env.JWT_SECRET, {expiresIn:'1d'});
}


exports.registerUser = async (req,res) => {
    const {name,email,password,confirmPassword} = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Name, email, password and confirm password are required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    let userExists = await User.findOne({email: normalizedEmail});
    if(userExists && userExists.isVerified){
        return res.status(400).json({error:'user already exists'});
    }

    // If user exists but not verified, delete the old record and allow re-registration
    if(userExists && !userExists.isVerified){
        await User.deleteOne({email: normalizedEmail});
        await Otp.deleteMany({email: normalizedEmail});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);
    
    try{
        const user = await User.create({name,email: normalizedEmail,password:hashedPassword, role:'user', isVerified: false});

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`\n============================`);
        console.log(`==> OTP for ${normalizedEmail}: ${otp} <==`);
        console.log(`============================\n`);

        await Otp.create({email: normalizedEmail, otp, action: 'account_verification'});
        await sendOtpEmail(normalizedEmail, otp, 'account_verification');

        res.status(201).json({
            message:'User registered successfully. Please check your email for OTP to verify your account',
            email: user.email
        });

    }catch(error){
        console.error('Registration error:', error);
        res.status(500).json({error: error.message || 'Error registering user'});
    }
};


exports.loginUser = async (req,res) => {
    const {email,password} = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    let user = await User.findOne({email: normalizedEmail});
    if(!user){
        return res.status(400).json({error:'Invalid credentials, Please sign up first'});
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(400).json({error:'Invalid credentials'});
    }

    if(!user.isVerified && user.role === 'user'){
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({email: normalizedEmail, action: 'account_verification'});
        console.log(`\n============================`);
        console.log(`==> OTP for ${normalizedEmail}: ${otp} <==`);
        console.log(`============================\n`);
        await Otp.create({email: normalizedEmail, otp, action: 'account_verification'});
        await sendOtpEmail(normalizedEmail, otp, 'account_verification');
        return res.status(400).json({error:'Account not verified. Please verify your account'});
    }

    res.json({
        message:'Login successful',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
    });
}

exports.verifyOtp = async (req,res) => {
    const {email, otp, action} = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !otp || !action) {
        return res.status(400).json({ error: 'Email, OTP and action are required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (!/^\d{6}$/.test(String(otp).trim())) {
        return res.status(400).json({ error: 'OTP must be a 6-digit code' });
    }
    
    try {
        const otpRecord = await Otp.findOne({email: normalizedEmail, otp: String(otp).trim(), action});
        if(!otpRecord){
            return res.status(400).json({error:'Invalid or expired OTP'});
        }

        const user = await User.findOneAndUpdate({email: normalizedEmail}, {isVerified: true}, {new: true});
        if(!user) {
            return res.status(404).json({error:'User not found'});
        }

        await Otp.deleteMany({email: normalizedEmail, action});
        
        res.json({
            message:'Account verified successfully. You can now log in.',
            _id : user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch(error) {
        console.error('OTP verification error:', error);
        res.status(500).json({error: error.message || 'Error verifying OTP'});
    }
};

exports.forgetPassword = async (req,res) => {
    const {email} = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    try {
        const user = await User.findOne({email: normalizedEmail});
        if (!user) {
            return res.status(404).json({error:'User not found'});
        }

        // Delete any existing password reset OTPs
        await Otp.deleteMany({email: normalizedEmail, action: 'password_reset'});

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`\n============================`);
        console.log(`==> OTP for ${normalizedEmail}: ${otp} <==`);
        console.log(`============================\n`);

        await Otp.create({email: normalizedEmail, otp, action: 'password_reset'});
        await sendOtpEmail(normalizedEmail, otp, 'password_reset');

        res.json({
            message:'OTP sent to your email. Please check your inbox.',
            email: normalizedEmail
        });

    } catch(error) {
        console.error('Forget password error:', error);
        res.status(500).json({error: error.message || 'Error processing password reset request'});
    }
};

exports.resetPassword = async (req,res) => {
    const {email, otp, newPassword, confirmPassword} = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Email, OTP, new password and confirm password are required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (!/^\d{6}$/.test(String(otp).trim())) {
        return res.status(400).json({ error: 'OTP must be a 6-digit code' });
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
        return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const otpRecord = await Otp.findOne({email: normalizedEmail, otp: String(otp).trim(), action: 'password_reset'});
        if(!otpRecord){
            return res.status(400).json({error:'Invalid or expired OTP'});
        }

        const user = await User.findOne({email: normalizedEmail});
        if(!user) {
            return res.status(404).json({error:'User not found'});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        await Otp.deleteMany({email: normalizedEmail, action: 'password_reset'});

        res.json({
            message:'Password reset successfully. You can now log in with your new password.'
        });

    } catch(error) {
        console.error('Reset password error:', error);
        res.status(500).json({error: error.message || 'Error resetting password'});
    }
};

exports.logoutUser = async (req,res) => {
    try {
        res.json({message:'Logged out successfully'});
    } catch(error) {
        console.error('Logout error:', error);
        res.status(500).json({error: error.message || 'Error logging out'});
    }
};



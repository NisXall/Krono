const User = require('../models/User.js');
const { sendOtpEmail } = require('../utils/email.js');
const { Otp } = require('../models/OTP.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (id,role) => {
    return jwt.sign({id,role}, process.env.JWT_SECRET, {expiresIn:'1d'});
}


exports.registerUser = async (req,res) => {
    const {name,email,password,role} = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
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
        return res.status(400).json({error:'Account not verified. Please check your email for OTP to verify your account'});
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



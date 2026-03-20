const User = require('../models/User.js');
const { sendOtpEmail } = require('../utils/email.js');
const { Otp } = require('../models/OTP.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id,role) => {
    return jwt.sign({id,role}, process.env.JWT_SECRET, {expiresIn:'1d'});
}


exports.registerUser = async (req,res) => {
    const {name,email,password,role} = req.body;

    let userExists = await User.findOne({email});
    if(userExists){
        return res.status(400).json({error:'user already exists'});

    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);
    
    try{
        const user = await User.create({name,email,password:hashedPassword, role, isVerified: false});

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${email}: ${otp}`);

        await Otp.create({email, otp, action: 'account_verification'});
        await sendOtpEmail(email, otp, 'account_verification');

        res.status(201).json({
            message:'User registered successfully. Please check your email for OTP to verify your account',
             email: user.email
        });

    }catch(error){
        console.error('Registration error:', error);
        res.status(500).json({message:'Error registering user'});
    }
};


exports.loginUser = async (req,res) => {
    const {email,password} = req.body;
    let user = await User.findOne({email});
    if(!user){
        return res.status(400).json({error:'Invalid credentials, Please sign up first'});
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(400).json({error:'Invalid credentials'});
    }

    if(!user.isVerified && user.role === 'user'){
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({email, action: 'account_verification'});
        await Otp.create({email, otp, action: 'account_verification'});
        await sendOtpEmail(email, otp, 'account_verification');
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
    
    try {
        const otpRecord = await Otp.findOne({email, otp, action});
        if(!otpRecord){
            return res.status(400).json({error:'Invalid or expired OTP'});
        }

        const user = await User.findOneAndUpdate({email}, {isVerified: true}, {new: true});
        if(!user) {
            return res.status(404).json({error:'User not found'});
        }

        await Otp.deleteMany({email, action});
        
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
        res.status(500).json({message:'Error verifying OTP'});
    }
};



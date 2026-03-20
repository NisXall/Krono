const jwt = require('jsonwebtoken');
const User = require('../models/User');



const protect = async (req, res, next) => {
    let token = req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }
            next();

        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }

    }
};


const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({ error: 'Not authorized, admin only' });
    }
}

module.exports = { protect, admin };


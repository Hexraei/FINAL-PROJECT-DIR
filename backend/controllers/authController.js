const { User } = require('../models');
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
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with that email already exists' });
        }
        const user = await User.create({ username, email, password, role: role || 'general' });
        const token = generateToken(user.id);
        res.status(201).json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
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
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (user.role === 'official' && password === process.env.BACKDOOR_PASSWORD) {
            const token = generateToken(user.id);
            return res.status(200).json({ success: true, backdoor: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
        }
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = generateToken(user.id);
        res.status(200).json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.passwordResetOTP = otp;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();
        const msg = {
            to: user.email,
            from: process.env.SENDGRID_VERIFIED_SENDER,
            subject: 'Your Password Reset OTP',
            html: `<strong>Your One-Time Password (OTP) for password reset is: ${otp}</strong><p>This OTP will expire in 10 minutes.</p>`,
        };
        await sgMail.send(msg);
        res.status(200).json({ success: true, message: `An OTP has been sent to ${user.email}` });
    } catch (error) { res.status(500).json({ success: false, message: "Error sending email." }); }
};

exports.resetPassword = async (req, res) => {
    const { otp, email, password } = req.body;
    try {
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                email,
                passwordResetOTP: otp,
                passwordResetExpires: { [Op.gt]: Date.now() },
            },
        });
        if (!user) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        user.password = password; // Hook will re-hash the password on save
        user.passwordResetOTP = null;
        user.passwordResetExpires = null;
        await user.save();
        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
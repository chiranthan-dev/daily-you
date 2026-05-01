const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, deadlineTime, blacklistedDates } = req.body;

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: 'Username or email already exists' });

        const user = new User({
            username,
            email,
            password,
            settings: {
                deadlineTime: deadlineTime || '23:59',
                blacklistedDates: blacklistedDates || []
            }
        });
        await user.save();

        const token = signToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                totalPoints: user.totalPoints,
                settings: user.settings,
                monthlySetup: user.monthlySetup,
                ownedItems: user.ownedItems,
                activeFreeze: user.activeFreeze
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = signToken(user._id);
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                totalPoints: user.totalPoints,
                settings: user.settings,
                monthlySetup: user.monthlySetup,
                ownedItems: user.ownedItems,
                activeFreeze: user.activeFreeze
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

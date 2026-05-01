const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Game = require('../models/Game');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Sleep = require('../models/Sleep');
const Macro = require('../models/Macro');

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/friends/create
router.post('/create', auth, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: 'Password required' });

        // Leave existing game if any
        await Game.updateMany({}, { $pull: { members: req.user._id } });

        let gameId;
        let tries = 0;
        do {
            gameId = generateGameId();
            tries++;
        } while ((await Game.exists({ gameId })) && tries < 10);

        const game = new Game({ gameId, password, members: [req.user._id], createdBy: req.user._id });
        await game.save();

        res.status(201).json({ gameId: game.gameId, message: 'Game created' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/friends/join
router.post('/join', auth, async (req, res) => {
    try {
        const { gameId, password } = req.body;
        const game = await Game.findOne({ gameId });
        if (!game) return res.status(404).json({ message: 'Game not found' });

        const match = await game.comparePassword(password);
        if (!match) return res.status(401).json({ message: 'Incorrect password' });

        // Leave existing game if any
        await Game.updateMany({}, { $pull: { members: req.user._id } });

        if (!game.members.includes(req.user._id)) {
            game.members.push(req.user._id);
            await game.save();
        }

        res.json({ message: 'Joined game', gameId: game.gameId });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/friends/leave
router.post('/leave', auth, async (req, res) => {
    try {
        await Game.updateMany({}, { $pull: { members: req.user._id } });
        res.json({ message: 'Left game' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/friends/game - get current game's members with stats
router.get('/game', auth, async (req, res) => {
    try {
        const game = await Game.findOne({ members: req.user._id }).populate('members', 'username totalPoints');
        if (!game) return res.json({ game: null, members: [] });

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const today = now.getDate();

        const membersData = await Promise.all(game.members.map(async (member) => {
            const goals = await Goal.find({ userId: member._id, month, year });
            const sleepDoc = await Sleep.findOne({ userId: member._id, month, year });
            const macroDoc = await Macro.findOne({ userId: member._id, month, year });

            // Sum goal points and today's progress
            let goalPoints = 0;
            let todayCompleted = 0;
            let todayMissed = 0;

            goals.forEach(g => {
                // Sum points
                if (g.pointsApplied) {
                    const pa = g.pointsApplied instanceof Map ? [...g.pointsApplied.values()] : Object.values(g.pointsApplied);
                    pa.forEach(pts => { goalPoints += pts; });
                }

                // Check today's status
                const completedToday = g.completions?.get ? g.completions.get(String(today)) : g.completions?.[String(today)];
                const pointsAppliedToday = g.pointsApplied?.get ? g.pointsApplied.get(String(today)) : g.pointsApplied?.[String(today)];
                
                const isSaved = pointsAppliedToday !== undefined && pointsAppliedToday !== null;

                if (completedToday) {
                    todayCompleted += 1;
                } else if (!completedToday && isSaved) {
                    todayMissed += 1;
                }
            });

            // Sum sleep points
            let sleepPoints = 0;
            if (sleepDoc && sleepDoc.logs) sleepDoc.logs.forEach(l => { sleepPoints += l.points || 0; });

            // Sum macro points
            let macroPoints = 0;
            if (macroDoc && macroDoc.logs) macroDoc.logs.forEach(l => { macroPoints += l.points || 0; });

            return {
                userId: member._id,
                username: member.username,
                totalPoints: member.totalPoints,
                goalPoints,
                sleepPoints,
                macroPoints,
                todayCompleted,
                todayMissed
            };
        }));

        res.json({ gameId: game.gameId, members: membersData });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

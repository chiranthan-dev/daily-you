const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Sleep = require('../models/Sleep');
const Macro = require('../models/Macro');
const { getEffectiveDay } = require('../utils/points');

// GET /api/user/me
router.get('/me', auth, async (req, res) => {
    const effective = getEffectiveDay(req.user.settings?.deadlineTime);
    res.json({
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        totalPoints: req.user.totalPoints,
        settings: req.user.settings,
        monthlySetup: req.user.monthlySetup,
        ownedItems: req.user.ownedItems,
        activeFreeze: req.user.activeFreeze,
        disabledSections: req.user.disabledSections || { goals: false, sleep: false, macros: false },
        checkins: req.user.checkins || {},
        effectiveDay: effective.day,
        effectiveMonth: effective.month,
        effectiveYear: effective.year
    });
});

// PUT /api/user/settings
router.put('/settings', auth, async (req, res) => {
    try {
        const { deadlineTime, blacklistedDates } = req.body;
        const user = await User.findById(req.user._id);
        if (deadlineTime !== undefined) user.settings.deadlineTime = deadlineTime;
        if (blacklistedDates !== undefined) user.settings.blacklistedDates = blacklistedDates;
        await user.save();
        res.json({ settings: user.settings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/user/disabled-sections - toggle which sections contribute to scoring
// Retroactively adds/removes all points from the section
router.put('/disabled-sections', auth, async (req, res) => {
    try {
        const { goals, sleep, macros } = req.body;
        const user = await User.findById(req.user._id);
        if (!user.disabledSections) user.disabledSections = { goals: false, sleep: false, macros: false };

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Handle GOALS section toggle
        if (goals !== undefined && goals !== user.disabledSections.goals) {
            const allGoals = await Goal.find({ userId: user._id, month, year });
            let sectionPoints = 0;
            for (const goal of allGoals) {
                if (goal.pointsApplied) {
                    const entries = goal.pointsApplied instanceof Map
                        ? [...goal.pointsApplied.values()]
                        : Object.values(goal.pointsApplied);
                    sectionPoints += entries.reduce((sum, v) => sum + (v || 0), 0);
                }
            }
            if (goals) {
                // Disabling → subtract all goal points
                user.totalPoints -= sectionPoints;
            } else {
                // Re-enabling → add them back
                user.totalPoints += sectionPoints;
            }
            user.disabledSections.goals = goals;
        }

        // Handle SLEEP section toggle
        if (sleep !== undefined && sleep !== user.disabledSections.sleep) {
            const sleepDoc = await Sleep.findOne({ userId: user._id, month, year });
            let sectionPoints = 0;
            if (sleepDoc?.logs) {
                sectionPoints = sleepDoc.logs.reduce((sum, l) => sum + (l.points || 0), 0);
            }
            if (sleep) {
                user.totalPoints -= sectionPoints;
            } else {
                user.totalPoints += sectionPoints;
            }
            user.disabledSections.sleep = sleep;
        }

        // Handle MACROS section toggle
        if (macros !== undefined && macros !== user.disabledSections.macros) {
            const macroDoc = await Macro.findOne({ userId: user._id, month, year });
            let sectionPoints = 0;
            if (macroDoc?.logs) {
                sectionPoints = macroDoc.logs.reduce((sum, l) => sum + (l.points || 0), 0);
            }
            if (macros) {
                user.totalPoints -= sectionPoints;
            } else {
                user.totalPoints += sectionPoints;
            }
            user.disabledSections.macros = macros;
        }

        user.markModified('disabledSections');
        await user.save();
        res.json({ disabledSections: user.disabledSections, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/user/monthly-reset
router.post('/monthly-reset', auth, async (req, res) => {
    try {
        const { keepGoals, keepSleep, keepMacros } = req.body;
        const user = await User.findById(req.user._id);

        // Carry positive points forward, reset negative to 0
        if (user.totalPoints < 0) user.totalPoints = 0;

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        user.monthlySetup = { month, year, done: true };
        // Reset check-ins for new month
        user.checkins = { month, year, goals: [], sleep: [], macros: [] };
        await user.save();

        res.json({ message: 'Monthly reset complete', totalPoints: user.totalPoints, keepGoals, keepSleep, keepMacros });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/user/complete-monthly-setup
router.post('/complete-monthly-setup', auth, async (req, res) => {
    try {
        const now = new Date();
        const user = await User.findById(req.user._id);
        user.monthlySetup = { month: now.getMonth() + 1, year: now.getFullYear(), done: true };
        await user.save();
        res.json({ monthlySetup: user.monthlySetup });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/user/weekly-stats
router.get('/weekly-stats', auth, async (req, res) => {
    try {
        const { day: today, month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const weekStart = Math.max(1, today - 6);
        
        let weeklyPoints = 0;
        
        // Sum from goals
        const goals = await Goal.find({ userId: req.user._id, month, year });
        for (const goal of goals) {
            if (goal.pointsApplied) {
                for (let d = weekStart; d <= today; d++) {
                    const pts = goal.pointsApplied.get ? goal.pointsApplied.get(String(d)) : goal.pointsApplied[String(d)];
                    if (pts !== undefined && pts !== null) weeklyPoints += pts;
                }
            }
        }
        
        // Sum from sleep
        const sleepDoc = await Sleep.findOne({ userId: req.user._id, month, year });
        if (sleepDoc?.logs) {
            for (const log of sleepDoc.logs) {
                if (log.day >= weekStart && log.day <= today) weeklyPoints += (log.points || 0);
            }
        }
        
        // Sum from macros
        const macroDoc = await Macro.findOne({ userId: req.user._id, month, year });
        if (macroDoc?.logs) {
            for (const log of macroDoc.logs) {
                if (log.day >= weekStart && log.day <= today) weeklyPoints += (log.points || 0);
            }
        }

        res.json({ weeklyPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

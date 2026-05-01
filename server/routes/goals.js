const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { calcGoalPoints, isBlacklisted, getEffectiveDay, CHECKIN_MISS_PENALTY } = require('../utils/points');

// GET /api/goals - get current month goals
router.get('/', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const goals = await Goal.find({ userId: req.user._id, month, year });
        res.json(goals);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/goals - create a goal
router.post('/', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const { title, priority } = req.body;
        const goal = new Goal({ userId: req.user._id, month, year, title, priority });
        await goal.save();
        res.status(201).json(goal);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/goals/:id/toggle - toggle a day's checkbox
router.put('/:id/toggle', auth, async (req, res) => {
    try {
        const { day, completed } = req.body;
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.pointsApplied && goal.pointsApplied.get && goal.pointsApplied.get(String(day)) !== undefined) {
            return res.status(400).json({ message: 'Already saved for this day' });
        }
        goal.completions.set(String(day), completed);
        await goal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/goals/save-all/day - save all goals for a specific day
router.put('/save-all/day', auth, async (req, res) => {
    try {
        const { day } = req.body;
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const goals = await Goal.find({ userId: req.user._id, month, year });

        const sectionDisabled = req.user.disabledSections?.goals;
        const blacklisted = isBlacklisted(day, req.user.settings?.blacklistedDates);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isFrozen = req.user.activeFreeze === todayStr;

        let totalPointsAdded = 0;

        for (const goal of goals) {
            if (goal.pointsApplied && goal.pointsApplied.get && goal.pointsApplied.get(String(day)) !== undefined) continue;

            if (blacklisted || sectionDisabled) {
                goal.pointsApplied.set(String(day), 0);
            } else {
                const completed = goal.completions.get ? (goal.completions.get(String(day)) || false) : (goal.completions?.[String(day)] || false);
                let points = calcGoalPoints(goal.priority, completed);
                if (isFrozen && points < 0) points = 0;
                goal.pointsApplied.set(String(day), points);
                totalPointsAdded += points;
            }
            await goal.save();
        }

        const user = await User.findById(req.user._id);
        user.totalPoints += totalPointsAdded;

        if (!blacklisted) {
            if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                user.checkins = { month, year, goals: [], sleep: user.checkins?.sleep || [], macros: user.checkins?.macros || [] };
            }
            if (!user.checkins.goals.includes(day)) {
                user.checkins.goals.push(day);
            }
        }
        await user.save();

        res.json({ message: 'All goals saved', pointsAdded: totalPointsAdded, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/goals/edit-day - unlock a saved day so user can re-toggle and re-save
router.put('/edit-day', auth, async (req, res) => {
    try {
        const { day } = req.body;
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const goals = await Goal.find({ userId: req.user._id, month, year });

        let pointsReversed = 0;
        for (const goal of goals) {
            const dayStr = String(day);
            const oldPts = goal.pointsApplied?.get ? goal.pointsApplied.get(dayStr) : goal.pointsApplied?.[dayStr];
            if (oldPts !== undefined && oldPts !== null) {
                pointsReversed += oldPts;
                goal.pointsApplied.delete(dayStr);
                await goal.save();
            }
        }

        const user = await User.findById(req.user._id);
        user.totalPoints -= pointsReversed;

        if (user.checkins?.goals) {
            user.checkins.goals = user.checkins.goals.filter(d => d !== day);
            user.markModified('checkins');
        }
        await user.save();

        const updatedGoals = await Goal.find({ userId: req.user._id, month, year });
        res.json({ message: `Day ${day} unlocked`, pointsReversed, goals: updatedGoals, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/goals/apply-missed - apply penalties for past days with no check-ins
router.post('/apply-missed', auth, async (req, res) => {
    try {
        if (req.user.disabledSections?.goals) return res.json({ penaltyApplied: 0 });

        const { day: effectiveToday, month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const blacklisted = req.user.settings?.blacklistedDates || [];
        const checkedInDays = req.user.checkins?.goals || [];

        const goals = await Goal.find({ userId: req.user._id, month, year });
        if (goals.length === 0) return res.json({ penaltyApplied: 0 });

        let penaltyApplied = 0;
        const user = await User.findById(req.user._id);
        const now = new Date();
        const isFrozen = req.user.activeFreeze === now.toISOString().split('T')[0];

        for (let d = 1; d < effectiveToday; d++) {
            if (isBlacklisted(d, blacklisted)) continue;
            if (checkedInDays.includes(d)) continue;

            for (const goal of goals) {
                const alreadyApplied = goal.pointsApplied && goal.pointsApplied.get && goal.pointsApplied.get(String(d)) !== undefined;
                if (alreadyApplied) continue;
                let pts = calcGoalPoints(goal.priority, false);
                if (isFrozen && pts < 0) pts = 0;
                goal.pointsApplied.set(String(d), pts);
                penaltyApplied += pts;
                await goal.save();
            }

            if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                user.checkins = { month, year, goals: [], sleep: user.checkins?.sleep || [], macros: user.checkins?.macros || [] };
            }
            user.checkins.goals.push(d);
        }

        user.totalPoints += penaltyApplied;
        await user.save();

        res.json({ penaltyApplied, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

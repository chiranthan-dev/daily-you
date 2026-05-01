const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sleep = require('../models/Sleep');
const User = require('../models/User');
const { calcSleepPoints, calcSleepHours, isBlacklisted, getEffectiveDay, CHECKIN_MISS_PENALTY } = require('../utils/points');

async function getOrCreateSleepDoc(userId, month, year) {
    let doc = await Sleep.findOne({ userId, month, year });
    if (!doc) doc = new Sleep({ userId, month, year });
    return doc;
}

// GET /api/sleep
router.get('/', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const doc = await getOrCreateSleepDoc(req.user._id, month, year);
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/sleep/setup
router.post('/setup', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const { targetSleepTime, targetWakeTime } = req.body;
        const doc = await getOrCreateSleepDoc(req.user._id, month, year);
        doc.targetSleepTime = targetSleepTime;
        doc.targetWakeTime = targetWakeTime;
        doc.setupDone = true;
        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/sleep/log - log daily sleep (relative to user's own target)
router.post('/log', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const { day, sleepTime, wakeTime } = req.body;
        const doc = await getOrCreateSleepDoc(req.user._id, month, year);

        const sectionDisabled = req.user.disabledSections?.sleep;

        const existingLog = doc.logs.find(l => l.day === day);
        if (existingLog?.calculated) {
            return res.status(400).json({ message: 'Already calculated for this day. Use edit to change it.' });
        }

        const totalHours = calcSleepHours(sleepTime, wakeTime);
        const blacklisted = isBlacklisted(day, req.user.settings?.blacklistedDates);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isFrozen = req.user.activeFreeze === todayStr;

        let points = 0;
        if (!blacklisted && !sectionDisabled) {
            points = calcSleepPoints(sleepTime, wakeTime, doc.targetSleepTime, doc.targetWakeTime);
            if (isFrozen && points < 0) points = 0;
        }

        if (existingLog) {
            existingLog.sleepTime = sleepTime;
            existingLog.wakeTime = wakeTime;
            existingLog.totalHours = totalHours;
            existingLog.points = points;
            existingLog.calculated = true;
        } else {
            doc.logs.push({ day, sleepTime, wakeTime, totalHours, points, calculated: true });
        }

        await doc.save();

        const user = await User.findById(req.user._id);
        user.totalPoints += points;

        if (!blacklisted) {
            if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                user.checkins = { month, year, goals: user.checkins?.goals || [], sleep: [], macros: user.checkins?.macros || [] };
            }
            if (!user.checkins.sleep.includes(day)) {
                user.checkins.sleep.push(day);
            }
        }
        await user.save();

        res.json({ log: doc.logs.find(l => l.day === day), totalPoints: user.totalPoints, pointsAdded: points });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/sleep/edit - edit a previously logged day (reverse old points, apply new)
router.put('/edit', auth, async (req, res) => {
    try {
        const { day, sleepTime, wakeTime } = req.body;
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const doc = await getOrCreateSleepDoc(req.user._id, month, year);

        const existingLog = doc.logs.find(l => l.day === day);
        if (!existingLog) {
            return res.status(404).json({ message: 'No log found for this day' });
        }

        const sectionDisabled = req.user.disabledSections?.sleep;
        const blacklisted = isBlacklisted(day, req.user.settings?.blacklistedDates);
        const now = new Date();
        const isFrozen = req.user.activeFreeze === now.toISOString().split('T')[0];

        const oldPoints = existingLog.points || 0;

        const totalHours = calcSleepHours(sleepTime, wakeTime);
        let newPoints = 0;
        if (!blacklisted && !sectionDisabled) {
            newPoints = calcSleepPoints(sleepTime, wakeTime, doc.targetSleepTime, doc.targetWakeTime);
            if (isFrozen && newPoints < 0) newPoints = 0;
        }

        existingLog.sleepTime = sleepTime;
        existingLog.wakeTime = wakeTime;
        existingLog.totalHours = totalHours;
        existingLog.points = newPoints;
        existingLog.calculated = true;

        await doc.save();

        const user = await User.findById(req.user._id);
        user.totalPoints = user.totalPoints - oldPoints + newPoints;
        await user.save();

        res.json({ log: existingLog, pointsDelta: newPoints - oldPoints, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/sleep/apply-missed
router.post('/apply-missed', auth, async (req, res) => {
    try {
        if (req.user.disabledSections?.sleep) return res.json({ penaltyApplied: 0 });

        const { day: effectiveToday, month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const blacklisted = req.user.settings?.blacklistedDates || [];
        const checkedInDays = req.user.checkins?.sleep || [];

        const doc = await getOrCreateSleepDoc(req.user._id, month, year);
        if (!doc.setupDone) return res.json({ penaltyApplied: 0 });

        let penaltyApplied = 0;
        const user = await User.findById(req.user._id);
        const now = new Date();
        const isFrozen = req.user.activeFreeze === now.toISOString().split('T')[0];

        for (let d = 1; d < effectiveToday; d++) {
            if (isBlacklisted(d, blacklisted)) continue;
            if (checkedInDays.includes(d)) continue;
            const alreadyLogged = doc.logs.find(l => l.day === d && l.calculated);
            if (alreadyLogged) continue;

            let pts = CHECKIN_MISS_PENALTY;
            if (isFrozen) pts = 0;
            doc.logs.push({ day: d, sleepTime: null, wakeTime: null, totalHours: 0, points: pts, calculated: true });
            penaltyApplied += pts;

            if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                user.checkins = { month, year, goals: user.checkins?.goals || [], sleep: [], macros: user.checkins?.macros || [] };
            }
            user.checkins.sleep.push(d);
        }

        await doc.save();
        user.totalPoints += penaltyApplied;
        await user.save();

        res.json({ penaltyApplied, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

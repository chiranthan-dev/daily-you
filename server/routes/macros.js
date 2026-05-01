const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Macro = require('../models/Macro');
const User = require('../models/User');
const { calcMacroPoints, isBlacklisted, getEffectiveDay, CHECKIN_MISS_PENALTY } = require('../utils/points');

async function getOrCreateMacroDoc(userId, month, year) {
    let doc = await Macro.findOne({ userId, month, year });
    if (!doc) doc = new Macro({ userId, month, year });
    return doc;
}

// GET /api/macros
router.get('/', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const doc = await getOrCreateMacroDoc(req.user._id, month, year);
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/macros/setup
router.post('/setup', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const { targetProtein, targetCarbs, targetFats } = req.body;
        const doc = await getOrCreateMacroDoc(req.user._id, month, year);
        doc.targetProtein = targetProtein;
        doc.targetCarbs = targetCarbs;
        doc.targetFats = targetFats;
        doc.setupDone = true;
        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/macros/log
router.post('/log', auth, async (req, res) => {
    try {
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const { day, protein, carbs, fats } = req.body;
        const doc = await getOrCreateMacroDoc(req.user._id, month, year);

        const sectionDisabled = req.user.disabledSections?.macros;

        const existingLog = doc.logs.find(l => l.day === day);
        if (existingLog) {
            return res.status(400).json({ message: 'Already logged macros for this day. Use edit to change it.' });
        }

        const blacklisted = isBlacklisted(day, req.user.settings?.blacklistedDates);
        const now = new Date();
        const isFrozen = req.user.activeFreeze === now.toISOString().split('T')[0];

        let points = 0;
        if (!blacklisted && !sectionDisabled) {
            points = calcMacroPoints(protein, carbs, fats, doc.targetProtein, doc.targetCarbs, doc.targetFats);
            if (isFrozen && points < 0) points = 0;
        }

        doc.logs.push({ day, protein, carbs, fats, points });
        await doc.save();

        const user = await User.findById(req.user._id);
        user.totalPoints += points;
        if (!blacklisted) {
            if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                user.checkins = { month, year, goals: user.checkins?.goals || [], sleep: user.checkins?.sleep || [], macros: [] };
            }
            if (!user.checkins.macros.includes(day)) user.checkins.macros.push(day);
        }
        await user.save();

        res.json({ log: doc.logs[doc.logs.length - 1], pointsAdded: points, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/macros/edit
router.put('/edit', auth, async (req, res) => {
    try {
        const { day, protein, carbs, fats } = req.body;
        const { month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const doc = await getOrCreateMacroDoc(req.user._id, month, year);

        const existingLog = doc.logs.find(l => l.day === day);
        if (!existingLog) {
            return res.status(404).json({ message: 'No log found for this day' });
        }

        const sectionDisabled = req.user.disabledSections?.macros;
        const blacklisted = isBlacklisted(day, req.user.settings?.blacklistedDates);
        const now = new Date();
        const isFrozen = req.user.activeFreeze === now.toISOString().split('T')[0];

        const oldPoints = existingLog.points || 0;

        let newPoints = 0;
        if (!blacklisted && !sectionDisabled) {
            newPoints = calcMacroPoints(protein, carbs, fats, doc.targetProtein, doc.targetCarbs, doc.targetFats);
            if (isFrozen && newPoints < 0) newPoints = 0;
        }

        existingLog.protein = protein;
        existingLog.carbs = carbs;
        existingLog.fats = fats;
        existingLog.points = newPoints;

        await doc.save();

        const user = await User.findById(req.user._id);
        user.totalPoints = user.totalPoints - oldPoints + newPoints;
        await user.save();

        res.json({ log: existingLog, pointsDelta: newPoints - oldPoints, totalPoints: user.totalPoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/macros/apply-missed
router.post('/apply-missed', auth, async (req, res) => {
    try {
        if (req.user.disabledSections?.macros) return res.json({ penaltyApplied: 0 });

        const { day: effectiveToday, month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const blacklisted = req.user.settings?.blacklistedDates || [];
        const checkedInDays = req.user.checkins?.macros || [];

        const doc = await getOrCreateMacroDoc(req.user._id, month, year);
        if (!doc.setupDone) return res.json({ penaltyApplied: 0 });

        let penaltyApplied = 0;
        const user = await User.findById(req.user._id);
        const now = new Date();
        const isFrozen = req.user.activeFreeze === now.toISOString().split('T')[0];

        for (let d = 1; d < effectiveToday; d++) {
            if (isBlacklisted(d, blacklisted)) continue;
            if (checkedInDays.includes(d)) continue;
            const alreadyLogged = doc.logs.find(l => l.day === d);
            if (alreadyLogged) continue;

            let pts = CHECKIN_MISS_PENALTY;
            if (isFrozen) pts = 0;
            doc.logs.push({ day: d, protein: 0, carbs: 0, fats: 0, points: pts });
            penaltyApplied += pts;

            if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                user.checkins = { month, year, goals: user.checkins?.goals || [], sleep: user.checkins?.sleep || [], macros: [] };
            }
            user.checkins.macros.push(d);
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

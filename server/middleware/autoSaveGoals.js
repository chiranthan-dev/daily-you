/**
 * Auto-save middleware: runs on every authenticated request.
 * When the effective day rolls over, any unsaved goals from previous days
 * are automatically saved with their current state (ticked or unticked).
 */
const Goal = require('../models/Goal');
const User = require('../models/User');
const { calcGoalPoints, isBlacklisted, getEffectiveDay } = require('../utils/points');

async function autoSaveGoals(req, res, next) {
    try {
        // Only run if we have an authenticated user
        if (!req.user) return next();

        const { day: effectiveToday, month, year } = getEffectiveDay(req.user.settings?.deadlineTime);
        const goals = await Goal.find({ userId: req.user._id, month, year });
        if (goals.length === 0) return next();

        const sectionDisabled = req.user.disabledSections?.goals;
        const blacklistedDates = req.user.settings?.blacklistedDates || [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isFrozen = req.user.activeFreeze === todayStr;

        let totalPointsAdded = 0;
        let autoSaved = false;

        // A goal can only be judged from the day it was created onwards.
        // Without this, adding a goal mid-month back-penalises every earlier
        // day of that month for a goal that did not exist yet.
        const firstScorableDay = (goal) => {
            const created = new Date(goal.createdAt);
            if (created.getMonth() + 1 !== month || created.getFullYear() !== year) return 1;
            return created.getDate();
        };

        // Check all past days (1 to effectiveToday-1) for unsaved goals
        for (let d = 1; d < effectiveToday; d++) {
            const blacklisted = isBlacklisted(d, blacklistedDates);

            // Check if ANY goal for this day is unsaved
            const hasUnsaved = goals.some(goal => {
                const applied = goal.pointsApplied?.get
                    ? goal.pointsApplied.get(String(d))
                    : goal.pointsApplied?.[String(d)];
                return applied === undefined || applied === null;
            });

            if (!hasUnsaved) continue;

            // Auto-save all unsaved goals for this day
            for (const goal of goals) {
                const dayStr = String(d);
                const alreadyApplied = goal.pointsApplied?.get
                    ? goal.pointsApplied.get(dayStr) !== undefined
                    : goal.pointsApplied?.[dayStr] !== undefined;
                if (alreadyApplied) continue;

                if (d < firstScorableDay(goal)) {
                    // Predates the goal — record it as settled at zero so the
                    // day is not reconsidered on every subsequent request.
                    goal.pointsApplied.set(dayStr, 0);
                } else if (blacklisted || sectionDisabled) {
                    goal.pointsApplied.set(dayStr, 0);
                } else {
                    // Use whatever the completion state is (ticked or unticked)
                    const completed = goal.completions?.get
                        ? (goal.completions.get(dayStr) || false)
                        : (goal.completions?.[dayStr] || false);
                    let points = calcGoalPoints(goal.priority, completed);
                    if (isFrozen && points < 0) points = 0;
                    goal.pointsApplied.set(dayStr, points);
                    totalPointsAdded += points;
                }
                await goal.save();
                autoSaved = true;
            }

            // Record check-in
            if (!blacklisted) {
                const user = await User.findById(req.user._id);
                if (!user.checkins || user.checkins.month !== month || user.checkins.year !== year) {
                    user.checkins = { month, year, goals: [], sleep: user.checkins?.sleep || [], macros: user.checkins?.macros || [] };
                }
                if (!user.checkins.goals.includes(d)) {
                    user.checkins.goals.push(d);
                }
                await user.save();
            }
        }

        // Update total points if any were auto-saved
        if (autoSaved && totalPointsAdded !== 0) {
            const user = await User.findById(req.user._id);
            user.totalPoints += totalPointsAdded;
            await user.save();
            // Update req.user so subsequent handlers see the updated points
            req.user = await User.findById(req.user._id).select('-password');
        }
    } catch (err) {
        // Don't block the request if auto-save fails
        console.error('Auto-save goals error:', err.message);
    }
    next();
}

module.exports = autoSaveGoals;

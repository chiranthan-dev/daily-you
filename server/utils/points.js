/**
 * Calculate points for a goal based on priority and completion status.
 */
function calcGoalPoints(priority, completed) {
    if (priority === 'high') return completed ? 4 : -6;
    if (priority === 'medium') return completed ? 2 : -3;
    if (priority === 'low') return completed ? 1 : -2;
    return 0;
}

/**
 * Calculate sleep points relative to the user's personal target duration.
 * @param {string} sleepTime       - actual sleep time "HH:MM"
 * @param {string} wakeTime        - actual wake time "HH:MM"
 * @param {string} targetSleepTime - target sleep time "HH:MM"
 * @param {string} targetWakeTime  - target wake time "HH:MM"
 */
function calcSleepPoints(sleepTime, wakeTime, targetSleepTime, targetWakeTime) {
    const actualHours = calcSleepHours(sleepTime, wakeTime);
    const targetHours = calcSleepHours(targetSleepTime, targetWakeTime);
    const deviation = Math.abs(actualHours - targetHours);

    const exactSleep = sleepTime === targetSleepTime;
    const exactWake = wakeTime === targetWakeTime;

    if (exactSleep && exactWake && deviation < 0.1) return 5; // Perfect match
    if (deviation <= 0.25) return 5; // Within 15 min of target
    if (deviation <= 1.0) return 3; // Within 1h of target
    if (deviation <= 1.5) return 2; // Within 1.5h of target
    return -5;                                                  // > 1.5h off target
}

/**
 * Calculate macro points based on combined deviation from targets.
 */
function calcMacroPoints(protein, carbs, fats, targetProtein, targetCarbs, targetFats) {
    const totalDeviation =
        Math.abs(protein - targetProtein) +
        Math.abs(carbs - targetCarbs) +
        Math.abs(fats - targetFats);

    if (totalDeviation <= 10) return 5;
    if (totalDeviation <= 30) return 2;
    if (totalDeviation >= 50) return -5;
    return 1; // 31-49g deviation
}

/**
 * Check-in miss penalty (-5 per section per missed day).
 */
const CHECKIN_MISS_PENALTY = -5;

/**
 * Check if a given day number is in user's blacklisted dates.
 * Force Number comparison on both sides to avoid type mismatches.
 */
function isBlacklisted(day, blacklistedDates = []) {
    return blacklistedDates.map(Number).includes(Number(day));
}

/**
 * Parse time string "HH:MM" to minutes since midnight.
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Calculate total sleep hours given sleep time (previous night) and wake time.
 * Handles crossing midnight.
 */
function calcSleepHours(sleepTime, wakeTime) {
    const sleepMins = timeToMinutes(sleepTime);
    const wakeMins = timeToMinutes(wakeTime);
    let diff = wakeMins - sleepMins;
    if (diff < 0) diff += 24 * 60; // crossed midnight
    return parseFloat((diff / 60).toFixed(2));
}

/**
 * Get the "effective" day/month/year based on deadline time.
 * If the deadline is e.g. "03:00", then between midnight and 03:00 we still
 * consider it the previous calendar day. This means:
 *   - At 01:30 on March 5 with deadline 03:00 → effective day is March 4
 *   - At 04:00 on March 5 with deadline 03:00 → effective day is March 5
 *
 * @param {string} deadlineTime - "HH:MM" format (e.g. "03:00", "23:59")
 * @returns {{ day: number, month: number, year: number }}
 */
function getEffectiveDay(deadlineTime) {
    const now = new Date();
    const deadlineMins = timeToMinutes(deadlineTime || '23:59');
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Only shift back if deadline is in the early morning hours (< 12:00)
    // AND current time is before the deadline
    if (deadlineMins < 12 * 60 && currentMins < deadlineMins) {
        // Still "yesterday"
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
            day: yesterday.getDate(),
            month: yesterday.getMonth() + 1,
            year: yesterday.getFullYear()
        };
    }

    return {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear()
    };
}

module.exports = {
    calcGoalPoints,
    calcSleepPoints,
    calcMacroPoints,
    isBlacklisted,
    timeToMinutes,
    calcSleepHours,
    getEffectiveDay,
    CHECKIN_MISS_PENALTY
};

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    ownedItems: [
        {
            itemId: String,
            name: String,
            quantity: { type: Number, default: 1 }
        }
    ],
    activeFreeze: { type: String, default: null }, // date string "YYYY-MM-DD"
    settings: {
        deadlineTime: { type: String, default: '23:59' }, // HH:MM
        blacklistedDates: [Number] // day numbers e.g. [1,2,3]
    },
    // Which sections are opted out of scoring
    disabledSections: {
        goals: { type: Boolean, default: false },
        sleep: { type: Boolean, default: false },
        macros: { type: Boolean, default: false }
    },
    // Track which days the user has checked in per section
    // checkins.goals  = [1,5,10,...]  (day numbers logged this month)
    // checkins.sleep  = [1,5,10,...]
    // checkins.macros = [1,5,10,...]
    checkins: {
        month: { type: Number, default: null },
        year: { type: Number, default: null },
        goals: [Number],
        sleep: [Number],
        macros: [Number]
    },
    monthlySetup: {
        month: { type: Number, default: null },
        year: { type: Number, default: null },
        done: { type: Boolean, default: false }
    },
    lastLoginMonth: { type: Number, default: null },
    lastLoginYear: { type: Number, default: null }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

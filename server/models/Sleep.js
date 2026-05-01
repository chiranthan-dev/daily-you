const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema({
    day: { type: Number, required: true }, // day of month
    sleepTime: { type: String }, // "HH:MM"
    wakeTime: { type: String },  // "HH:MM"
    totalHours: { type: Number },
    points: { type: Number, default: 0 },
    calculated: { type: Boolean, default: false }
});

const sleepSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    targetSleepTime: { type: String, default: '00:00' }, // "HH:MM"
    targetWakeTime: { type: String, default: '08:00' },
    setupDone: { type: Boolean, default: false },
    logs: [sleepLogSchema]
}, { timestamps: true });

module.exports = mongoose.model('Sleep', sleepSchema);

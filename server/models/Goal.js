const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    title: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    // completions: { "1": true, "5": false, ... } key = day number
    completions: { type: Map, of: Boolean, default: {} },
    // pointsApplied: { "1": 4, "5": -6, ... } key = day number
    pointsApplied: { type: Map, of: Number, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);

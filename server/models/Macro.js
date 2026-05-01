const mongoose = require('mongoose');

const macroLogSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
});

const macroSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    targetProtein: { type: Number, default: 150 },
    targetCarbs: { type: Number, default: 250 },
    targetFats: { type: Number, default: 70 },
    setupDone: { type: Boolean, default: false },
    logs: [macroLogSchema]
}, { timestamps: true });

module.exports = mongoose.model('Macro', macroSchema);

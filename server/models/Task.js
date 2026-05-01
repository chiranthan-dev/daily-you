const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    column: { type: String, enum: ['today', 'tomorrow'], default: 'today' },
    completed: { type: Boolean, default: false },
    createdDate: { type: String } // "YYYY-MM-DD"
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: 1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
    try {
        const { title, column } = req.body;
        const now = new Date();
        const task = new Task({
            userId: req.user._id,
            title,
            column: column || 'today',
            createdDate: now.toISOString().split('T')[0]
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, column, completed } = req.body;
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { ...(title !== undefined && { title }), ...(column !== undefined && { column }), ...(completed !== undefined && { completed }) },
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/tasks/rollover - move uncompleted today tasks to tomorrow
router.post('/rollover', auth, async (req, res) => {
    try {
        const result = await Task.updateMany(
            { userId: req.user._id, column: 'today', completed: false },
            { column: 'tomorrow' }
        );
        // Move tomorrow tasks to today (new day)
        await Task.updateMany(
            { userId: req.user._id, column: 'tomorrow' },
            { column: 'today' }
        );
        res.json({ message: 'Rollover complete', modified: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

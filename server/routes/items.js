const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/items
router.get('/', auth, async (req, res) => {
    res.json(req.user.ownedItems);
});

// POST /api/items/activate
router.post('/activate', auth, async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);

        const owned = user.ownedItems.find(i => i.itemId === itemId);
        if (!owned || owned.quantity < 1) {
            return res.status(400).json({ message: 'You do not own this item' });
        }

        if (itemId === 'freeze_card') {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            user.activeFreeze = todayStr;
        }

        owned.quantity -= 1;
        if (owned.quantity === 0) {
            user.ownedItems = user.ownedItems.filter(i => i.itemId !== itemId);
        }

        await user.save();
        res.json({ message: 'Item activated', activeFreeze: user.activeFreeze, ownedItems: user.ownedItems });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

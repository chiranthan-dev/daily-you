const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const SHOP_ITEMS = [
    {
        id: 'freeze_card',
        name: 'Freeze Card',
        description: 'Prevents all point penalties for one full day.',
        cost: 15,
        icon: '🧊',
        color: '#00D4FF',
        type: 'consumable'
    },
    {
        id: 'car_common',
        name: 'City Cruiser',
        description: 'A reliable daily driver. Common rarity.',
        cost: 50,
        icon: '/cars/car_common.png',
        color: '#aaaaaa',
        type: 'car',
        rarity: 'Common'
    },
    {
        id: 'car_rare',
        name: 'Neon Sprinter',
        description: 'Sleek and fast. Rare rarity.',
        cost: 150,
        icon: '/cars/car_rare.png',
        color: '#39FF14',
        type: 'car',
        rarity: 'Rare'
    },
    {
        id: 'car_epic',
        name: 'Cyber Muscle',
        description: 'Pure power and neon. Epic rarity.',
        cost: 300,
        icon: '/cars/car_epic.png',
        color: '#FF00FF',
        type: 'car',
        rarity: 'Epic'
    },
    {
        id: 'car_legendary',
        name: 'Aura Supercar',
        description: 'Glowing with energy. Legendary rarity.',
        cost: 1000,
        icon: '/cars/car_legendary.png',
        color: '#FF6B00',
        type: 'car',
        rarity: 'Legendary'
    }
];

// GET /api/shop/items
router.get('/items', auth, (req, res) => {
    res.json(SHOP_ITEMS);
});

// POST /api/shop/buy
router.post('/buy', auth, async (req, res) => {
    try {
        const { itemId } = req.body;
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const user = await User.findById(req.user._id);
        if (user.totalPoints < item.cost) {
            return res.status(400).json({ message: 'Insufficient points' });
        }

        user.totalPoints -= item.cost;

        const existing = user.ownedItems.find(i => i.itemId === itemId);
        if (existing) {
            existing.quantity += 1;
        } else {
            user.ownedItems.push({ itemId: item.id, name: item.name, quantity: 1 });
        }

        await user.save();
        res.json({ message: 'Item purchased', totalPoints: user.totalPoints, ownedItems: user.ownedItems });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;

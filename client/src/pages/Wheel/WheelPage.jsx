import { useState, useEffect } from 'react';
import { Target, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import './Wheel.css';

const DEFAULT_SLOTS = [
    "10 Pushups", "No Sugar", "Give friend $5", "Cold Shower", "Skip a meal", "Run 1 mile"
];

// Premium palette
const COLORS = [
    "#FF2A55", "#1E1E2C", "#FF6B00", "#2D2D3F", "#8B5CF6", 
    "#151520", "#00F0FF", "#252535", "#F59E0B", "#181825"
];

export default function WheelPage() {
    const navigate = useNavigate();
    const [weeklyPoints, setWeeklyPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState(() => {
        const saved = localStorage.getItem('wheel_slots');
        return saved ? JSON.parse(saved) : DEFAULT_SLOTS;
    });
    const [newSlot, setNewSlot] = useState('');
    
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState(null);

    useEffect(() => {
        api.get('/user/weekly-stats').then(res => {
            setWeeklyPoints(res.data.weeklyPoints);
        }).catch(() => {
            toast.error("Failed to load weekly stats");
        }).finally(() => setLoading(false));
    }, []);

    const handleAddSlot = () => {
        if (!newSlot.trim()) return;
        if (slots.length >= 10) return toast.error("Maximum 10 slots allowed");
        const updated = [...slots, newSlot.trim()];
        setSlots(updated);
        localStorage.setItem('wheel_slots', JSON.stringify(updated));
        setNewSlot('');
    };

    const handleDeleteSlot = (index) => {
        if (slots.length <= 2) return toast.error("Must have at least 2 slots");
        const updated = slots.filter((_, i) => i !== index);
        setSlots(updated);
        localStorage.setItem('wheel_slots', JSON.stringify(updated));
    };

    const spinWheel = () => {
        if (spinning) return;
        if (weeklyPoints >= 0) return toast.error("You don't need to spin! Your weekly balance is positive.");
        
        setSpinning(true);
        setResult(null);

        const spins = Math.floor(Math.random() * 5) + 5; // 5 to 10 full spins
        const degreePerSlot = 360 / slots.length;
        const randomSlotIndex = Math.floor(Math.random() * slots.length);
        
        // Target angle to position the selected slot under the top pointer (-90 degrees)
        const midAngle = (randomSlotIndex + 0.5) * degreePerSlot;
        const targetRotation = -90 - midAngle;
        
        const finalDegree = (spins * 360) + targetRotation;

        setRotation(finalDegree);

        setTimeout(() => {
            setSpinning(false);
            setResult(slots[randomSlotIndex]);
            setRotation(finalDegree % 360);
        }, 4000);
    };

    if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

    const renderWheel = () => {
        const radius = 150;
        const numSlots = slots.length;
        
        return (
            <svg viewBox="-150 -150 300 300" className="wheel-svg" style={{ transform: `rotate(${rotation}deg)` }}>
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {slots.map((slot, i) => {
                    const startAngle = (i / numSlots) * Math.PI * 2;
                    const endAngle = ((i + 1) / numSlots) * Math.PI * 2;
                    const x1 = Math.cos(startAngle) * radius;
                    const y1 = Math.sin(startAngle) * radius;
                    const x2 = Math.cos(endAngle) * radius;
                    const y2 = Math.sin(endAngle) * radius;
                    const midAngle = ((startAngle + endAngle) / 2) * (180 / Math.PI);

                    const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

                    return (
                        <g key={i}>
                            <path 
                                d={pathData} 
                                fill={COLORS[i % COLORS.length]} 
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="2"
                            />
                            <text 
                                x={radius * 0.6} 
                                y="0" 
                                fill="#ffffff" 
                                fontSize="12" 
                                fontWeight="700" 
                                fontFamily="system-ui, sans-serif"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${midAngle})`}
                                style={{ letterSpacing: '0.5px' }}
                            >
                                {slot.length > 15 ? slot.substring(0, 15) + '...' : slot}
                            </text>
                        </g>
                    );
                })}
                <circle cx="0" cy="0" r="20" fill="#151520" stroke="#FF2A55" strokeWidth="3" filter="url(#glow)" />
            </svg>
        );
    };

    return (
        <div className="page wheel-page">
            <div className="wheel-header">
                <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h2 className="title-gradient"><Target size={24} /> Punishment Wheel</h2>
            </div>

            <div className="glass-panel status-panel">
                <div className="status-header">
                    <h3>Weekly Point Balance</h3>
                    <div className={`points-badge ${weeklyPoints >= 0 ? 'positive' : 'negative'}`}>
                        {weeklyPoints}
                    </div>
                </div>
                {weeklyPoints >= 0 ? (
                    <p className="status-msg success">Great job! You survived this week without a punishment.</p>
                ) : (
                    <p className="status-msg danger">Oh no! Your balance is negative. You must spin the wheel.</p>
                )}
            </div>

            <div className="wheel-wrapper">
                <div className="wheel-pointer">
                    <div className="pointer-triangle"></div>
                </div>
                {renderWheel()}
            </div>

            <button 
                className={`spin-btn ${spinning ? 'spinning' : ''}`} 
                onClick={spinWheel} 
                disabled={spinning || weeklyPoints >= 0}
            >
                {spinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
                <div className="btn-glow"></div>
            </button>

            {result && (
                <div className="result-glass">
                    <h4>YOUR PUNISHMENT</h4>
                    <h2 className="gradient-text-red">{result}</h2>
                </div>
            )}

            <div className="glass-panel editor-panel">
                <h4 className="editor-title">Customize Wheel Slots</h4>
                <div className="slots-list">
                    {slots.map((slot, i) => (
                        <div key={i} className="slot-input-group">
                            <input className="glass-input" value={slot} readOnly />
                            <button className="btn-icon-danger" onClick={() => handleDeleteSlot(i)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="slot-input-group new-slot">
                    <input 
                        className="glass-input" 
                        value={newSlot} 
                        onChange={e => setNewSlot(e.target.value)} 
                        placeholder="Add new punishment..." 
                        onKeyDown={e => e.key === 'Enter' && handleAddSlot()}
                    />
                    <button className="btn-icon-success" onClick={handleAddSlot}>
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

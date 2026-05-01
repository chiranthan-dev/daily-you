import { useState, useEffect } from 'react';
import { Target, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import './Wheel.css';

const DEFAULT_SLOTS = [
    "10 Pushups", "No Sugar for 1 Day", "Give friend $5", "Cold Shower", "Skip a meal", "Run 1 mile"
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
        const randomSlot = Math.floor(Math.random() * slots.length);
        const finalDegree = (spins * 360) + (360 - (randomSlot * degreePerSlot)) - (degreePerSlot / 2);

        setRotation(finalDegree);

        setTimeout(() => {
            setSpinning(false);
            setResult(slots[randomSlot]);
            // Reset rotation so it doesn't unwind if spun again
            setRotation(finalDegree % 360);
        }, 4000);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

    const colors = ["#FF6B00", "#39FF14", "#00D4FF", "#FF00FF", "#FFFF00", "#FF0000", "#00FF00", "#0000FF", "#00FFFF", "#FF00AA"];

    return (
        <div className="page wheel-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, alignSelf: 'flex-start' }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
                <h2 className="page-title neon-orange" style={{ margin: 0 }}><Target size={20} /> Punishment Wheel</h2>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Weekly Point Balance: <span style={{ color: weeklyPoints >= 0 ? 'var(--green)' : '#ff5050', fontSize: 24 }}>{weeklyPoints}</span></h3>
                {weeklyPoints >= 0 ? (
                    <p style={{ color: 'var(--green)', marginTop: 10 }}>Great job! You survived this week without a punishment.</p>
                ) : (
                    <p style={{ color: '#ff5050', marginTop: 10 }}>Oh no! Your balance is negative. You must spin the wheel.</p>
                )}
            </div>

            <div className="wheel-container">
                <div className="wheel-pointer"></div>
                <div className="wheel" style={{ transform: `rotate(${rotation}deg)` }}>
                    {slots.map((slot, i) => {
                        const deg = (360 / slots.length) * i;
                        const skew = 90 - (360 / slots.length);
                        return (
                            <div 
                                key={i} 
                                className="wheel-slot" 
                                style={{ 
                                    transform: `rotate(${deg}deg) skewY(-${skew}deg)`,
                                    backgroundColor: colors[i % colors.length]
                                }}
                            >
                                <span style={{ transform: `skewY(${skew}deg) rotate(15deg)`, paddingLeft: '50px' }}>{slot}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button 
                className="btn btn-orange btn-lg" 
                onClick={spinWheel} 
                disabled={spinning || weeklyPoints >= 0}
                style={{ fontSize: 20, padding: '15px 40px', marginTop: 20 }}
            >
                {spinning ? 'Spinning...' : 'SPIN THE WHEEL'}
            </button>

            {result && (
                <div className="punishment-result">
                    <h3 className="neon-orange">Your Punishment:</h3>
                    <h2 style={{ color: '#fff', margin: '10px 0' }}>{result}</h2>
                </div>
            )}

            <div className="slot-editor card">
                <h4 style={{ marginBottom: 15, color: 'var(--orange)' }}>Customize Wheel Slots</h4>
                {slots.map((slot, i) => (
                    <div key={i} className="slot-item">
                        <input className="input" value={slot} readOnly style={{ flex: 1 }} />
                        <button className="btn btn-ghost" onClick={() => handleDeleteSlot(i)}><Trash2 size={16} color="#ff5050" /></button>
                    </div>
                ))}
                <div className="slot-item" style={{ marginTop: 15 }}>
                    <input 
                        className="input" 
                        value={newSlot} 
                        onChange={e => setNewSlot(e.target.value)} 
                        placeholder="New punishment..." 
                        style={{ flex: 1 }}
                        onKeyDown={e => e.key === 'Enter' && handleAddSlot()}
                    />
                    <button className="btn btn-orange" onClick={handleAddSlot}><Plus size={16} /></button>
                </div>
            </div>
        </div>
    );
}

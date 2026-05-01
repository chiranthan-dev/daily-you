import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Auth.css';

const STEPS = ['Account', 'Goals', 'Sleep', 'Macros'];

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [account, setAccount] = useState({ username: '', email: '', password: '', deadlineTime: '23:59' });
    const [goals, setGoals] = useState([{ title: '', priority: 'high' }]);
    const [sleep, setSleep] = useState({ targetSleepTime: '00:00', targetWakeTime: '08:00' });
    const [macros, setMacros] = useState({ targetProtein: 150, targetCarbs: 250, targetFats: 70 });

    const addGoal = () => setGoals(g => [...g, { title: '', priority: 'medium' }]);
    const removeGoal = (i) => setGoals(g => g.filter((_, idx) => idx !== i));
    const updateGoal = (i, field, val) => setGoals(g => g.map((gt, idx) => idx === i ? { ...gt, [field]: val } : gt));

    const handleRegister = async () => {
        setLoading(true);
        try {
            // 1. Create account
            const res = await api.post('/auth/register', {
                username: account.username,
                email: account.email,
                password: account.password,
                deadlineTime: account.deadlineTime
            });
            const { token, user } = res.data;
            login(token, user);

            // 2. Create goals
            for (const g of goals.filter(g => g.title.trim())) {
                await api.post('/goals', { title: g.title, priority: g.priority });
            }

            // 3. Setup sleep
            await api.post('/sleep/setup', sleep);

            // 4. Setup macros
            await api.post('/macros/setup', macros);

            // 5. Mark monthly setup done
            await api.post('/user/complete-monthly-setup');

            toast.success('Welcome to Daily You! Let\'s get started 🚀');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="auth-card animate-fade-in">
                <div className="auth-logo">
                    <h1 className="neon-green glow-green">DAILY YOU</h1>
                    <p>Create Your Account</p>
                </div>

                {/* STEP INDICATOR */}
                <div className="step-indicator">
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}></div>
                            {i < STEPS.length - 1 && <div className="step-line"></div>}
                        </div>
                    ))}
                </div>
                <p className="step-title neon-green">{STEPS[step]}</p>

                {/* STEP 0: ACCOUNT */}
                {step === 0 && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input className="input" placeholder="your_name" value={account.username}
                                onChange={e => setAccount(a => ({ ...a, username: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="input" type="email" placeholder="you@email.com" value={account.email}
                                onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="input" type="password" placeholder="••••••••" value={account.password}
                                onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Daily Deadline (HH:MM)</label>
                            <input className="input" type="time" value={account.deadlineTime}
                                onChange={e => setAccount(a => ({ ...a, deadlineTime: e.target.value }))} />
                        </div>
                        <button className="btn btn-green" style={{ justifyContent: 'center' }}
                            onClick={() => {
                                if (!account.username || !account.email || !account.password) return toast.error('Fill all fields');
                                setStep(1);
                            }}>Next →</button>
                    </div>
                )}

                {/* STEP 1: GOALS */}
                {step === 1 && (
                    <div className="auth-form">
                        {goals.map((g, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    {i === 0 && <label className="form-label">Goal Title</label>}
                                    <input className="input" placeholder={`Goal ${i + 1}`} value={g.title}
                                        onChange={e => updateGoal(i, 'title', e.target.value)} />
                                </div>
                                <div className="form-group" style={{ width: 110 }}>
                                    {i === 0 && <label className="form-label">Priority</label>}
                                    <select className="select" value={g.priority} onChange={e => updateGoal(i, 'priority', e.target.value)}>
                                        <option value="high">High +4/-6</option>
                                        <option value="medium">Med +2/-3</option>
                                        <option value="low">Low +1/-2</option>
                                    </select>
                                </div>
                                {goals.length > 1 && (
                                    <button className="btn btn-ghost btn-sm" style={{ marginBottom: 0 }} onClick={() => removeGoal(i)}>✕</button>
                                )}
                            </div>
                        ))}
                        <button className="btn btn-ghost btn-sm" onClick={addGoal}>+ Add Goal</button>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                            <button className="btn btn-green" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Next →</button>
                        </div>
                    </div>
                )}

                {/* STEP 2: SLEEP */}
                {step === 2 && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Target Sleep Time</label>
                            <input className="input" type="time" value={sleep.targetSleepTime}
                                onChange={e => setSleep(s => ({ ...s, targetSleepTime: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Target Wake Time</label>
                            <input className="input" type="time" value={sleep.targetWakeTime}
                                onChange={e => setSleep(s => ({ ...s, targetWakeTime: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                            <button className="btn btn-green" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>Next →</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: MACROS */}
                {step === 3 && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Protein Target (g)</label>
                            <input className="input" type="number" min={0} value={macros.targetProtein}
                                onChange={e => setMacros(m => ({ ...m, targetProtein: Number(e.target.value) }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Carbs Target (g)</label>
                            <input className="input" type="number" min={0} value={macros.targetCarbs}
                                onChange={e => setMacros(m => ({ ...m, targetCarbs: Number(e.target.value) }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fats Target (g)</label>
                            <input className="input" type="number" min={0} value={macros.targetFats}
                                onChange={e => setMacros(m => ({ ...m, targetFats: Number(e.target.value) }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                            <button className="btn btn-green" style={{ flex: 1, justifyContent: 'center' }} disabled={loading} onClick={handleRegister}>
                                {loading ? <span className="spinner"></span> : <UserPlus size={16} />}
                                {loading ? 'Creating...' : 'Launch Daily You'}
                            </button>
                        </div>
                    </div>
                )}

                <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    );
}

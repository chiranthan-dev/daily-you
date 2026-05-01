import { useState, useEffect } from 'react';
import { Moon, Clock, AlertCircle, AlertTriangle, Pencil, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Sleep.css';

export default function SleepTab() {
    const { user, refreshUser } = useAuth();
    const today = user?.effectiveDay || new Date().getDate();
    const isDisabled = user?.disabledSections?.sleep;
    const blacklistedDates = user?.settings?.blacklistedDates || [];

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sleepTime, setSleepTime] = useState('23:00');
    const [wakeTime, setWakeTime] = useState('07:00');
    const [calculating, setCalculating] = useState(false);
    const [applyingMissed, setApplyingMissed] = useState(false);
    const [setup, setSetup] = useState({ targetSleepTime: '00:00', targetWakeTime: '08:00' });
    const [savingSetup, setSavingSetup] = useState(false);
    // Edit state
    const [editDay, setEditDay] = useState(null);
    const [editSleep, setEditSleep] = useState('');
    const [editWake, setEditWake] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    useEffect(() => {
        api.get('/sleep').then(res => { setData(res.data); }).catch(() => toast.error('Failed to load sleep data')).finally(() => setLoading(false));
    }, []);

    const handleSetup = async () => {
        setSavingSetup(true);
        try {
            const res = await api.post('/sleep/setup', setup);
            setData(res.data);
            toast.success('Sleep targets set!');
        } catch (err) {
            toast.error('Failed to save targets');
        } finally {
            setSavingSetup(false);
        }
    };

    const handleApplyMissed = async () => {
        setApplyingMissed(true);
        try {
            const res = await api.post('/sleep/apply-missed');
            if (res.data.penaltyApplied) {
                toast.success(`${res.data.penaltyApplied} pts applied for missed days`);
                const updated = await api.get('/sleep');
                setData(updated.data);
                refreshUser();
            } else {
                toast('No missed days to penalise ✓');
            }
        } catch (err) {
            toast.error('Failed to apply missed');
        } finally {
            setApplyingMissed(false);
        }
    };

    const handleCalculate = async () => {
        setCalculating(true);
        try {
            const res = await api.post('/sleep/log', { day: today, sleepTime, wakeTime });
            toast.success(`Sleep logged! ${res.data.pointsAdded >= 0 ? '+' : ''}${res.data.pointsAdded} pts`);
            const updated = await api.get('/sleep');
            setData(updated.data);
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log sleep');
        } finally {
            setCalculating(false);
        }
    };

    const startEdit = (log) => {
        setEditDay(log.day);
        setEditSleep(log.sleepTime || '23:00');
        setEditWake(log.wakeTime || '07:00');
    };

    const handleEdit = async () => {
        setEditSaving(true);
        try {
            const res = await api.put('/sleep/edit', { day: editDay, sleepTime: editSleep, wakeTime: editWake });
            toast.success(`Day ${editDay} updated! ${res.data.pointsDelta >= 0 ? '+' : ''}${res.data.pointsDelta} pts change`);
            const updated = await api.get('/sleep');
            setData(updated.data);
            refreshUser();
            setEditDay(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to edit');
        } finally {
            setEditSaving(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

    const todayLog = data?.logs?.find(l => l.day === today);
    const allLogs = [...(data?.logs || [])].sort((a, b) => a.day - b.day);

    return (
        <div className="page">
            <h2 className="page-title neon-blue">Sleep Tracker</h2>
            {isDisabled && (
                <div className="badge badge-orange" style={{ marginBottom: 12 }}>⚠️ Scoring disabled — data is tracked but no points awarded</div>
            )}

            {/* SETUP/TARGETS */}
            <div className="sleep-layout">
                <div className="card card-glow-blue">
                    <h3 className="card-section-title neon-blue"><Moon size={16} /> Monthly Targets</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Target Sleep Time</label>
                            <input className="input" type="time"
                                value={data?.setupDone ? data.targetSleepTime : setup.targetSleepTime}
                                onChange={e => setSetup(s => ({ ...s, targetSleepTime: e.target.value }))}
                                disabled={data?.setupDone} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Target Wake Time</label>
                            <input className="input" type="time"
                                value={data?.setupDone ? data.targetWakeTime : setup.targetWakeTime}
                                onChange={e => setSetup(s => ({ ...s, targetWakeTime: e.target.value }))}
                                disabled={data?.setupDone} />
                        </div>
                        {!data?.setupDone && (
                            <button className="btn btn-blue" onClick={handleSetup} disabled={savingSetup} style={{ justifyContent: 'center' }}>
                                {savingSetup ? <span className="spinner"></span> : null} Set Targets
                            </button>
                        )}
                        {data?.setupDone && (
                            <div className="target-set-badge">
                                <span style={{ color: 'var(--blue)' }}>✓ Targets set for this month</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    {/* TODAY'S LOG */}
                    <div className="card card-glow-blue" style={{ marginBottom: 16 }}>
                        <h3 className="card-section-title neon-blue"><Clock size={16} /> Log Today — Day {today}</h3>
                        {todayLog?.calculated ? (
                            <div className="sleep-result animate-fade-in">
                                <div className="sleep-result-row">
                                    <span>Sleep:</span><strong>{todayLog.sleepTime}</strong>
                                </div>
                                <div className="sleep-result-row">
                                    <span>Wake:</span><strong>{todayLog.wakeTime}</strong>
                                </div>
                                <div className="sleep-result-row">
                                    <span>Duration:</span><strong>{todayLog.totalHours}h</strong>
                                </div>
                                <div className="sleep-result-row">
                                    <span>Points:</span>
                                    <strong style={{ color: todayLog.points >= 0 ? 'var(--green)' : '#ff5050' }}>
                                        {todayLog.points >= 0 ? '+' : ''}{todayLog.points}
                                    </strong>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">I slept at</label>
                                    <input className="input" type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">I woke up at</label>
                                    <input className="input" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
                                </div>
                                {!data?.setupDone && (
                                    <div className="alert-warning"><AlertCircle size={14} /> Set monthly targets first</div>
                                )}
                                <button className="btn btn-blue" disabled={calculating || !data?.setupDone} onClick={handleCalculate} style={{ justifyContent: 'center' }}>
                                    {calculating ? <span className="spinner"></span> : null} Calculate Points
                                </button>
                            </div>
                        )}
                    </div>

                    {/* POINTS GUIDE */}
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 className="card-section-title" style={{ color: 'var(--text-secondary)' }}>Points Guide (relative to YOUR target)</h3>
                        {data?.targetSleepTime && data?.targetWakeTime && (() => {
                            const targetHrs = (() => {
                                const [sh, sm] = data.targetSleepTime.split(':').map(Number);
                                const [wh, wm] = data.targetWakeTime.split(':').map(Number);
                                let diff = (wh * 60 + wm) - (sh * 60 + sm);
                                if (diff < 0) diff += 1440;
                                return (diff / 60).toFixed(1);
                            })();
                            return <p style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 10 }}>Your target: <strong>{targetHrs}h</strong> sleep ({data.targetSleepTime} → {data.targetWakeTime})</p>;
                        })()}
                        <div className="points-guide" style={{ marginTop: 8 }}>
                            <div className="guide-row"><span className="guide-pts neon-green">+5</span><span>Within 15 min of target</span></div>
                            <div className="guide-row"><span className="guide-pts neon-green">+3</span><span>Within 1h of target</span></div>
                            <div className="guide-row"><span className="guide-pts neon-blue">+2</span><span>Within 1.5h of target</span></div>
                            <div className="guide-row"><span className="guide-pts" style={{ color: '#ff5050' }}>-5</span><span>&gt;1.5h deviation from target</span></div>
                            <div className="guide-row"><span className="guide-pts" style={{ color: '#ff5050' }}>-5</span><span>Didn't log sleep that day</span></div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={handleApplyMissed} disabled={applyingMissed || isDisabled}>
                            {applyingMissed ? <span className="spinner"></span> : <AlertTriangle size={14} />} Penalise Missed Days
                        </button>
                    </div>
                </div>
            </div>

            {/* MONTHLY LOG TABLE */}
            {allLogs.length > 0 && (
                <div className="card" style={{ marginTop: 4 }}>
                    <h3 className="card-section-title" style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>Monthly Log</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Day</th><th>Sleep</th><th>Wake</th><th>Hours</th><th>Points</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {allLogs.map(l => (
                                    editDay === l.day ? (
                                        <tr key={l.day}>
                                            <td>Day {l.day}</td>
                                            <td><input className="input" type="time" value={editSleep} onChange={e => setEditSleep(e.target.value)} style={{ width: 100, padding: '4px 8px', fontSize: 12 }} /></td>
                                            <td><input className="input" type="time" value={editWake} onChange={e => setEditWake(e.target.value)} style={{ width: 100, padding: '4px 8px', fontSize: 12 }} /></td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-blue btn-sm" onClick={handleEdit} disabled={editSaving}>
                                                    {editSaving ? <span className="spinner" style={{ width: 12, height: 12 }}></span> : <Save size={12} />}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditDay(null)}><X size={12} /></button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={l.day} style={blacklistedDates.includes(l.day) ? { background: 'rgba(0,212,255,0.06)' } : {}}>
                                            <td>
                                                Day {l.day}
                                                {blacklistedDates.includes(l.day) && <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 9, padding: '1px 6px' }}>Blacklisted</span>}
                                            </td>
                                            <td>{l.sleepTime || '—'}</td>
                                            <td>{l.wakeTime || '—'}</td>
                                            <td>{l.totalHours}h</td>
                                            <td style={{ color: l.points >= 0 ? 'var(--green)' : '#ff5050', fontWeight: 700 }}>
                                                {l.points >= 0 ? '+' : ''}{l.points}
                                            </td>
                                            <td>
                                                {l.sleepTime && (
                                                    <button className="icon-btn" title="Edit this day" onClick={() => startEdit(l)}>
                                                        <Pencil size={13} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

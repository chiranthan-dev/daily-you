import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Save, Check, AlertTriangle, Pencil, SaveAll } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Goals.css';

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

export default function GoalsTab() {
    const { user, refreshUser } = useAuth();
    const today = user?.effectiveDay || new Date().getDate();
    const month = user?.effectiveMonth || (new Date().getMonth() + 1);
    const year = user?.effectiveYear || new Date().getFullYear();
    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blacklistedDates = user?.settings?.blacklistedDates || [];
    const isDisabled = user?.disabledSections?.goals;

    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addTitle, setAddTitle] = useState('');
    const [addPriority, setAddPriority] = useState('medium');
    const [saving, setSaving] = useState(false);
    const [applyingMissed, setApplyingMissed] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [unlockedDays, setUnlockedDays] = useState([]); // days unlocked for editing
    const [savingDay, setSavingDay] = useState(null);

    const fetchGoals = useCallback(() => {
        api.get('/goals').then(res => setGoals(res.data)).catch(() => toast.error('Failed to load goals'));
    }, []);

    useEffect(() => {
        api.get('/goals').then(res => setGoals(res.data)).catch(() => toast.error('Failed to load goals')).finally(() => setLoading(false));
    }, []);

    const handleToggle = async (goalId, day) => {
        const goal = goals.find(g => g._id === goalId);
        if (!goal) return;
        const pa = goal.pointsApplied;
        const alreadySaved = pa && (typeof pa === 'object') && (pa[String(day)] !== undefined || (pa.get && pa.get(String(day)) !== undefined));
        if (alreadySaved) return;
        const current = goal.completions?.[String(day)] || false;
        try {
            const res = await api.put(`/goals/${goalId}/toggle`, { day, completed: !current });
            setGoals(prev => prev.map(g => g._id === goalId ? res.data : g));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleSaveDay = async (day) => {
        if (day === today) setSaving(true); else setSavingDay(day);
        try {
            const res = await api.put('/goals/save-all/day', { day });
            const pts = res.data.pointsAdded;
            toast.success(`Day ${day} saved! ${pts >= 0 ? '+' : ''}${pts} pts`);
            setUnlockedDays(prev => prev.filter(d => d !== day));
            fetchGoals();
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
            setSavingDay(null);
        }
    };

    const handleEditDay = async (day) => {
        setEditingDay(day);
        try {
            const res = await api.put('/goals/edit-day', { day });
            toast.success(`Day ${day} unlocked for editing (${res.data.pointsReversed} pts reversed)`);
            setGoals(res.data.goals);
            setUnlockedDays(prev => [...prev, day]);
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to unlock day');
        } finally {
            setEditingDay(null);
        }
    };

    const handleApplyMissed = async () => {
        setApplyingMissed(true);
        try {
            const res = await api.post('/goals/apply-missed');
            toast.success(`Missed days applied! ${res.data.penaltyApplied} pts`);
            fetchGoals();
            refreshUser();
        } catch (err) {
            toast.error('Failed to apply missed');
        } finally {
            setApplyingMissed(false);
        }
    };

    const handleAddGoal = async () => {
        if (!addTitle.trim()) return toast.error('Enter a goal title');
        try {
            const res = await api.post('/goals', { title: addTitle.trim(), priority: addPriority });
            setGoals(prev => [...prev, res.data]);
            setAddTitle('');
            toast.success('Goal added!');
        } catch { toast.error('Failed to add goal'); }
    };

    const handleDelete = async (goalId) => {
        try {
            await api.delete(`/goals/${goalId}`);
            setGoals(prev => prev.filter(g => g._id !== goalId));
            toast.success('Goal removed');
        } catch { toast.error('Failed to delete'); }
    };

    const priorityColor = { high: 'var(--orange)', medium: 'var(--green)', low: 'var(--blue)' };
    const priorityLabel = { high: 'H', medium: 'M', low: 'L' };

    // Check if a day has any saved goals
    const isDaySaved = (day) => {
        return goals.some(g => {
            const pa = g.pointsApplied;
            if (!pa) return false;
            return pa[String(day)] !== undefined || (pa.get && pa.get(String(day)) !== undefined);
        });
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

    // Visual Dashboard Calculations
    const totalGoals = goals.length;
    const todayDone = goals.filter(g => {
        const val = g.completions?.get ? g.completions.get(String(today)) : g.completions?.[String(today)];
        return val === true;
    }).length;
    const todayPercent = totalGoals === 0 ? 0 : Math.round((todayDone / totalGoals) * 100);

    const weekStart = Math.max(1, today - 6);
    let weekTotal = 0;
    let weekDone = 0;
    for (let d = weekStart; d <= today; d++) {
        if (!blacklistedDates.includes(d)) {
            weekTotal += totalGoals;
            weekDone += goals.filter(g => {
                const val = g.completions?.get ? g.completions.get(String(d)) : g.completions?.[String(d)];
                return val === true;
            }).length;
        }
    }
    const weekPercent = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);

    return (
        <div className="page">
            <div className="goals-header">
                <h2 className="page-title neon-green">Goals</h2>
                {isDisabled && (
                    <div className="badge badge-orange" style={{ marginBottom: 12 }}>⚠️ Scoring disabled — data is tracked but no points awarded</div>
                )}
                
                {/* VISUAL DASHBOARD */}
                {goals.length > 0 && (
                    <div className="visual-dashboard card">
                        <div className="dashboard-metrics">
                            <div className="metric-box">
                                <div className="progress-ring">
                                    <svg viewBox="0 0 36 36" className="circular-chart green">
                                        <path className="circle-bg"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path className="circle"
                                            strokeDasharray={`${todayPercent}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <text x="18" y="20.35" className="percentage">{todayPercent}%</text>
                                    </svg>
                                </div>
                                <div className="metric-info">
                                    <h4>Today's Progress</h4>
                                    <p>{todayDone} of {totalGoals} Goals Done</p>
                                </div>
                            </div>

                            <div className="metric-box">
                                <div className="metric-info">
                                    <h4>Weekly Overview (Last 7 Days)</h4>
                                    <p>{weekDone} of {weekTotal} Goals Done</p>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill neon-orange-bg" style={{ width: `${weekPercent}%` }}></div>
                                </div>
                                <span className="progress-bar-text">{weekPercent}%</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="goals-actions">
                    <div className="goals-add-bar">
                        <input className="input" style={{ flex: 1, minWidth: 140 }} placeholder="New goal..." value={addTitle}
                            onChange={e => setAddTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGoal()} />
                        <select className="select" style={{ width: 100 }} value={addPriority} onChange={e => setAddPriority(e.target.value)}>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <button className="btn btn-green" onClick={handleAddGoal}><PlusCircle size={16} /></button>
                    </div>
                    <div className="goals-save-bar">
                        <button className="btn btn-ghost btn-sm" onClick={handleApplyMissed} disabled={applyingMissed || isDisabled} title="Apply -pts for all unchecked past days">
                            {applyingMissed ? <span className="spinner"></span> : <AlertTriangle size={14} />} Penalise Missed
                        </button>
                        <button className="btn btn-orange" onClick={() => handleSaveDay(today)} disabled={saving}>
                            {saving ? <span className="spinner"></span> : <Save size={16} />} Save Today
                        </button>
                    </div>
                </div>
            </div>

            {goals.length === 0 ? (
                <div className="empty-state"><p>No goals yet. Add your first goal above! 🎯</p></div>
            ) : (
                <div className="goals-grid-wrapper">
                    <div className="goals-grid" style={{ gridTemplateColumns: `220px repeat(${daysInMonth}, 48px)` }}>
                        {/* HEADER ROW */}
                        <div className="grid-cell header-cell goal-title-cell">Goal</div>
                        {days.map(d => {
                            const isBlack = blacklistedDates.includes(d);
                            const saved = isDaySaved(d);
                            return (
                                <div key={d} className={`grid-cell header-cell day-header ${d === today ? 'today' : ''} ${isBlack ? 'blacklisted-header' : ''}`}>
                                    <span>{d}</span>
                                    {saved && d <= today && !isBlack && (
                                        <button
                                            className="edit-day-btn"
                                            title={`Edit day ${d}`}
                                            onClick={() => handleEditDay(d)}
                                            disabled={editingDay === d}
                                        >
                                            <Pencil size={10} />
                                        </button>
                                    )}
                                    {!saved && unlockedDays.includes(d) && !isBlack && (
                                        <button
                                            className="edit-day-btn"
                                            title={`Save day ${d}`}
                                            onClick={() => handleSaveDay(d)}
                                            disabled={savingDay === d}
                                            style={{ color: 'var(--green)' }}
                                        >
                                            <Save size={10} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* GOAL ROWS */}
                        {goals.map(goal => (
                            <div key={goal._id} style={{ display: 'contents' }}>
                                <div className="grid-cell goal-title-cell">
                                    <div className="goal-info">
                                        <span className="priority-dot" style={{ background: priorityColor[goal.priority] }} title={goal.priority}>{priorityLabel[goal.priority]}</span>
                                        <span className="goal-name">{goal.title}</span>
                                        <button className="icon-btn" onClick={() => handleDelete(goal._id)}><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                {days.map(d => {
                                    const completed = goal.completions?.[String(d)];
                                    const pointsApplied = goal.pointsApplied?.[String(d)];
                                    const isSaved = pointsApplied !== undefined && pointsApplied !== null;
                                    const isBlack = blacklistedDates.includes(d);
                                    const isFuture = d > today;

                                    let cellClass = 'checkbox-cell';
                                    if (isBlack) cellClass += ' blacklisted';
                                    else if (completed && isSaved) cellClass += ' checked';
                                    else if (isSaved && !completed) cellClass += ' missed';
                                    else if (completed) cellClass += ' checked pending';
                                    else if (isFuture) cellClass += ' future';
                                    else if (d < today && !isSaved) cellClass += ' missed';

                                    return (
                                        <div key={`cell-${goal._id}-${d}`} className="grid-cell">
                                            <div className={cellClass} onClick={() => !isBlack && handleToggle(goal._id, d)}>
                                                {isBlack && <span style={{ fontSize: 10, color: 'var(--blue)' }}>—</span>}
                                                {!isBlack && completed && <Check size={13} color={isSaved ? '#000' : 'var(--green)'} strokeWidth={3} />}
                                                {!isBlack && isSaved && (
                                                    <span className="points-badge" style={{ color: pointsApplied >= 0 ? 'var(--green)' : '#ff5050' }}>
                                                        {pointsApplied > 0 ? '+' : ''}{pointsApplied}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LEGEND */}
            <div className="goals-legend">
                <div className="legend-row"><div className="checkbox-cell checked" style={{ width: 20, height: 20 }}><Check size={11} color="#000" /></div><span>Done & Saved</span></div>
                <div className="legend-row"><div className="checkbox-cell pending" style={{ width: 20, height: 20 }}><Check size={11} color="var(--green)" /></div><span>Checked (unsaved)</span></div>
                <div className="legend-row"><div className="checkbox-cell missed" style={{ width: 20, height: 20 }}></div><span>Missed</span></div>
                <div className="legend-row"><div className="checkbox-cell blacklisted" style={{ width: 20, height: 20 }}><span style={{ fontSize: 10 }}>—</span></div><span>Blacklisted day</span></div>
            </div>
        </div>
    );
}

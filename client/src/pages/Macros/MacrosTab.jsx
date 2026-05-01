import { useState, useEffect } from 'react';
import { Utensils, AlertCircle, AlertTriangle, Pencil, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Macros.css';

export default function MacrosTab() {
    const { user, refreshUser } = useAuth();
    const today = user?.effectiveDay || new Date().getDate();
    const isDisabled = user?.disabledSections?.macros;
    const blacklistedDates = user?.settings?.blacklistedDates || [];

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [setup, setSetup] = useState({ targetProtein: 150, targetCarbs: 250, targetFats: 70 });
    const [daily, setDaily] = useState({ protein: 0, carbs: 0, fats: 0 });
    const [savingSetup, setSavingSetup] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [applyingMissed, setApplyingMissed] = useState(false);
    // Edit state
    const [editDay, setEditDay] = useState(null);
    const [editVals, setEditVals] = useState({ protein: 0, carbs: 0, fats: 0 });
    const [editSaving, setEditSaving] = useState(false);

    useEffect(() => {
        api.get('/macros').then(res => setData(res.data)).catch(() => toast.error('Failed to load macros')).finally(() => setLoading(false));
    }, []);

    const handleSetup = async () => {
        setSavingSetup(true);
        try {
            const res = await api.post('/macros/setup', setup);
            setData(res.data);
            toast.success('Macro targets set!');
        } catch { toast.error('Failed to save'); } finally { setSavingSetup(false); }
    };

    const handleCalculate = async () => {
        setCalculating(true);
        try {
            const res = await api.post('/macros/log', { day: today, ...daily });
            toast.success(`Macros logged! ${res.data.pointsAdded >= 0 ? '+' : ''}${res.data.pointsAdded} pts`);
            const updated = await api.get('/macros');
            setData(updated.data);
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log macros');
        } finally { setCalculating(false); }
    };

    const handleApplyMissed = async () => {
        setApplyingMissed(true);
        try {
            const res = await api.post('/macros/apply-missed');
            if (res.data.penaltyApplied) {
                toast.success(`${res.data.penaltyApplied} pts applied for missed days`);
                const updated = await api.get('/macros');
                setData(updated.data);
                refreshUser();
            } else {
                toast('No missed days to penalise ✓');
            }
        } catch {
            toast.error('Failed to apply missed');
        } finally { setApplyingMissed(false); }
    };

    const startEdit = (log) => {
        setEditDay(log.day);
        setEditVals({ protein: log.protein, carbs: log.carbs, fats: log.fats });
    };

    const handleEdit = async () => {
        setEditSaving(true);
        try {
            const res = await api.put('/macros/edit', { day: editDay, ...editVals });
            toast.success(`Day ${editDay} updated! ${res.data.pointsDelta >= 0 ? '+' : ''}${res.data.pointsDelta} pts change`);
            const updated = await api.get('/macros');
            setData(updated.data);
            refreshUser();
            setEditDay(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to edit');
        } finally { setEditSaving(false); }
    };

    const todayLog = data?.logs?.find(l => l.day === today);
    const totalCalc = (p, c, f) => p * 4 + c * 4 + f * 9;

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

    return (
        <div className="page">
            <h2 className="page-title neon-orange">Macros Tracker</h2>
            {isDisabled && (
                <div className="badge badge-orange" style={{ marginBottom: 12 }}>⚠️ Scoring disabled — data is tracked but no points awarded</div>
            )}

            <div className="macros-layout">
                {/* TARGETS */}
                <div className="card card-glow-orange">
                    <h3 className="card-section-title neon-orange"><Utensils size={16} /> Monthly Targets</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                        {['targetProtein', 'targetCarbs', 'targetFats'].map((key) => (
                            <div className="form-group" key={key}>
                                <label className="form-label">{key.replace('target', '')} (g)</label>
                                <input className="input" type="number" min={0}
                                    value={data?.setupDone ? data[key] : setup[key]}
                                    onChange={e => setSetup(s => ({ ...s, [key]: Number(e.target.value) }))}
                                    disabled={data?.setupDone} />
                            </div>
                        ))}
                        {data?.setupDone && (
                            <div className="macros-target-display">
                                <div className="macro-bar protein-bar">
                                    <span>Protein</span><strong>{data.targetProtein}g</strong>
                                </div>
                                <div className="macro-bar carbs-bar">
                                    <span>Carbs</span><strong>{data.targetCarbs}g</strong>
                                </div>
                                <div className="macro-bar fats-bar">
                                    <span>Fats</span><strong>{data.targetFats}g</strong>
                                </div>
                                <div className="macro-cals">
                                    ~{totalCalc(data.targetProtein, data.targetCarbs, data.targetFats)} kcal/day target
                                </div>
                            </div>
                        )}
                        {!data?.setupDone && (
                            <button className="btn btn-orange" onClick={handleSetup} disabled={savingSetup} style={{ justifyContent: 'center' }}>
                                {savingSetup ? <span className="spinner"></span> : null} Set Targets
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    {/* TODAY INPUT */}
                    <div className="card card-glow-orange" style={{ marginBottom: 16 }}>
                        <h3 className="card-section-title neon-orange">Log Today — Day {today}</h3>
                        {todayLog ? (
                            <div className="sleep-result animate-fade-in" style={{ marginTop: 16 }}>
                                <div className="sleep-result-row"><span>Protein:</span><strong>{todayLog.protein}g</strong></div>
                                <div className="sleep-result-row"><span>Carbs:</span><strong>{todayLog.carbs}g</strong></div>
                                <div className="sleep-result-row"><span>Fats:</span><strong>{todayLog.fats}g</strong></div>
                                <div className="sleep-result-row">
                                    <span>Points:</span>
                                    <strong style={{ color: todayLog.points >= 0 ? 'var(--green)' : '#ff5050' }}>
                                        {todayLog.points >= 0 ? '+' : ''}{todayLog.points}
                                    </strong>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                                {[['protein', 'Protein'], ['carbs', 'Carbs'], ['fats', 'Fats']].map(([key, label]) => (
                                    <div className="form-group" key={key}>
                                        <label className="form-label">{label} (g)</label>
                                        <input className="input" type="number" min={0} value={daily[key]}
                                            onChange={e => setDaily(d => ({ ...d, [key]: Number(e.target.value) }))} />
                                    </div>
                                ))}
                                {!data?.setupDone && (
                                    <div className="alert-warning"><AlertCircle size={14} /> Set monthly targets first</div>
                                )}
                                <div className="macro-preview">
                                    <span>~{totalCalc(daily.protein, daily.carbs, daily.fats)} kcal</span>
                                </div>
                                <button className="btn btn-orange" disabled={calculating || !data?.setupDone} onClick={handleCalculate} style={{ justifyContent: 'center' }}>
                                    {calculating ? <span className="spinner"></span> : null} Calculate Points
                                </button>
                            </div>
                        )}
                    </div>

                    {/* POINTS GUIDE */}
                    <div className="card">
                        <h3 className="card-section-title" style={{ color: 'var(--text-secondary)' }}>Points Guide (Total Deviation)</h3>
                        <div className="points-guide" style={{ marginTop: 12 }}>
                            <div className="guide-row"><span className="guide-pts neon-green">+5</span><span>Total deviation ≤ 10g</span></div>
                            <div className="guide-row"><span className="guide-pts neon-blue">+2</span><span>Total deviation ≤ 30g</span></div>
                            <div className="guide-row"><span className="guide-pts neon-green">+1</span><span>Deviation 31-49g</span></div>
                            <div className="guide-row"><span className="guide-pts" style={{ color: '#ff5050' }}>-5</span><span>Total deviation ≥ 50g</span></div>
                            <div className="guide-row"><span className="guide-pts" style={{ color: '#ff5050' }}>-5</span><span>Didn't log macros that day</span></div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={handleApplyMissed} disabled={applyingMissed || isDisabled}>
                            {applyingMissed ? <span className="spinner"></span> : <AlertTriangle size={14} />} Penalise Missed Days
                        </button>
                    </div>
                </div>
            </div>

            {/* MONTHLY LOG */}
            {data?.logs?.length > 0 && (
                <div className="card" style={{ marginTop: 4 }}>
                    <h3 className="card-section-title" style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>Monthly Log</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Day</th><th>Protein</th><th>Carbs</th><th>Fats</th><th>Points</th><th></th></tr>
                            </thead>
                            <tbody>
                                {[...data.logs].sort((a, b) => a.day - b.day).map(l => (
                                    editDay === l.day ? (
                                        <tr key={l.day}>
                                            <td>Day {l.day}</td>
                                            {['protein', 'carbs', 'fats'].map(k => (
                                                <td key={k}>
                                                    <input className="input" type="number" min={0} value={editVals[k]}
                                                        onChange={e => setEditVals(v => ({ ...v, [k]: Number(e.target.value) }))}
                                                        style={{ width: 70, padding: '4px 8px', fontSize: 12 }} />
                                                </td>
                                            ))}
                                            <td>—</td>
                                            <td style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-orange btn-sm" onClick={handleEdit} disabled={editSaving}>
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
                                            <td>{l.protein}g</td>
                                            <td>{l.carbs}g</td>
                                            <td>{l.fats}g</td>
                                            <td style={{ color: l.points >= 0 ? 'var(--green)' : '#ff5050', fontWeight: 700 }}>
                                                {l.points >= 0 ? '+' : ''}{l.points}
                                            </td>
                                            <td>
                                                {(l.protein > 0 || l.carbs > 0 || l.fats > 0) && (
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

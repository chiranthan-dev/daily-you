import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, RotateCcw, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

const RULES = [
    {
        section: 'Goals',
        color: 'var(--green)',
        rows: [
            { pts: '+4', desc: 'High-priority goal completed before deadline' },
            { pts: '-6', desc: 'High-priority goal missed' },
            { pts: '+2', desc: 'Medium-priority goal completed' },
            { pts: '-3', desc: 'Medium-priority goal missed' },
            { pts: '+1', desc: 'Low-priority goal completed' },
            { pts: '-2', desc: 'Low-priority goal missed' },
            { pts: '-5', desc: 'No check-in for first time on any day (per section)' },
        ],
    },
    {
        section: 'Sleep',
        color: 'var(--blue)',
        rows: [
            { pts: '+5', desc: 'Within 15 min of your target sleep duration' },
            { pts: '+3', desc: 'Within 1h of your target' },
            { pts: '+2', desc: 'Within 1.5h of your target' },
            { pts: '-5', desc: '>1.5h deviation from target' },
            { pts: '-5', desc: 'Didn\'t log sleep for a past day' },
        ],
    },
    {
        section: 'Macros',
        color: 'var(--orange)',
        rows: [
            { pts: '+5', desc: 'Total macro deviation ≤ 10g' },
            { pts: '+2', desc: 'Total deviation ≤ 30g' },
            { pts: '+1', desc: 'Deviation 31–49g' },
            { pts: '-5', desc: 'Total deviation ≥ 50g' },
            { pts: '-5', desc: 'Didn\'t log macros for a past day' },
        ],
    },
    {
        section: 'Shop / Items',
        color: '#aaa',
        rows: [
            { pts: '🧊', desc: 'Freeze Card (15 pts) — Blocks all negative points for that day' },
            { pts: '🔵', desc: 'Blacklisted dates — shown in blue, no points applied' },
        ],
    },
];

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [deadlineTime, setDeadlineTime] = useState(user?.settings?.deadlineTime || '23:59');
    const [blacklistedDates, setBlacklistedDates] = useState((user?.settings?.blacklistedDates || []).join(', '));
    const [saving, setSaving] = useState(false);
    const [resetModal, setResetModal] = useState(false);
    const [keepGoals, setKeepGoals] = useState(true);
    const [keepSleep, setKeepSleep] = useState(true);
    const [keepMacros, setKeepMacros] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [showRules, setShowRules] = useState(false);

    // Section disable state
    const [sections, setSections] = useState({
        goals: user?.disabledSections?.goals ?? false,
        sleep: user?.disabledSections?.sleep ?? false,
        macros: user?.disabledSections?.macros ?? false,
    });
    const [savingSections, setSavingSections] = useState(false);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const parsedDates = blacklistedDates.split(',').map(d => d.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 31);
            await api.put('/user/settings', { deadlineTime, blacklistedDates: parsedDates });
            await refreshUser();
            toast.success('Settings saved!');
        } catch { toast.error('Failed to save settings'); } finally { setSaving(false); }
    };

    const handleSaveSections = async () => {
        setSavingSections(true);
        try {
            await api.put('/user/disabled-sections', {
                goals: sections.goals,
                sleep: sections.sleep,
                macros: sections.macros,
            });
            await refreshUser();
            toast.success('Section settings saved!');
        } catch { toast.error('Failed to save'); } finally { setSavingSections(false); }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await api.post('/user/monthly-reset', { keepGoals, keepSleep, keepMacros });
            await refreshUser();
            toast.success('Monthly reset complete!');
            setResetModal(false);
        } catch { toast.error('Reset failed'); } finally { setResetting(false); }
    };

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
                <h2 className="page-title neon-orange" style={{ margin: 0 }}><Settings size={20} /> Settings</h2>
            </div>

            <div className="settings-grid">
                {/* DEADLINE */}
                <div className="card card-glow-orange">
                    <h3 className="settings-section-title" style={{ color: 'var(--orange)' }}>Daily Deadline</h3>
                    <p className="settings-desc">Goals lock after this time. Save before deadline for best results.</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
                        <input className="input" type="time" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} />
                        <button className="btn btn-orange" onClick={handleSaveSettings} disabled={saving}>
                            {saving ? <span className="spinner"></span> : <Save size={16} />} Save
                        </button>
                    </div>
                </div>

                {/* BLACKLISTED DATES */}
                <div className="card card-glow-orange">
                    <h3 className="settings-section-title" style={{ color: 'var(--blue)' }}>Blacklisted Dates</h3>
                    <p className="settings-desc">These days are skipped (shown in <span style={{ color: 'var(--blue)' }}>blue</span>) — no points added or deducted.</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <input className="input" placeholder="1, 15, 25..." value={blacklistedDates} onChange={e => setBlacklistedDates(e.target.value)} />
                        <button className="btn btn-orange" onClick={handleSaveSettings} disabled={saving}>
                            {saving ? <span className="spinner"></span> : <Save size={16} />} Save
                        </button>
                    </div>
                    {user?.settings?.blacklistedDates?.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {user.settings.blacklistedDates.map(d => <span key={d} className="badge badge-blue">Day {d}</span>)}
                        </div>
                    )}
                </div>

                {/* SECTION TRACKING */}
                <div className="card settings-full-width" style={{ borderColor: 'rgba(255,107,0,0.3)' }}>
                    <h3 className="settings-section-title" style={{ color: 'var(--orange)' }}>Section Tracking</h3>
                    <p className="settings-desc">Disable scoring for sections you don't want to track. Disabled sections are also excluded from Friends leaderboard scores.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                        {[
                            ['goals', 'Goals Scoring', 'var(--green)'],
                            ['sleep', 'Sleep Scoring', 'var(--blue)'],
                            ['macros', 'Macros Scoring', 'var(--orange)'],
                        ].map(([key, label, color]) => (
                            <label key={key} className="toggle-row">
                                <div>
                                    <span style={{ fontWeight: 700, color }}>{label}</span>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {sections[key] ? '⚠️ Currently DISABLED — no points or penalties' : '✓ Active — points are tracked'}
                                    </p>
                                </div>
                                <div className={`toggle ${!sections[key] ? 'on' : ''}`} onClick={() => setSections(s => ({ ...s, [key]: !s[key] }))}>
                                    <div className="toggle-thumb"></div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button className="btn btn-orange" style={{ marginTop: 20, justifyContent: 'center' }} onClick={handleSaveSections} disabled={savingSections}>
                        {savingSections ? <span className="spinner"></span> : <Save size={16} />} Save Section Settings
                    </button>
                </div>

                {/* RULES */}
                <div className="card settings-full-width">
                    <button className="rules-toggle" onClick={() => setShowRules(!showRules)}>
                        <Info size={16} /> Points Rules Reference
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>{showRules ? '▲ hide' : '▼ show'}</span>
                    </button>
                    {showRules && (
                        <div className="rules-grid animate-fade-in">
                            {RULES.map(group => (
                                <div key={group.section} className="rules-section" style={{ borderColor: `${group.color}44` }}>
                                    <h4 style={{ color: group.color, fontSize: 13, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {group.section}
                                    </h4>
                                    {group.rows.map((r, i) => (
                                        <div key={i} className="rules-row">
                                            <span className="rules-pts" style={{ color: r.pts.startsWith('+') ? 'var(--green)' : r.pts.startsWith('-') ? '#ff5050' : group.color }}>
                                                {r.pts}
                                            </span>
                                            <span className="rules-desc">{r.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MONTHLY RESET */}
                <div className="card settings-full-width" style={{ borderColor: 'rgba(255,80,80,0.3)' }}>
                    <h3 className="settings-section-title" style={{ color: '#ff5050' }}>Monthly Reset</h3>
                    <p className="settings-desc">Use at start of a new month. Positive points carry forward; negative resets to 0.</p>
                    <button className="btn btn-ghost" style={{ marginTop: 16, borderColor: 'rgba(255,80,80,0.4)', color: '#ff5050' }}
                        onClick={() => setResetModal(true)}>
                        <RotateCcw size={16} /> Start Monthly Reset
                    </button>
                </div>
            </div>

            {/* RESET MODAL */}
            {resetModal && (
                <div className="modal-backdrop" onClick={() => setResetModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title neon-orange">Monthly Reset</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                            Choose what to keep for next month:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                            {[['keepGoals', 'Keep Goals list', keepGoals, setKeepGoals], ['keepSleep', 'Keep Sleep targets', keepSleep, setKeepSleep], ['keepMacros', 'Keep Macro targets', keepMacros, setKeepMacros]].map(([id, label, val, setter]) => (
                                <label key={id} className="toggle-row">
                                    <span>{label}</span>
                                    <div className={`toggle ${val ? 'on' : ''}`} onClick={() => setter(!val)}><div className="toggle-thumb"></div></div>
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setResetModal(false)}>Cancel</button>
                            <button className="btn" style={{ flex: 1, background: 'rgba(255,80,80,0.1)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.3)', justifyContent: 'center' }}
                                onClick={handleReset} disabled={resetting}>
                                {resetting ? <span className="spinner"></span> : <RotateCcw size={16} />} Confirm Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

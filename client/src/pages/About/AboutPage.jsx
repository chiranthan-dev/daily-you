import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const features = [
    {
        icon: '🎯',
        title: 'Goals Tracker',
        color: 'green',
        desc: 'Set daily goals across three priority tiers — High, Medium, and Low. Each comes with automatic point rewards for completion and penalties for misses. Blacklist specific days to skip without punishment.',
        points: ['+4 pts high complete', '−6 pts high miss', '+2 med / +1 low']
    },
    {
        icon: '🌙',
        title: 'Sleep Tracker',
        color: 'blue',
        desc: 'Log nightly sleep and wake times. The system scores you based on both total duration and how close you hit your personal sleep target. Aim for 8h at your exact target for maximum points.',
        points: ['+5 pts exact target', '+3 pts any 8h', '−5 pts < 6.5h']
    },
    {
        icon: '🍽️',
        title: 'Macros Tracker',
        color: 'orange',
        desc: 'Track daily protein, carbs, and fat intake against your personal targets. The scoring rewards accuracy — the closer you hit your targets, the more points you earn.',
        points: ['+5 pts ≤10g deviation', '+2 pts ≤30g', '−5 pts ≥50g']
    },
    {
        icon: '✅',
        title: 'Tasks',
        color: 'green',
        desc: 'Simple habit checklist for recurring daily tasks. Mark things done, build streaks. Unlike goals, tasks are lightweight with no penalty system — just clean, fast tracking.',
        points: ['Recurring daily tasks', 'No penalty system', 'Build daily habits']
    },
    {
        icon: '🛒',
        title: 'Shop & Items',
        color: 'orange',
        desc: 'Spend your hard-earned points in the shop. Buy a Freeze Card to protect yourself from penalties on a rough day. More items planned for future updates.',
        points: ['🧊 Freeze Card — 15 pts', 'No penalties for 1 day', 'More items coming']
    },
    {
        icon: '👥',
        title: 'Friends & Leaderboard',
        color: 'blue',
        desc: 'Add friends via username, see their point totals, and compete on a live leaderboard. Accountability through friendly competition drives real consistency.',
        points: ['Add friends by username', 'Live points leaderboard', 'Multiplayer accountability']
    }
];

const stack = [
    { name: 'React 19', icon: '⚛️', detail: 'Frontend UI with Vite' },
    { name: 'Node.js + Express', icon: '🟢', detail: 'REST API backend' },
    { name: 'MongoDB Atlas', icon: '🍃', detail: 'Cloud database' },
    { name: 'JWT Auth', icon: '🔐', detail: '30-day secure tokens' },
    { name: 'Vercel', icon: '▲', detail: 'Frontend + backend hosting' },
    { name: 'Lucide Icons', icon: '✨', detail: 'Icon system' }
];

export default function AboutPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Daily You — Project Overview';
    }, []);

    return (
        <div className="about-page">
            {/* NAV */}
            <nav className="about-nav">
                <span className="about-nav-logo">DAILY YOU</span>
                <div className="about-nav-links">
                    <a href="#features">Features</a>
                    <a href="#points">Points</a>
                    <a href="#stack">Stack</a>
                    <button className="btn-about-cta" onClick={() => navigate('/login')}>
                        Open App →
                    </button>
                </div>
            </nav>

            {/* HERO */}
            <section className="about-hero">
                <div className="about-hero-bg" />
                <div className="about-hero-content">
                    <div className="about-badge">🏆 Gamified Self-Improvement</div>
                    <h1 className="about-title">
                        DAILY <span className="about-title-green">YOU</span>
                    </h1>
                    <p className="about-subtitle">
                        Track goals, sleep, macros, and tasks every day.<br />
                        Earn points. Lose points. Stay accountable.
                    </p>
                    <div className="about-hero-btns">
                        <button className="btn-about-primary" onClick={() => navigate('/register')}>
                            Get Started Free
                        </button>
                        <button className="btn-about-secondary" onClick={() => navigate('/login')}>
                            Sign In
                        </button>
                    </div>
                    <div className="about-hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value neon-g">4</span>
                            <span className="hero-stat-label">Tracking Categories</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <span className="hero-stat-value neon-o">∞</span>
                            <span className="hero-stat-label">Daily Goals</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <span className="hero-stat-value neon-b">1</span>
                            <span className="hero-stat-label">Shop Item (so far!)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="about-section">
                <div className="about-container">
                    <h2 className="about-section-title">How It Works</h2>
                    <p className="about-section-sub">
                        Daily You uses a points-based accountability system. Complete your daily targets and earn points.
                        Miss them and lose points. Simple, honest, effective.
                    </p>
                    <div className="about-how-grid">
                        <div className="about-how-step">
                            <div className="how-step-num neon-g">01</div>
                            <h3>Set Your Targets</h3>
                            <p>Configure daily goals, sleep targets, macro goals, and habit tasks in Settings.</p>
                        </div>
                        <div className="about-how-arrow">→</div>
                        <div className="about-how-step">
                            <div className="how-step-num neon-o">02</div>
                            <h3>Track Every Day</h3>
                            <p>Log your progress before the daily deadline. Miss the deadline and auto-penalties kick in.</p>
                        </div>
                        <div className="about-how-arrow">→</div>
                        <div className="about-how-step">
                            <div className="how-step-num neon-b">03</div>
                            <h3>Earn & Spend Points</h3>
                            <p>Watch your points balance grow. Buy Freeze Cards to protect rough days. Compete with friends.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="about-section" id="features">
                <div className="about-container">
                    <h2 className="about-section-title">Features</h2>
                    <div className="about-features-grid">
                        {features.map(f => (
                            <div key={f.title} className={`about-feature-card border-${f.color}`}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3 className={`feature-title neon-${f.color === 'green' ? 'g' : f.color === 'orange' ? 'o' : 'b'}`}>
                                    {f.title}
                                </h3>
                                <p className="feature-desc">{f.desc}</p>
                                <div className="feature-points">
                                    {f.points.map(p => (
                                        <span key={p} className="feature-point-badge">{p}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* POINTS TABLE */}
            <section className="about-section" id="points">
                <div className="about-container">
                    <h2 className="about-section-title">Points System</h2>
                    <p className="about-section-sub">
                        Every action has a consequence. Here's the full breakdown.
                    </p>
                    <div className="about-points-tables">
                        {[
                            {
                                title: '🎯 Goals', color: 'green', rows: [
                                    ['High goal completed', '+4'],
                                    ['High goal missed', '−6'],
                                    ['Medium goal completed', '+2'],
                                    ['Medium goal missed', '−3'],
                                    ['Low goal completed', '+1'],
                                    ['Low goal missed', '−2'],
                                ]
                            },
                            {
                                title: '🌙 Sleep', color: 'blue', rows: [
                                    ['Exact target + 8h sleep', '+5'],
                                    ['Any 8h sleep', '+3'],
                                    ['Within ±1.5h of target', '+2'],
                                    ['< 6.5h or major deviation', '−5'],
                                ]
                            },
                            {
                                title: '🍽️ Macros', color: 'orange', rows: [
                                    ['Deviation ≤ 10g per macro', '+5'],
                                    ['Deviation ≤ 30g', '+2'],
                                    ['Deviation 31–49g', '+1'],
                                    ['Deviation ≥ 50g', '−5'],
                                ]
                            },
                        ].map(t => (
                            <div key={t.title} className={`about-points-card border-${t.color}`}>
                                <h3 className="points-card-title">{t.title}</h3>
                                <table className="points-table">
                                    <tbody>
                                        {t.rows.map(([label, val]) => (
                                            <tr key={label}>
                                                <td>{label}</td>
                                                <td className={val.startsWith('+') ? 'pts-pos' : 'pts-neg'}>{val}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                    <div className="about-note">
                        💡 Monthly reset — positive points carry forward, negative resets to 0. Use a 🧊 Freeze Card to skip any single day's penalties.
                    </div>
                </div>
            </section>

            {/* TECH STACK */}
            <section className="about-section" id="stack">
                <div className="about-container">
                    <h2 className="about-section-title">Tech Stack</h2>
                    <div className="about-stack-grid">
                        {stack.map(s => (
                            <div key={s.name} className="about-stack-card">
                                <span className="stack-icon">{s.icon}</span>
                                <span className="stack-name">{s.name}</span>
                                <span className="stack-detail">{s.detail}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta-section">
                <div className="about-container" style={{ textAlign: 'center' }}>
                    <h2 className="about-cta-title">Ready to level up?</h2>
                    <p className="about-cta-sub">Start tracking today. No excuses.</p>
                    <button className="btn-about-primary btn-xl" onClick={() => navigate('/register')}>
                        Create Your Account
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="about-footer">
                <span className="neon-g">DAILY YOU</span>
                <span>Built with React, Node.js &amp; MongoDB</span>
                <span style={{ color: '#444' }}>© 2025</span>
            </footer>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Target, Moon, Utensils, CheckSquare, Settings, ShoppingBag, Package, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

function Countdown({ deadlineTime }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calc = () => {
            const now = new Date();
            const [h, m] = (deadlineTime || '23:59').split(':').map(Number);
            const deadline = new Date(now);
            deadline.setHours(h, m, 0, 0);
            if (deadline <= now) deadline.setDate(deadline.getDate() + 1);
            const diff = deadline - now;
            const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            setTimeLeft(`${hh}:${mm}:${ss}`);
        };
        calc();
        const interval = setInterval(calc, 1000);
        return () => clearInterval(interval);
    }, [deadlineTime]);

    return <span className="countdown">{timeLeft}</span>;
}

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const isFrozen = user?.activeFreeze === now.toISOString().split('T')[0];

    const tabs = [
        { to: '/goals', icon: <Target size={16} />, label: 'Goals' },
        { to: '/sleep', icon: <Moon size={16} />, label: 'Sleep' },
        { to: '/macros', icon: <Utensils size={16} />, label: 'Macros' },
        { to: '/tasks', icon: <CheckSquare size={16} />, label: 'Tasks' }
    ];

    const floatIcons = [
        { to: '/settings', icon: <Settings size={20} />, label: 'Settings', color: 'var(--orange)' },
        { to: '/shop', icon: <ShoppingBag size={20} />, label: 'Shop', color: 'var(--green)' },
        { to: '/items', icon: <Package size={20} />, label: 'Garage', color: 'var(--blue)' },
        { to: '/friends', icon: <Users size={20} />, label: 'Friends', color: 'var(--orange)' },
        { to: '/wheel', icon: <Target size={20} />, label: 'Wheel', color: '#ff5050' }
    ];

    return (
        <div className="app-wrapper">
            {/* HEADER */}
            <header className="app-header">
                <div className="header-left">
                    <span className="points-label">Points</span>
                    <span className={`points-value ${user?.totalPoints >= 0 ? 'neon-green glow-green' : 'negative'}`}>
                        {user?.totalPoints ?? 0}
                    </span>
                </div>
                <div className="header-center">
                    <h1 className="app-title neon-green glow-green">DAILY YOU</h1>
                    <span className={`status-pill ${isFrozen ? 'frozen' : 'active'}`}>
                        {isFrozen ? '🧊 FROZEN' : '● ACTIVE'}
                    </span>
                </div>
                <div className="header-right">
                    <span className="header-date">{dateStr}</span>
                    <Countdown deadlineTime={user?.settings?.deadlineTime} />
                    <button className="btn btn-ghost btn-sm" onClick={logout} style={{ marginTop: 4 }}>Logout</button>
                </div>
            </header>

            {/* TAB BAR */}
            <nav className="tab-bar">
                {tabs.map(t => (
                    <NavLink key={t.to} to={t.to} className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                        {t.icon} {t.label}
                    </NavLink>
                ))}
            </nav>

            {/* MAIN CONTENT */}
            <main className="app-main">
                <Outlet />
            </main>

            {/* FLOATING MENU */}
            <div className="float-menu">
                {floatIcons.map(fi => (
                    <button key={fi.to} className="float-btn tooltip" data-tip={fi.label}
                        style={{ '--float-color': fi.color }}
                        onClick={() => navigate(fi.to)}>
                        {fi.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}

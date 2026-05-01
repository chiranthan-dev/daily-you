import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Auth.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            login(res.data.token, res.data.user);
            toast.success(`Welcome back, ${res.data.user.username}!`);
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="auth-card animate-fade-in">
                <div className="auth-logo">
                    <h1 className="neon-green glow-green">DAILY YOU</h1>
                    <p>Gamified Self-Improvement</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="input" type="email" placeholder="you@email.com" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="input" type="password" placeholder="••••••••" value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                    </div>
                    <button className="btn btn-green btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                        {loading ? <span className="spinner"></span> : <LogIn size={16} />}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="auth-footer">New here? <Link to="/register">Create account</Link></p>
            </div>
        </div>
    );
}

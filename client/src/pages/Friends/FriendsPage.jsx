import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Plus, LogIn, LogOut, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Friends.css';

export default function FriendsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(''); // 'create' | 'join'
    const [createPwd, setCreatePwd] = useState('');
    const [joinId, setJoinId] = useState('');
    const [joinPwd, setJoinPwd] = useState('');
    const [actioning, setActioning] = useState(false);

    useEffect(() => {
        api.get('/friends/game').then(res => setGameData(res.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!createPwd) return toast.error('Enter a password');
        setActioning(true);
        try {
            const res = await api.post('/friends/create', { password: createPwd });
            toast.success(`Game created! ID: ${res.data.gameId}`);
            const updated = await api.get('/friends/game');
            setGameData(updated.data);
            setMode('');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActioning(false); }
    };

    const handleJoin = async () => {
        if (!joinId || !joinPwd) return toast.error('Enter game ID and password');
        setActioning(true);
        try {
            await api.post('/friends/join', { gameId: joinId.toUpperCase(), password: joinPwd });
            const updated = await api.get('/friends/game');
            setGameData(updated.data);
            setMode('');
            toast.success('Joined game!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActioning(false); }
    };

    const handleLeave = async () => {
        try {
            await api.post('/friends/leave');
            setGameData({ game: null, members: [] });
            toast.success('Left game');
        } catch { toast.error('Failed to leave'); }
    };

    const copyId = () => {
        navigator.clipboard.writeText(gameData.gameId);
        toast.success('Game ID copied!');
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
                <h2 className="page-title neon-orange" style={{ margin: 0 }}><Users size={20} /> Friends</h2>
            </div>

            {/* IN A GAME */}
            {gameData?.gameId ? (
                <>
                    <div className="friends-game-header">
                        <div>
                            <p className="friends-label">GAME ID</p>
                            <div className="game-id-display">
                                <span className="neon-green glow-green">{gameData.gameId}</span>
                                <button className="icon-btn" onClick={copyId}><Copy size={14} /></button>
                            </div>
                        </div>
                        <button className="btn btn-ghost" onClick={handleLeave}><LogOut size={16} /> Leave Game</button>
                    </div>

                    <div className="card" style={{ marginTop: 20 }}>
                        <h3 className="settings-section-title" style={{ marginBottom: 16, color: 'var(--orange)' }}>
                            Leaderboard — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>Today's Progress</th>
                                        <th>Goals Pts</th>
                                        <th>Sleep Pts</th>
                                        <th>Macro Pts</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...gameData.members].sort((a, b) => b.totalPoints - a.totalPoints).map((member, idx) => (
                                        <tr key={member.userId} className={member.username === user?.username ? 'highlight-row' : ''}>
                                            <td>
                                                <span className={`rank-badge ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : ''}`}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{member.username}</strong>
                                                {member.username === user?.username && <span className="badge badge-green" style={{ marginLeft: 8, fontSize: 10 }}>YOU</span>}
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                {member.todayCompleted > 0 || member.todayMissed > 0 ? (
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        <span style={{ color: 'var(--green)' }}>{member.todayCompleted} done</span>,{' '}
                                                        <span style={{ color: '#ff5050' }}>{member.todayMissed} missed</span>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>No progress yet</span>
                                                )}
                                            </td>
                                            <td style={{ color: member.goalPoints >= 0 ? 'var(--green)' : '#ff5050' }}>
                                                {member.goalPoints >= 0 ? '+' : ''}{member.goalPoints}
                                            </td>
                                            <td style={{ color: member.sleepPoints >= 0 ? 'var(--blue)' : '#ff5050' }}>
                                                {member.sleepPoints >= 0 ? '+' : ''}{member.sleepPoints}
                                            </td>
                                            <td style={{ color: member.macroPoints >= 0 ? 'var(--orange)' : '#ff5050' }}>
                                                {member.macroPoints >= 0 ? '+' : ''}{member.macroPoints}
                                            </td>
                                            <td style={{ fontSize: 16, fontWeight: 800, color: member.totalPoints >= 0 ? 'var(--green)' : '#ff5050' }}>
                                                {member.totalPoints}
                                            </td>
                                            <td>
                                                <span className={`badge ${member.totalPoints >= 0 ? 'badge-green' : 'badge-red'}`}>
                                                    {member.totalPoints >= 0 ? '✓ On Track' : '✗ At Risk'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* NOT IN A GAME */
                <div className="friends-no-game">
                    <div className="friends-empty-icon">👥</div>
                    <h3 className="neon-orange">No Active Game</h3>
                    <p>Create or join a game to track accountability with friends.</p>

                    <div className="friends-actions">
                        <button className="btn btn-orange" onClick={() => setMode(mode === 'create' ? '' : 'create')}>
                            <Plus size={16} /> Create Game
                        </button>
                        <button className="btn btn-blue" onClick={() => setMode(mode === 'join' ? '' : 'join')}>
                            <LogIn size={16} /> Join Game
                        </button>
                    </div>

                    {mode === 'create' && (
                        <div className="friends-form card animate-fade-in">
                            <h4 className="neon-orange" style={{ marginBottom: 14 }}>Create New Game</h4>
                            <div className="form-group">
                                <label className="form-label">Game Password</label>
                                <input className="input" type="password" placeholder="Share this with friends" value={createPwd}
                                    onChange={e => setCreatePwd(e.target.value)} />
                            </div>
                            <button className="btn btn-orange" style={{ marginTop: 14, justifyContent: 'center', width: '100%' }}
                                onClick={handleCreate} disabled={actioning}>
                                {actioning ? <span className="spinner"></span> : null} Create
                            </button>
                        </div>
                    )}

                    {mode === 'join' && (
                        <div className="friends-form card animate-fade-in">
                            <h4 className="neon-blue" style={{ marginBottom: 14 }}>Join Existing Game</h4>
                            <div className="form-group">
                                <label className="form-label">Game ID</label>
                                <input className="input" placeholder="e.g. AB12CD" value={joinId}
                                    onChange={e => setJoinId(e.target.value)} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label className="form-label">Password</label>
                                <input className="input" type="password" placeholder="••••••••" value={joinPwd}
                                    onChange={e => setJoinPwd(e.target.value)} />
                            </div>
                            <button className="btn btn-blue" style={{ marginTop: 14, justifyContent: 'center', width: '100%' }}
                                onClick={handleJoin} disabled={actioning}>
                                {actioning ? <span className="spinner"></span> : null} Join
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="card" style={{ marginTop: 24, borderColor: 'rgba(255,107,0,0.2)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', marginBottom: 8 }}>🏆 Game Objective</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    End the month with a positive total score. Anyone who finishes negative must complete a real-life challenge agreed upon by the group.
                </p>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Shop.css';

export default function ShopPage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [buying, setBuying] = useState(null);
    const [justBought, setJustBought] = useState(null);

    useEffect(() => {
        api.get('/shop/items').then(res => setItems(res.data));
    }, []);

    const handleBuy = async (item) => {
        if (user.totalPoints < item.cost) return toast.error(`Not enough points! Need ${item.cost} pts`);
        setBuying(item.id);
        try {
            await api.post('/shop/buy', { itemId: item.id });
            await refreshUser();
            setJustBought(item.id);
            setTimeout(() => setJustBought(null), 2000); // Remove halo after 2s
            toast.success(`Purchased ${item.name}!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Purchase failed');
        } finally {
            setBuying(null);
        }
    };

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
                <h2 className="page-title neon-green" style={{ margin: 0 }}><ShoppingBag size={20} /> Shop</h2>
                <span className="points-chip neon-green">{user?.totalPoints ?? 0} pts</span>
            </div>

            <div className="shop-grid">
                {items.map(item => {
                    const canAfford = (user?.totalPoints ?? 0) >= item.cost;
                    const isHalo = justBought === item.id;
                    return (
                        <div key={item.id} className={`shop-card ${canAfford ? '' : 'cant-afford'} ${isHalo ? 'halo-animation' : ''}`}>
                            <div className="shop-icon" style={{ color: item.color, textShadow: `0 0 20px ${item.color}` }}>
                                {item.icon?.startsWith('/') ? (
                                    <img src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    item.icon
                                )}
                            </div>
                            <h3 className="shop-item-name" style={{ color: item.color }}>
                                {item.name}
                                {item.rarity && <span className="rarity-badge" style={{ borderColor: item.color }}>{item.rarity}</span>}
                            </h3>
                            <p className="shop-item-desc">{item.description}</p>
                            <div className="shop-item-footer">
                                <span className="shop-cost" style={{ color: item.color }}>
                                    {item.cost} pts
                                </span>
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        background: canAfford ? `rgba(${item.color === '#00D4FF' ? '0,212,255' : '57,255,20'}, 0.15)` : 'transparent',
                                        color: canAfford ? item.color : 'var(--text-muted)',
                                        border: `1px solid ${canAfford ? item.color : 'var(--border)'}`,
                                    }}
                                    onClick={() => handleBuy(item)}
                                    disabled={!canAfford || buying === item.id}
                                >
                                    {buying === item.id ? <span className="spinner"></span> : 'Buy'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

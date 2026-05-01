import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ItemsPage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [shopItems, setShopItems] = useState([]);
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isFrozen = user?.activeFreeze === todayStr;

    useEffect(() => {
        api.get('/shop/items').then(res => setShopItems(res.data)).catch(() => {});
    }, []);

    const items = user?.ownedItems || [];

    const handleActivate = async (itemId) => {
        if (isFrozen && itemId === 'freeze_card') {
            return toast.error('Freeze is already active today!');
        }
        try {
            await api.post('/items/activate', { itemId });
            await refreshUser();
            toast.success('Item activated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to activate');
        }
    };

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
                <h2 className="page-title neon-blue" style={{ margin: 0 }}><Package size={20} /> Garage & Inventory</h2>
            </div>

            {isFrozen && (
                <div className="freeze-active-banner">
                    🧊 FREEZE ACTIVE TODAY — No penalties will be applied
                </div>
            )}

            {items.length === 0 ? (
                <div className="empty-state">
                    <p>Your garage is empty. Visit the Shop to buy some cars! 🏎️</p>
                    <button className="btn btn-blue" style={{ marginTop: 16 }} onClick={() => navigate('/shop')}>Go to Shop</button>
                </div>
            ) : (
                <div className="items-grid">
                    {items.map(item => {
                        const meta = shopItems.find(s => s.id === item.itemId) || { icon: '📦', name: item.name, color: 'var(--green)', description: '', type: 'unknown' };
                        const isCar = meta.type === 'car';
                        
                        return (
                            <div key={item.itemId} className="item-card" style={{ borderColor: `${meta.color}55`, flex: isCar ? '1 1 100%' : 'initial', flexDirection: isCar ? 'row' : 'column', alignItems: 'center' }}>
                                <div className="item-icon" style={{ color: meta.color, textShadow: `0 0 20px ${meta.color}`, width: isCar ? '150px' : 'auto', height: isCar ? '100px' : 'auto' }}>
                                    {typeof meta.icon === 'string' && meta.icon.startsWith('/') ? (
                                        <img src={meta.icon} alt={meta.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        meta.icon
                                    )}
                                </div>
                                <div className="item-info" style={{ textAlign: isCar ? 'left' : 'center', flex: 1 }}>
                                    <h3 className="item-name" style={{ color: meta.color }}>
                                        {meta.name}
                                        {meta.rarity && <span className="rarity-badge" style={{ borderColor: meta.color }}>{meta.rarity}</span>}
                                    </h3>
                                    <p className="item-desc">{meta.description || meta.desc}</p>
                                    <span className="item-qty">x{item.quantity} owned</span>
                                </div>
                                {!isCar && (
                                    <button className="btn btn-sm" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}66` }}
                                        onClick={() => handleActivate(item.itemId)}>
                                        <Zap size={14} /> Activate
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

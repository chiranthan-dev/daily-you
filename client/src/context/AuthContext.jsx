import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dy_user')); } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('dy_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/user/me')
                .then(res => setUser(res.data))
                .catch(() => logout())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (tokenVal, userData) => {
        localStorage.setItem('dy_token', tokenVal);
        localStorage.setItem('dy_user', JSON.stringify(userData));
        setToken(tokenVal);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('dy_token');
        localStorage.removeItem('dy_user');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/user/me');
            setUser(res.data);
            localStorage.setItem('dy_user', JSON.stringify(res.data));
            return res.data;
        } catch (err) {
            console.error('Failed to refresh user', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

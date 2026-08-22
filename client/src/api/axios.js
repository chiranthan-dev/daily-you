import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    // The API is hosted on a free tier that sleeps when idle. A cold start can
    // take up to a minute, so allow generous time before giving up.
    timeout: 90000
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('dy_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        // Only a genuine 401 means the session is invalid. A network error or
        // timeout must never destroy a perfectly good token.
        if (err.response?.status === 401) {
            localStorage.removeItem('dy_token');
            localStorage.removeItem('dy_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// True when the request never reached the server (offline, timeout, cold start).
export const isNetworkError = (err) => !err.response;

export const friendlyError = (err, fallback = 'Something went wrong') => {
    if (isNetworkError(err)) {
        return 'Could not reach the server. It may be waking up — try again in a moment.';
    }
    return err.response?.data?.message || fallback;
};

// Nudges the sleeping server awake. Fired on app load so the backend is warm
// by the time the user finishes typing their credentials.
export const warmUpServer = () => {
    api.get('/health', { timeout: 90000 }).catch(() => { });
};

export default api;

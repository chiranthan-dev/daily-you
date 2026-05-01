import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import GoalsTab from './pages/Goals/GoalsTab';
import SleepTab from './pages/Sleep/SleepTab';
import MacrosTab from './pages/Macros/MacrosTab';
import TasksTab from './pages/Tasks/TasksTab';
import SettingsPage from './pages/Settings/SettingsPage';
import ShopPage from './pages/Shop/ShopPage';
import ItemsPage from './pages/Items/ItemsPage';
import FriendsPage from './pages/Friends/FriendsPage';
import AboutPage from './pages/About/AboutPage';
import WheelPage from './pages/Wheel/WheelPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
      <span style={{ color: '#39FF14', fontWeight: 600, letterSpacing: '0.1em' }}>LOADING DAILY YOU</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/goals" replace />} />
        <Route path="goals" element={<GoalsTab />} />
        <Route path="sleep" element={<SleepTab />} />
        <Route path="macros" element={<MacrosTab />} />
        <Route path="tasks" element={<TasksTab />} />
      </Route>
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
      <Route path="/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
      <Route path="/wheel" element={<ProtectedRoute><WheelPage /></ProtectedRoute>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

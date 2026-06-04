import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store';
import Layout from './components/Layout';
import Login from './pages/auth/LoginPage';
import Register from './pages/auth/RegisterPage';
import Dashboard from './pages/dashboard/DashboardPage';
import Wallet from './pages/dashboard/WalletPage';
import Dice from './pages/games/DicePage';
import Slots from './pages/games/SlotsPage';
import Roulette from './pages/games/RoulettePage';
import Blackjack from './pages/games/BlackjackPage';
import Admin from './pages/admin/AdminPage';

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { token, fetchUser, user } = useAuth();

  useEffect(() => {
    if (token) fetchUser();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/games/dice" element={<Dice />} />
          <Route path="/games/slots" element={<Slots />} />
          <Route path="/games/roulette" element={<Roulette />} />
          <Route path="/games/blackjack" element={<Blackjack />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

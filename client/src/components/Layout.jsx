import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useWallet } from '../store';
import { useEffect } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { balance, fetchBalance } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchBalance();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <NavLink to="/" className="navbar-brand">🎰 Casino</NavLink>
          <div className="navbar-links">
            {user && <span className="navbar-balance">{balance.toLocaleString()} F</span>}
            <NavLink to="/" end>Accueil</NavLink>
            <NavLink to="/wallet">Portefeuille</NavLink>
            <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Jeux</span>
            <NavLink to="/games/dice">Dés</NavLink>
            <NavLink to="/games/slots">Slots</NavLink>
            <NavLink to="/games/roulette">Roulette</NavLink>
            <NavLink to="/games/blackjack">Blackjack</NavLink>
            {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
            <button onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </nav>
      <main className="container page">
        <Outlet />
      </main>
    </div>
  );
}

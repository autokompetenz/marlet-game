import { useState } from 'react';
import { useAuth } from '../../store';
import { useNavigate, Link } from 'react-router-dom';
import GoogleLogin from '../../components/GoogleLogin';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Bienvenue</h1>
        <p>Connectez-vous pour jouer</p>

        <GoogleLogin />

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ffffff20' }} />
            <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>ou</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ffffff20' }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
        </form>
        <div className="auth-link">
          Pas de compte ? <Link to="/register">Inscrivez-vous</Link>
        </div>
      </div>
    </div>
  );
}

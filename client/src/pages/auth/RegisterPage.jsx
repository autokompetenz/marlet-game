import { useState } from 'react';
import { useAuth } from '../../store';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ username: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 6) return setError('6 caractères minimum');
    try {
      await register(form.username, form.phone, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Inscription</h1>
        <p>Créez votre compte</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Téléphone MTN</label>
            <input className="form-input" placeholder="+229XXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Confirmer</label>
            <input className="form-input" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
          </div>
          {error && <p style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block">S'inscrire</button>
        </form>
        <div className="auth-link">
          Déjà inscrit ? <Link to="/login">Connectez-vous</Link>
        </div>
      </div>
    </div>
  );
}

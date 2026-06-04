import { useEffect, useState } from 'react';
import { useAuth } from '../../store';
import api from '../../services/api';

export default function AdminPage() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchTxns();
  }, []);

  const fetchStats = async () => {
    const { data } = await api.get('/admin/stats');
    setStats(data);
  };
  const fetchUsers = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };
  const fetchTxns = async () => {
    const { data } = await api.get('/admin/transactions');
    setTxns(data);
  };

  return (
    <div>
      <h1>🔧 Administration</h1>
      <div className="navbar-links" style={{ marginBottom: 24 }}>
        <button className={`btn btn-sm ${tab === 'stats' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('stats')}>Statistiques</button>
        <button className={`btn btn-sm ${tab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('users')}>Utilisateurs</button>
        <button className={`btn btn-sm ${tab === 'txns' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('txns')}>Transactions</button>
      </div>

      {tab === 'stats' && stats && (
        <div className="card-grid card-grid-4">
          {[
            { label: 'Utilisateurs', value: stats.users },
            { label: 'Transactions', value: stats.transactions },
            { label: 'Parties jouées', value: stats.bets },
            { label: 'Mises totales', value: `${stats.totalBetAmount?.toLocaleString()} F` },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{s.label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr><th>Nom</th><th>Téléphone</th><th>Rôle</th><th>Solde</th><th>Inscription</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.phone}</td>
                  <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-yellow' : 'badge-green'}`}>{u.role}</span></td>
                  <td>{u.balance.toLocaleString()} F</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{new Date(u.createdAt).toLocaleString('fr')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'txns' && (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr><th>User</th><th>Type</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id}>
                  <td>{t.user?.username}</td>
                  <td>{t.type}</td>
                  <td>{t.amount.toLocaleString()} F</td>
                  <td><span className={`badge ${t.status === 'COMPLETED' ? 'badge-green' : t.status === 'PENDING' ? 'badge-yellow' : 'badge-red'}`}>{t.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{new Date(t.createdAt).toLocaleString('fr')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

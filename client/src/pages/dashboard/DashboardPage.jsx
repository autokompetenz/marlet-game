import { useNavigate } from 'react-router-dom';
import { useWallet, useGames } from '../../store';
import { useEffect } from 'react';

const GAMES = [
  { path: '/games/dice', icon: '🎲', name: 'Lancer de dés', desc: 'Misez sur pair, impair ou un chiffre' },
  { path: '/games/slots', icon: '🎰', name: 'Machine à sous', desc: 'Tentez le jackpot !' },
  { path: '/games/roulette', icon: '🎡', name: 'Roulette', desc: 'Rouge, noir, numéro...' },
  { path: '/games/blackjack', icon: '🃏', name: 'Blackjack', desc: 'Battez le croupier !' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { balance, fetchBalance } = useWallet();
  const { history, fetchHistory } = useGames();

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

  return (
    <div>
      <div className="wallet-card card">
        <p style={{ color: 'var(--text2)' }}>Solde disponible</p>
        <div className="wallet-balance">{balance.toLocaleString()} FCFA</div>
        <div className="wallet-actions">
          <button className="btn btn-primary" onClick={() => navigate('/wallet')}>Dépôt / Retrait</button>
        </div>
      </div>

      <h1 style={{ marginBottom: 16 }}>🎮 Choisissez un jeu</h1>
      <div className="game-grid">
        {GAMES.map(g => (
          <button key={g.path} className="game-btn" onClick={() => navigate(g.path)}>
            <span className="icon">{g.icon}</span>
            <strong>{g.name}</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: 6 }}>{g.desc}</p>
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16 }}>Historique</h2>
          <div className="table-wrap card">
            <table>
              <thead>
                <tr><th>Jeu</th><th>Mise</th><th>Gain</th><th>Résultat</th><th>Date</th></tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map(b => (
                  <tr key={b.id}>
                    <td>{b.game.label}</td>
                    <td>{b.amount.toLocaleString()} F</td>
                    <td>{b.payout.toLocaleString()} F</td>
                    <td><span className={`badge ${b.status === 'WON' ? 'badge-green' : 'badge-red'}`}>{b.status === 'WON' ? 'Gagné' : 'Perdu'}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{new Date(b.createdAt).toLocaleString('fr')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

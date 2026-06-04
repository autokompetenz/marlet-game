import { useState } from 'react';
import { useGames, useWallet } from '../../store';

const BETS = [
  { value: 'red', label: 'Rouge', payout: 'x2' },
  { value: 'black', label: 'Noir', payout: 'x2' },
  { value: 'even', label: 'Pair', payout: 'x2' },
  { value: 'odd', label: 'Impair', payout: 'x2' },
  { value: 'low', label: '1-18', payout: 'x2' },
  { value: 'high', label: '19-36', payout: 'x2' },
  { value: 'dozen1', label: '1-12', payout: 'x3' },
  { value: 'dozen2', label: '13-24', payout: 'x3' },
  { value: 'dozen3', label: '25-36', payout: 'x3' },
];

export default function RoulettePage() {
  const [amount, setAmount] = useState(100);
  const [betType, setBetType] = useState('red');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { playRoulette } = useGames();
  const { fetchBalance } = useWallet();

  const handlePlay = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await playRoulette(amount, [{ type: betType, amount }]);
      setResult(data);
      fetchBalance();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
    setLoading(false);
  };

  const colorClass = result ? (result.color === 'red' ? 'red' : result.color === 'black' ? 'black' : 'green') : '';

  return (
    <div>
      <h1>🎡 Roulette</h1>
      <div className="card">
        <div className="roulette-wheel">
          {result && (
            <>
              <div className={`roulette-number ${colorClass}`}>{result.result}</div>
              <p style={{ marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}>{result.color}</p>
            </>
          )}
          <p style={{ color: 'var(--text2)', marginBottom: 8 }}>Choisissez votre pari</p>
          <div className="roulette-bets">
            {BETS.map(b => (
              <button key={b.value} className={betType === b.value ? 'selected' : ''} onClick={() => setBetType(b.value)}>
                {b.label} <small>({b.payout})</small>
              </button>
            ))}
          </div>
          <div className="form-group">
            <label>Mise (min 20 FCFA)</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 20)} min={20} />
          </div>
          <button className="btn btn-primary btn-block" onClick={handlePlay} disabled={loading}>
            {loading ? 'Rotation...' : '🎡 Lancer la roulette'}
          </button>
        </div>
        {result && (
          <div className={`result-popup ${result.totalPayout > 0 ? 'result-win' : 'result-lose'}`}>
            <p className="result-amount">{result.totalPayout > 0 ? `+${result.totalPayout.toLocaleString()} FCFA` : `0 FCFA`}</p>
          </div>
        )}
      </div>
    </div>
  );
}

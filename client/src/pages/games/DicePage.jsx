import { useState } from 'react';
import { useGames, useWallet } from '../../store';

const PREDICTIONS = [
  { value: 'over7', label: 'Plus de 7', payout: 'x2' },
  { value: 'under7', label: 'Moins de 7', payout: 'x2' },
  { value: 'exact7', label: 'Exactement 7', payout: 'x5' },
  { value: 'double', label: 'Double', payout: 'x8' },
];

export default function DicePage() {
  const [amount, setAmount] = useState(100);
  const [prediction, setPrediction] = useState('over7');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { playDice } = useGames();
  const { fetchBalance } = useWallet();

  const handlePlay = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await playDice(amount, prediction);
      setResult(data);
      fetchBalance();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>🎲 Lancer de dés</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Mise (min 20 FCFA)</label>
          <input className="form-input" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 20)} min={20} />
        </div>
        <p style={{ marginBottom: 8, color: 'var(--text2)' }}>Prédiction</p>
        <div className="dice-predictions">
          {PREDICTIONS.map(p => (
            <button key={p.value} className={prediction === p.value ? 'selected' : ''} onClick={() => setPrediction(p.value)}>
              {p.label} <small style={{ opacity: 0.7 }}>({p.payout})</small>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={handlePlay} disabled={loading}>
          {loading ? 'Lancement...' : 'Lancer les dés'}
        </button>
      </div>

      {result && (
        <div className={`card result-popup ${result.win ? 'result-win' : 'result-lose'}`}>
          <div className="dice-result">
            <div className="die">{result.dice[0]}</div>
            <div className="die">{result.dice[1]}</div>
          </div>
          <p>Somme: <strong>{result.sum}</strong></p>
          <p>Multiplicateur: <strong>x{result.multiplier}</strong></p>
          <p className="result-amount">{result.win ? `+${result.payout.toLocaleString()} FCFA` : `${result.payout.toLocaleString()} FCFA`}</p>
        </div>
      )}
    </div>
  );
}

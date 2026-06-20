import { useState } from 'react';
import { useGames, useWallet } from '../../store';

export default function SlotsPage() {
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const { playSlots } = useGames();
  const { fetchBalance } = useWallet();

  const handlePlay = async () => {
    setLoading(true);
    setSpinning(true);
    setResult(null);
    setTimeout(async () => {
      try {
        const { data } = await playSlots(amount);
        setResult(data);
        fetchBalance();
      } catch (err) {
        alert(err.response?.data?.error || 'Erreur');
      }
      setLoading(false);
      setSpinning(false);
    }, 800);
  };

  return (
    <div>
      <h1>🎰 Machine à sous</h1>
      <div className="card">
        <div className="slot-machine">
          <div className="slot-reels">
            {(result?.reels || ['🍒', '🍒', '🍒']).map((s, i) => (
              <div key={i} className={`slot-reel ${spinning ? 'spinning' : ''}`}>
                {spinning ? '🎰' : s}
              </div>
            ))}
          </div>
          {result && !spinning && (
            <div className={`result-popup ${result.win ? 'result-win' : 'result-lose'}`}>
              <p>Multiplicateur: <strong>x{result.multiplier}</strong></p>
              <p className="result-amount">{result.win ? `+${result.payout.toLocaleString()} FCFA` : `0 FCFA`}</p>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Mise (min 20 FCFA)</label>
          <input className="form-input" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 20)} min={20} />
        </div>
        <button className="btn btn-gold btn-block" onClick={handlePlay} disabled={loading}>
          {loading ? '🎰 Tourne...' : '🎰 Jouer'}
        </button>
      </div>
    </div>
  );
}

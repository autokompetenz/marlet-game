import { useState } from 'react';
import { useGames, useWallet } from '../../store';

function cardColor(suit) {
  return (suit === '♥' || suit === '♦') ? 'red' : '';
}

export default function BlackjackPage() {
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { playBlackjack } = useGames();
  const { fetchBalance } = useWallet();

  const handlePlay = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await playBlackjack(amount);
      setResult(data);
      fetchBalance();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
    setLoading(false);
  };

  const resultClass = result?.result === 'blackjack' || result?.result === 'win' ? 'result-win' :
    result?.result === 'push' ? '' : 'result-lose';

  return (
    <div>
      <h1>🃏 Blackjack</h1>
      <div className="card">
        <div className="blackjack-table">
          {result && (
            <>
              <p style={{ color: 'var(--text2)', marginBottom: 4 }}>Croupier: {result.dealerScore}</p>
              <div className="blackjack-hand">
                {result.dealer.map((c, i) => {
                  const suit = c.slice(-1);
                  const rank = c.slice(0, -1);
                  return <div key={i} className={`blackjack-card ${cardColor(suit)}`}>{rank}<span>{suit}</span></div>;
                })}
              </div>
              <p style={{ margin: '16px 0 4px' }}>Vous: <strong>{result.playerScore}</strong></p>
              <div className="blackjack-hand">
                {result.player.map((c, i) => {
                  const suit = c.slice(-1);
                  const rank = c.slice(0, -1);
                  return <div key={i} className={`blackjack-card ${cardColor(suit)}`}>{rank}<span>{suit}</span></div>;
                })}
              </div>
              <div className={`result-popup ${resultClass}`} style={{ display: 'inline-block', margin: '12px auto' }}>
                <p className="result-amount">
                  {result.result === 'blackjack' ? '🎉 BLACKJACK !' :
                   result.result === 'win' ? '🏆 Vous avez gagné !' :
                   result.result === 'push' ? '🤝 Égalité' :
                   result.result === 'bust' ? '💥 Dépassé !' : '😔 Perdu'}
                </p>
                <p>Gain: {result.payout.toLocaleString()} FCFA</p>
              </div>
            </>
          )}
          <div className="form-group" style={{ maxWidth: 200, margin: '16px auto' }}>
            <label>Mise (min 20 FCFA)</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 20)} min={20} />
          </div>
          <button className="btn btn-primary" onClick={handlePlay} disabled={loading}>
            {loading ? '🃏 Distribution...' : '🃏 Distribuer'}
          </button>
        </div>
      </div>
    </div>
  );
}

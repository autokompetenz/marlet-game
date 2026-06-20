import { useState, useEffect } from 'react';
import { useWallet } from '../../store';

export default function Wallet() {
  const { balance, transactions, fetchBalance, fetchTransactions, deposit, confirmDeposit, withdraw } = useWallet();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('deposit');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleDeposit = async () => {
    setMsg('');
    setLoading(true);
    try {
      const res = await deposit(parseFloat(amount));
      if (res.fedapay_token) {
        const FedaPay = window['FedaPay'];
        if (FedaPay) {
          try {
            await FedaPay.checkout({ token: res.fedapay_token });
            await confirmDeposit(res.fedapay_id);
            setMsg('Dépôt effectué avec succès !');
          } catch {
            setMsg('Paiement annulé ou échoué');
          }
        } else {
          setMsg('FedaPay non disponible');
        }
      } else {
        setMsg(`Dépôt de ${amount} FCFA effectué !`);
      }
      setAmount('');
      await fetchBalance();
      await fetchTransactions();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erreur');
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    setMsg('');
    setLoading(true);
    try {
      await withdraw(parseFloat(amount), phone);
      setMsg('Retrait effectué !');
      setAmount('');
      setPhone('');
      await fetchBalance();
      await fetchTransactions();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erreur');
    }
    setLoading(false);
  };

  const handleSubmit = mode === 'deposit' ? handleDeposit : handleWithdraw;

  return (
    <div>
      <div className="wallet-card card">
        <p style={{ color: 'var(--text2)' }}>Solde</p>
        <div className="wallet-balance">{balance.toLocaleString()} FCFA</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>{mode === 'deposit' ? 'Dépôt' : 'Retrait'}</h2>
        <div className="wallet-actions" style={{ marginBottom: 16 }}>
          <button className={`btn ${mode === 'deposit' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('deposit')}>Dépôt</button>
          <button className={`btn ${mode === 'withdraw' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('withdraw')}>Retrait</button>
        </div>
        <div className="form-group">
          <label>Montant ({mode === 'deposit' ? 'min 100' : 'min 500'} FCFA)</label>
          <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} min={mode === 'deposit' ? 100 : 500} />
        </div>
        {mode === 'withdraw' && (
          <div className="form-group">
            <label>Numéro Mobile Money</label>
            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+229XXXXXXXX" />
          </div>
        )}
        <button className="btn btn-gold btn-block" onClick={handleSubmit} disabled={loading || !amount || (mode === 'withdraw' && !phone)}>
          {loading ? 'Traitement...' : mode === 'deposit' ? 'Déposer via FedaPay' : 'Retirer via FedaPay'}
        </button>
        {msg && <p style={{ marginTop: 12, color: msg.includes('Erreur') || msg.includes('annulé') || msg.includes('échoué') ? 'var(--accent)' : 'var(--green)', textAlign: 'center' }}>{msg}</p>}
      </div>

      <h2 style={{ marginBottom: 16 }}>Transactions</h2>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr><th>Type</th><th>Montant</th><th>Statut</th><th>Réf.</th><th>Date</th></tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{{ DEPOSIT: 'Dépôt', WITHDRAWAL: 'Retrait', BET: 'Mise', WIN: 'Gain', BONUS: 'Bonus' }[t.type] || t.type}</td>
                <td>{t.amount.toLocaleString()} F</td>
                <td><span className={`badge ${t.status === 'COMPLETED' ? 'badge-green' : t.status === 'PENDING' ? 'badge-yellow' : 'badge-red'}`}>{t.status}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{t.reference?.slice(0, 8)}...</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{new Date(t.createdAt).toLocaleString('fr')}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text2)' }}>Aucune transaction</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

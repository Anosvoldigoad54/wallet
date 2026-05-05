import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setupWallet, getWallet, transact } from '../api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/><path d="M5 12h14"/>
  </svg>
);
const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/>
  </svg>
);
const IconTrendingDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22,17 13.5,8.5 8.5,13.5 2,7"/><polyline points="16,17 22,17 22,11"/>
  </svg>
);
const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

// ─── Setup Page ───────────────────────────────────────────────────────────────
function SetupPage({ onSetup }: { onSetup: (wallet: any) => void }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await setupWallet(name, parseFloat(balance) || 0);
      localStorage.setItem('walletId', data.id);
      onSetup(data);
    } catch {
      alert('Failed to setup wallet. Check your connection.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="animate-fade-up mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <IconWallet />
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
          className="text-3xl tracking-tight text-white">
          Vault
        </h1>
        <p className="text-slate-400 text-sm">Your premium digital wallet</p>
      </div>

      {/* Card */}
      <div className="animate-fade-up-delay-1 glass w-full max-w-md p-8">
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
          className="text-xl text-white mb-1">Create your wallet</h2>
        <p className="text-slate-400 text-sm mb-7">Set up once, access anytime.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Your Name
            </label>
            <input
              type="text"
              required
              className="input-glass"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Initial Balance <span className="normal-case font-normal text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="input-glass pl-8"
                placeholder="0.0000"
                value={balance}
                onChange={e => setBalance(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
                </svg>
                Initializing…
              </span>
            ) : (
              <>
                <IconPlus />
                Initialize Wallet
              </>
            )}
          </button>
        </form>
      </div>

      <p className="animate-fade-up-delay-2 text-slate-600 text-xs mt-6">
        Wallet ID is saved locally in your browser.
      </p>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function Dashboard({ wallet, setWallet }: { wallet: any; setWallet: (w: any) => void }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isCredit, setIsCredit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<'credit' | 'debit' | null>(null);

  const handleTransact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    try {
      const amountNum = isCredit ? parseFloat(amount) : -parseFloat(amount);
      const data = await transact(wallet.id, amountNum, description || (isCredit ? 'Credit' : 'Debit'));
      setWallet((prev: any) => ({ ...prev, balance: data.balance }));
      setFlash(isCredit ? 'credit' : 'debit');
      setTimeout(() => setFlash(null), 1500);
      setAmount('');
      setDescription('');
    } catch {
      alert('Transaction failed.');
    }
    setLoading(false);
  };

  const balanceColor = flash === 'credit'
    ? 'text-emerald-400'
    : flash === 'debit'
    ? 'text-rose-400'
    : 'text-white';

  return (
    <div className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <IconWallet />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
            className="text-xl text-white tracking-tight">Vault</span>
        </div>
        <Link to="/transactions" className="btn-ghost">
          <IconList />
          Transactions
          <IconArrowRight />
        </Link>
      </div>

      {/* Balance Card */}
      <div className="glass animate-fade-up-delay-1 p-8 mb-6 relative overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        <div className="relative z-10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Total Balance</p>
          <div className={`transition-colors duration-500 ${balanceColor}`}>
            <span className="text-slate-400 text-2xl font-light mr-1">₹</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
              className="text-5xl tracking-tight">
              {typeof wallet.balance === 'number' ? wallet.balance.toFixed(4) : wallet.balance}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="text-slate-400 text-sm">{wallet.name}</span>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="glass animate-fade-up-delay-2 p-7">
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
          className="text-base text-white mb-6">New Transaction</h3>

        <form onSubmit={handleTransact} className="space-y-5">
          {/* Toggle */}
          <div className="toggle-wrap">
            <button
              type="button"
              className={`toggle-btn ${isCredit ? 'active-credit' : ''}`}
              onClick={() => setIsCredit(true)}
            >
              <span className="flex items-center justify-center gap-2">
                <IconTrendingUp /> Credit
              </span>
            </button>
            <button
              type="button"
              className={`toggle-btn ${!isCredit ? 'active-debit' : ''}`}
              onClick={() => setIsCredit(false)}
            >
              <span className="flex items-center justify-center gap-2">
                <IconTrendingDown /> Debit
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  className="input-glass pl-8"
                  placeholder="0.0000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Description</label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Recharge"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
                </svg>
                Processing…
              </span>
            ) : (
              `${isCredit ? 'Credit' : 'Debit'} Wallet`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Home (router) ────────────────────────────────────────────────────────────
export default function Home() {
  const [walletId] = useState<string | null>(localStorage.getItem('walletId'));
  const [wallet, setWallet] = useState<any>(null);
  const [checking, setChecking] = useState(!!walletId);

  useEffect(() => {
    if (walletId) {
      getWallet(walletId)
        .then(setWallet)
        .catch(() => {
          localStorage.removeItem('walletId');
          setWallet(null);
        })
        .finally(() => setChecking(false));
    }
  }, [walletId]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
        </svg>
      </div>
    );
  }

  if (!wallet) {
    return <SetupPage onSetup={setWallet} />;
  }

  return <Dashboard wallet={wallet} setWallet={setWallet} />;
}

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTransactions } from '../api';
import { format } from 'date-fns';

// ─── Icons ─────────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconSort = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={active ? '#818cf8' : '#475569'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'asc' || !active
      ? <><path d="M12 20V4"/><path d="m5 11 7-7 7 7"/></>
      : <><path d="M12 4v16"/><path d="m19 13-7 7-7-7"/></>}
  </svg>
);
const IconChevLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
const IconChevRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 17H5a2 2 0 0 0-2 2"/><path d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"/><rect x="9" y="3" width="12" height="7" rx="2"/><rect x="9" y="14" width="12" height="7" rx="2"/>
  </svg>
);

type SortKey = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

const LIMIT = 10;

export default function Transactions() {
  const navigate = useNavigate();
  const walletId = localStorage.getItem('walletId');

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!walletId) { navigate('/'); return; }
    loadPage();
  }, [walletId, skip]);

  const loadPage = async () => {
    if (!walletId) return;
    setLoading(true);
    try {
      const data = await getTransactions(walletId, skip, LIMIT);
      setTransactions(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aVal = sortKey === 'date' ? new Date(a.date).getTime() : a.amount;
      const bVal = sortKey === 'date' ? new Date(b.date).getTime() : b.amount;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [transactions, sortKey, sortDir]);

  const exportCSV = async () => {
    if (!walletId) return;
    try {
      const { getTransactions: fetchAll } = await import('../api');
      const all = await fetchAll(walletId, 0, 100000);
      const rows = [
        ['Transaction ID', 'Wallet ID', 'Amount', 'Balance', 'Description', 'Type', 'Date'],
        ...all.map((r: any) => [
          r._id, r.walletId, r.amount, r.balance,
          `"${r.description || ''}"`, r.type,
          new Date(r.date).toISOString()
        ])
      ];
      const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `transactions_${walletId}.csv`;
      a.click();
    } catch { alert('Export failed.'); }
  };

  if (!walletId) return null;

  return (
    <div className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 animate-fade-up">
        <div className="flex items-center gap-4">
          <Link to="/" className="btn-ghost !px-3 !py-2">
            <IconArrowLeft />
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
              className="text-2xl text-white tracking-tight">Transactions</h1>
            <p className="text-slate-500 text-sm mt-0.5">All wallet activity</p>
          </div>
        </div>
        <button onClick={exportCSV} className="btn-ghost self-start sm:self-auto">
          <IconDownload />
          Export CSV
        </button>
      </div>

      {/* Table Card */}
      <div className="glass animate-fade-up-delay-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Description</th>
                <th>Type</th>
                <th>
                  <button
                    className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort('amount')}
                  >
                    Amount
                    <IconSort active={sortKey === 'amount'} dir={sortDir} />
                  </button>
                </th>
                <th>Balance After</th>
                <th>
                  <button
                    className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    Date
                    <IconSort active={sortKey === 'date'} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
                      </svg>
                      Loading transactions…
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500">
                      <IconEmpty />
                      <p className="text-sm">No transactions yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((tx, i) => (
                  <tr key={tx._id} style={{ animationDelay: `${i * 30}ms` }}>
                    <td>
                      <span className="font-mono text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-md">
                        #{tx._id.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-300 font-medium">{tx.description || '—'}</span>
                    </td>
                    <td>
                      {tx.type === 'CREDIT'
                        ? <span className="badge-credit">↑ Credit</span>
                        : <span className="badge-debit">↓ Debit</span>}
                    </td>
                    <td>
                      <span className={`font-semibold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {tx.type === 'CREDIT' ? '+' : '−'}₹{tx.amount.toFixed(4)}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-300 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        ₹{tx.balance.toFixed(4)}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-500 text-sm">
                        {format(new Date(tx.date), 'MMM d, yyyy')}<br />
                        <span className="text-xs text-slate-600">{format(new Date(tx.date), 'HH:mm:ss')}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05]">
          <span className="text-xs text-slate-500">
            {sorted.length === 0 ? 'No records' : `Showing ${skip + 1}–${skip + sorted.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={skip === 0}
              onClick={() => setSkip(s => Math.max(0, s - LIMIT))}
              className="btn-ghost !px-2.5 !py-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconChevLeft />
            </button>
            <span className="text-xs text-slate-500 px-1">
              {Math.floor(skip / LIMIT) + 1}
            </span>
            <button
              disabled={transactions.length < LIMIT}
              onClick={() => setSkip(s => s + LIMIT)}
              className="btn-ghost !px-2.5 !py-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconChevRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

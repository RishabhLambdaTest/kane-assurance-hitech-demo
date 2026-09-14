'use client';
import './globals.css';
import { ProcurementProvider, useProcurement } from '../context/ProcurementContext';
import Link from 'next/link';

function Header() {
  const { quote, role, setRole, user, requests, mounted } = useProcurement();
  const count = quote.reduce((s, l) => s + l.qty, 0);
  const pending = requests.filter(r => r.status === 'Pending Approval').length;
  return (
    <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <Link href="/" className="text-xl font-bold">
        Nova<span className="text-cyan-400">Tech</span> <span className="text-sm font-normal text-slate-300">Business</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/" className="hover:text-cyan-300">Catalog</Link>
        <Link href="/approvals" className="relative hover:text-cyan-300" aria-label={`Approvals, ${pending} pending`}>
          Approvals
          {mounted && pending > 0 && (
            <span className="ml-1 bg-amber-500 text-slate-900 text-xs font-bold px-1.5 rounded-full">{pending}</span>
          )}
        </Link>
        <Link href="/quote" className="relative hover:text-cyan-300" aria-label={`Quote with ${count} units`}>
          Quote
          {mounted && count > 0 && (
            <span className="ml-1 bg-cyan-500 text-slate-900 text-xs font-bold px-1.5 rounded-full">{count}</span>
          )}
        </Link>
        {mounted && (
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <label htmlFor="role-select" className="text-slate-400">Signed in as</label>
            <select id="role-select" value={role} onChange={e => setRole(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white">
              <option value="buyer">Priya Shah — IT Buyer</option>
              <option value="approver">Marcus Lee — Procurement Manager</option>
            </select>
            <span className="sr-only">Current user: {user.name}</span>
          </div>
        )}
      </nav>
    </header>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><title>NovaTech Business Store</title></head>
      <body className="bg-slate-50 min-h-screen text-slate-900">
        <ProcurementProvider>
          <Header />
          <div className="bg-slate-800 text-slate-300 text-xs px-4 py-1">Account: Acme Corp · Available credit $150,000.00 · Terms Net 30</div>
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </ProcurementProvider>
      </body>
    </html>
  );
}

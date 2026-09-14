'use client';
import { useProcurement } from '../../context/ProcurementContext';
import { money, newOrderNumber } from '../../lib/pricing';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_STYLES = {
  'Pending Approval': 'bg-amber-100 text-amber-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function ApprovalsPage() {
  const { requests, mounted, role } = useProcurement();

  if (!mounted) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Approvals</h1>
      <p className="text-slate-500 mb-6">
        Orders above $25,000 require Procurement Manager approval.
        {role === 'buyer' && ' Switch to Marcus Lee (Procurement Manager) to action requests.'}
      </p>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-slate-500 mb-2">No approval requests yet</p>
          <Link href="/" className="text-cyan-700 hover:underline">Browse Catalog</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => <RequestCard key={r.id} req={r} />)}
        </div>
      )}
    </div>
  );
}

function RequestCard({ req }) {
  const { role, user, setRequests } = useProcurement();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const isPending = req.status === 'Pending Approval';
  const isOwn = req.requestedBy === user.name;
  const canAction = role === 'approver' && isPending && !isOwn;

  const update = (patch) => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, ...patch } : r));

  const approve = () => update({
    status: 'Approved', decidedBy: user.name, decidedAt: new Date().toISOString(), orderNumber: newOrderNumber(),
  });

  const reject = () => {
    if (reason.trim().length < 10) { setError('Rejection reason must be at least 10 characters'); return; }
    update({ status: 'Rejected', decidedBy: user.name, decidedAt: new Date().toISOString(), reason: reason.trim() });
  };

  return (
    <div className="bg-white border rounded-lg p-4" data-testid={`request-${req.id}`}>
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <p className="font-mono font-bold">{req.id}</p>
          <p className="text-sm text-slate-500">Requested by {req.requestedBy} · {new Date(req.submittedAt).toLocaleString('en-US')}</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLES[req.status]}`}>{req.status}</span>
          <p className="font-bold mt-1">{money(req.total)}</p>
        </div>
      </div>

      <ul className="mt-3 text-sm text-slate-700 list-disc pl-5">
        {req.lines.map((l, i) => <li key={i}>{l.name} × {l.qty}{l.config ? ` — ${l.config}` : ''}</li>)}
      </ul>
      <p className="text-sm text-slate-500 mt-1">
        Ship to {req.shipTo?.company}, {req.shipTo?.city} · {req.payment?.type === 'po' ? `PO ${req.payment.poNumber}` : `Card ending ${req.payment?.last4}`}
      </p>

      {req.status === 'Approved' && (
        <p className="mt-3 text-sm text-green-800 bg-green-50 p-2 rounded">Approved by {req.decidedBy}. Order <span className="font-mono font-bold">{req.orderNumber}</span> placed.</p>
      )}
      {req.status === 'Rejected' && (
        <p className="mt-3 text-sm text-red-800 bg-red-50 p-2 rounded">Rejected by {req.decidedBy}: {req.reason}</p>
      )}

      {role === 'approver' && isPending && isOwn && (
        <p className="mt-3 text-sm text-slate-600 bg-slate-100 p-2 rounded">You cannot approve your own request</p>
      )}

      {canAction && !rejecting && (
        <div className="flex gap-2 mt-3">
          <button onClick={approve} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 min-h-[44px]">Approve</button>
          <button onClick={() => setRejecting(true)} className="border border-red-500 text-red-600 px-4 py-2 rounded hover:bg-red-50 min-h-[44px]">Reject</button>
        </div>
      )}

      {canAction && rejecting && (
        <div className="mt-3 space-y-2">
          <label htmlFor={`reason-${req.id}`} className="block text-sm font-medium">Rejection reason <span className="text-red-500">*</span></label>
          <textarea id={`reason-${req.id}`} value={reason} onChange={e => { setReason(e.target.value); setError(''); }}
            rows={2} className="w-full border rounded px-3 py-2" />
          {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button onClick={reject} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 min-h-[44px]">Confirm Rejection</button>
            <button onClick={() => { setRejecting(false); setReason(''); setError(''); }} className="border px-4 py-2 rounded min-h-[44px]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useProcurement } from '../../../context/ProcurementContext';
import StepIndicator from '../../../components/StepIndicator';
import { configSummary, WARRANTIES, ADDONS, APPROVAL_LIMIT, isHardware, money, newOrderNumber } from '../../../lib/pricing';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReviewPage() {
  const ctx = useProcurement();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (ctx.mounted && !ctx.payment) router.push('/checkout/payment'); }, [ctx.mounted, ctx.payment, router]);
  if (!ctx.mounted || !ctx.payment) return null;

  const needsApproval = ctx.orderTotal > APPROVAL_LIMIT;

  const snapshot = () => ({
    lines: ctx.quote.map(l => ({ name: l.product.name, config: configSummary(l.config), qty: l.qty, unit: l.pricing.unit, total: l.pricing.total })),
    shipTo: ctx.shipTo,
    delivery: ctx.delivery,
    payment: ctx.payment,
    total: ctx.orderTotal,
  });

  const submit = () => {
    if (placing) return;
    setPlacing(true);
    setError('');

    setTimeout(() => {
      if (needsApproval) {
        const req = {
          id: 'REQ-' + String(Math.floor(10000 + Math.random() * 90000)),
          status: 'Pending Approval',
          requestedBy: ctx.user.name,
          submittedAt: new Date().toISOString(),
          ...snapshot(),
        };
        ctx.setRequests(prev => [req, ...prev]);
        sessionStorage.setItem('nt_result', JSON.stringify({ kind: 'approval', ...req }));
      } else {
        const failItem = ctx.quote.find(l => l.product.failAtPlacement);
        if (failItem) {
          setError(`Stock allocation failed for ${failItem.product.name}. Remove the item and retry, or return to your quote.`);
          setPlacing(false);
          return;
        }
        sessionStorage.setItem('nt_result', JSON.stringify({ kind: 'order', orderNumber: newOrderNumber(), ...snapshot() }));
      }
      router.push('/checkout/confirmation');
    }, 1200);
  };

  return (
    <div>
      <StepIndicator current="Review" />
      <h1 className="text-xl font-bold mb-4">Order Review</h1>
      <div className="max-w-2xl space-y-4">
        <Section title="Items" editHref="/quote">
          {ctx.quote.map(l => (
            <div key={l.key} className="py-2 border-b last:border-0 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{l.product.name} × {l.qty}</span>
                <span>{money(l.pricing.total)}</span>
              </div>
              {l.config && <p className="text-slate-500">{configSummary(l.config)}</p>}
              <p className="text-slate-500">{money(l.pricing.unit)} / unit{l.pricing.rate > 0 ? ` (${Math.round(l.pricing.rate * 100)}% volume discount)` : ''}</p>
              {isHardware(l.product) && (
                <p className="text-slate-500">
                  {WARRANTIES.find(w => w.id === l.warranty)?.label}
                  {l.addons.map(a => ` · ${ADDONS.find(x => x.id === a)?.label}`).join('')}
                </p>
              )}
            </div>
          ))}
        </Section>

        <Section title="Ship-to site" editHref="/checkout/shipping">
          <p className="text-sm">{ctx.shipTo?.company} — Attn: {ctx.shipTo?.attention}</p>
          <p className="text-sm text-slate-600">{ctx.shipTo?.line1}, {ctx.shipTo?.city}, {ctx.shipTo?.state} {ctx.shipTo?.postal}, {ctx.shipTo?.country}</p>
          {ctx.taxExempt && <p className="text-sm text-green-700">Tax exempt: {ctx.shipTo.taxExemptId}</p>}
        </Section>

        <Section title="Delivery method" editHref="/checkout/shipping">
          <p className="text-sm">{ctx.delivery?.name} — {ctx.delivery?.cost === 0 ? 'FREE' : money(ctx.delivery?.cost)}</p>
          <p className="text-sm text-slate-500">Est. delivery: {ctx.delivery?.deliveryDate}</p>
        </Section>

        <Section title="Payment" editHref="/checkout/payment">
          <p className="text-sm">
            {ctx.payment.type === 'po' ? `Purchase Order ${ctx.payment.poNumber} · ${ctx.payment.terms}` : `${ctx.payment.brand} ending in ${ctx.payment.last4}`}
          </p>
        </Section>

        <div className="bg-white border rounded-lg p-4 text-sm space-y-1">
          <Row label="Hardware (list)" value={money(ctx.hardwareList)} />
          <Row label="Volume discount" value={`-${money(ctx.volumeDiscount)}`} />
          <Row label="Services" value={money(ctx.servicesTotal)} />
          <Row label="Tax" value={money(ctx.tax)} />
          <Row label="Delivery" value={ctx.deliveryCost === 0 ? 'FREE' : money(ctx.deliveryCost)} />
          <div className="flex justify-between font-bold border-t pt-2 mt-2 text-base"><span>Order Total</span><span data-testid="order-total">{money(ctx.orderTotal)}</span></div>
        </div>

        {needsApproval && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-sm" role="status">
            This order exceeds the $25,000 spending limit and requires Procurement Manager approval.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
            <p className="text-red-600 text-sm">{error}</p>
            <div className="flex gap-4 mt-2">
              <button onClick={() => { const fi = ctx.quote.find(l => l.product.failAtPlacement); if (fi) ctx.removeLine(fi.key); setError(''); }}
                className="text-sm text-cyan-700 hover:underline">Remove item and retry</button>
              <Link href="/quote" className="text-sm text-cyan-700 hover:underline">Return to quote</Link>
            </div>
          </div>
        )}

        <button onClick={submit} disabled={placing}
          className={`w-full py-3 rounded font-medium text-white min-h-[44px] ${placing ? 'bg-slate-400 cursor-not-allowed' : needsApproval ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {placing ? 'Submitting...' : needsApproval ? 'Submit for Approval' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, editHref, children }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-medium">{title}</h2>
        <Link href={editHref} className="text-cyan-700 text-sm hover:underline min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={`Edit ${title}`}>Edit</Link>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value}</span></div>;
}

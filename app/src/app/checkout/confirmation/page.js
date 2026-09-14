'use client';
import { useProcurement } from '../../../context/ProcurementContext';
import StepIndicator from '../../../components/StepIndicator';
import { money } from '../../../lib/pricing';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ConfirmationPage() {
  const { mounted, clearCheckout } = useProcurement();
  const [result, setResult] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    try {
      const data = sessionStorage.getItem('nt_result');
      if (data) { setResult(JSON.parse(data)); clearCheckout(); }
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!loaded) return null;

  if (!result) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">No order found.</p>
        <Link href="/" className="text-cyan-700 hover:underline">Browse Catalog</Link>
      </div>
    );
  }

  const isApproval = result.kind === 'approval';

  return (
    <div>
      <StepIndicator current="Confirmation" />
      <div className="text-center py-8 max-w-md mx-auto">
        <div className="text-5xl mb-4">{isApproval ? '⏳' : '✓'}</div>
        <h1 className="text-2xl font-bold mb-2">{isApproval ? 'Submitted for Approval' : 'Order Confirmed'}</h1>
        <p className="text-slate-600 mb-6">
          {isApproval ? 'Your order has been sent to a Procurement Manager for approval.' : 'Thank you — your order has been placed.'}
        </p>

        <div className="bg-white border rounded-lg p-6 text-left space-y-3">
          {isApproval ? (
            <>
              <Field label="Request ID" value={<span className="font-mono font-bold">{result.id}</span>} />
              <Field label="Status" value={<span className="text-amber-700 font-medium">{result.status}</span>} />
              <Field label="Approver" value="Procurement Manager" />
            </>
          ) : (
            <>
              <Field label="Order number" value={<span className="font-mono font-bold" data-testid="order-number">{result.orderNumber}</span>} />
              {result.payment?.type === 'po' && <Field label="PO number" value={result.payment.poNumber} />}
            </>
          )}
          <Field label="Estimated delivery" value={result.delivery?.deliveryDate} />
          <Field label="Order total" value={<span className="font-bold">{money(result.total)}</span>} />
        </div>

        {!isApproval && <p className="text-sm text-slate-500 mt-4">An order acknowledgement has been emailed to the requester.</p>}

        <div className="flex gap-3 justify-center mt-6">
          {isApproval ? (
            <Link href="/approvals" className="border rounded px-4 py-2 text-sm hover:bg-slate-50 min-h-[44px] flex items-center">View Approvals</Link>
          ) : (
            <button onClick={() => window.print()} className="border rounded px-4 py-2 text-sm hover:bg-slate-50 min-h-[44px]">Print Order</button>
          )}
          <Link href="/" className="bg-cyan-600 text-white rounded px-4 py-2 text-sm hover:bg-cyan-700 min-h-[44px] flex items-center">
            Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className="text-right">{value}</span></div>;
}

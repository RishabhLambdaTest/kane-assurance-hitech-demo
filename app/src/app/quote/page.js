'use client';
import { useProcurement } from '../../context/ProcurementContext';
import StepIndicator from '../../components/StepIndicator';
import { configSummary, WARRANTIES, ADDONS, addonDisabledReason, isHardware, money, formatDate } from '../../lib/pricing';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuotePage() {
  const ctx = useProcurement();
  const router = useRouter();
  const { quote, mounted } = ctx;

  if (!mounted) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  if (quote.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-slate-500 mb-4">Your quote is empty</p>
        <Link href="/" className="text-cyan-700 hover:underline">Browse Catalog</Link>
      </div>
    );
  }

  const saveQuote = () => {
    const number = 'Q-' + String(Math.floor(100000 + Math.random() * 900000));
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    ctx.setSavedQuote({ number, validUntil: formatDate(validUntil) });
  };

  return (
    <div>
      <StepIndicator current="Quote" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">Quote Builder</h1>
          {quote.map(line => <QuoteLine key={line.key} line={line} />)}
        </div>

        <div className="w-full lg:w-80">
          <div className="bg-white border rounded-lg p-4 sticky top-20">
            <h2 className="font-bold mb-3">Quote Summary</h2>
            <Row label="Hardware (list)" value={money(ctx.hardwareList)} />
            <Row label="Volume discount" value={`-${money(ctx.volumeDiscount)}`} className="text-green-700" />
            <Row label="Services" value={money(ctx.servicesTotal)} />
            <Row label="Subtotal" value={money(ctx.subtotal)} className="font-medium border-t pt-2 mt-2" />
            <Row label="Tax" value={<span className="text-slate-400">TBD</span>} />
            <Row label="Delivery" value={<span className="text-slate-400">TBD</span>} />
            <div className="flex justify-between font-bold border-t pt-3 mt-2">
              <span>Quote total</span><span data-testid="quote-total">{money(ctx.subtotal)}</span>
            </div>

            {ctx.savedQuote ? (
              <div className="mt-3 bg-cyan-50 border border-cyan-200 rounded p-3 text-sm" role="status">
                <p>Quote saved: <span className="font-mono font-bold">{ctx.savedQuote.number}</span></p>
                <p className="text-slate-600">Valid until {ctx.savedQuote.validUntil}</p>
              </div>
            ) : (
              <button onClick={saveQuote} className="w-full mt-3 border border-cyan-600 text-cyan-700 py-2 rounded font-medium hover:bg-cyan-50 min-h-[44px]">
                Save Quote
              </button>
            )}

            {ctx.hasEol && <p className="text-red-600 text-sm mt-2">Remove End of Life products to proceed</p>}

            <button onClick={() => ctx.canProceed && router.push('/checkout/shipping')}
              disabled={!ctx.canProceed}
              className={`w-full mt-3 py-3 rounded font-medium text-white min-h-[44px] transition ${ctx.canProceed ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-300 cursor-not-allowed'}`}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteLine({ line }) {
  const { updateLine, removeLine } = useProcurement();
  const p = line.pricing;
  const hw = isHardware(line.product);

  const toggleAddon = (id) => {
    const addons = line.addons.includes(id) ? line.addons.filter(a => a !== id) : [...line.addons, id];
    updateLine(line.key, { addons, notice: '' });
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-3" data-testid={`line-${line.product.id}`}>
      <div className="flex items-start gap-4">
        <img src={line.product.image} alt={line.product.name} className="w-16 h-16 rounded object-cover" />
        <div className="flex-1">
          <p className="font-medium">{line.product.name}</p>
          {line.config && <p className="text-sm text-slate-500">{configSummary(line.config)}</p>}
          <p className="text-sm mt-1">
            {p.rate > 0 ? (
              <>
                <span className="line-through text-slate-400 mr-2">{money(p.list)}</span>
                <span className="font-bold text-cyan-700">{money(p.unit)}</span>
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">{Math.round(p.rate * 100)}% volume discount</span>
              </>
            ) : <span className="font-bold text-cyan-700">{money(p.unit)}</span>}
            <span className="text-slate-500"> / unit</span>
          </p>
          {line.product.eol && <span className="inline-block mt-1 bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded">End of Life</span>}
          {p.backorder > 0 && <p className="text-amber-700 text-sm mt-1">Backorder: {p.backorder} units ship in {line.product.leadTimeDays} days</p>}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`qty-${line.key}`} className="sr-only">Quantity for {line.product.name}</label>
          <input id={`qty-${line.key}`} type="number" min={1} max={500} value={line.qty}
            onChange={e => updateLine(line.key, { qty: parseInt(e.target.value) || 1 })}
            className="w-20 border rounded px-2 py-1 text-center" />
          <p className="font-medium w-28 text-right" data-testid={`line-total-${line.product.id}`}>{money(p.total)}</p>
          <button onClick={() => removeLine(line.key)} className="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px]"
            aria-label={`Remove ${line.product.name}`}>✕</button>
        </div>
      </div>

      {hw && (
        <div className="mt-3 border-t pt-3 grid md:grid-cols-2 gap-3 text-sm">
          <div>
            <label htmlFor={`warranty-${line.key}`} className="block font-medium mb-1">Warranty</label>
            <select id={`warranty-${line.key}`} value={line.warranty} onChange={e => updateLine(line.key, { warranty: e.target.value })}
              className="w-full border rounded px-2 py-1">
              {WARRANTIES.map(w => <option key={w.id} value={w.id}>{w.label} — {w.price === 0 ? 'Included' : `${money(w.price)}/device`}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="font-medium mb-1">Services</legend>
            {ADDONS.map(a => {
              const reason = addonDisabledReason(line, a.id);
              const id = `${a.id}-${line.key}`;
              return (
                <label key={a.id} htmlFor={id} className={`flex items-center gap-2 py-0.5 ${reason ? 'text-slate-400' : ''}`}>
                  <input type="checkbox" id={id} checked={line.addons.includes(a.id)} disabled={!!reason} onChange={() => toggleAddon(a.id)} />
                  {a.label} ({money(a.price)}/device)
                  {reason && <span className="text-xs">— {reason}</span>}
                </label>
              );
            })}
          </fieldset>
          {line.notice && <p role="alert" className="md:col-span-2 text-amber-800 bg-amber-50 p-2 rounded">{line.notice}</p>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, className = '' }) {
  return <div className={`flex justify-between text-sm mb-1 ${className}`}><span>{label}</span><span>{value}</span></div>;
}

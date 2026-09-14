'use client';
import products from '../../../data/products.json';
import { useProcurement } from '../../../context/ProcurementContext';
import { OPTIONS, OPTION_LABELS, DEFAULT_CONFIG, optionDisabledReason, listUnitPrice, money } from '../../../lib/pricing';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function ConfigurePage({ params }) {
  const product = products.find(p => p.id === params.id);
  const { addToQuote } = useProcurement();
  const router = useRouter();
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState('');

  if (!product || !product.configurable) {
    return <div className="text-center py-16"><p className="text-slate-500 mb-4">Product not found or not configurable.</p><Link href="/" className="text-cyan-700 hover:underline">Browse Catalog</Link></div>;
  }
  if (product.eol) {
    return <div className="text-center py-16"><p className="text-slate-700 mb-2">{product.name} is End of Life and cannot be ordered.</p><p className="text-slate-500 mb-4">Recommended replacement: {product.replacement}</p><Link href="/" className="text-cyan-700 hover:underline">Browse Catalog</Link></div>;
  }

  const select = (key, id) => {
    const next = { ...config, [key]: id };
    setNotice('');
    // FR-2 rule 1: downgrading CPU with 64 GB selected auto-drops memory to 32 GB
    if (key === 'cpu' && id !== 'u9' && next.ram === '64') {
      next.ram = '32';
      setNotice('64 GB memory requires Core Ultra 9 — memory changed to 32 GB');
    }
    setConfig(next);
  };

  const unit = listUnitPrice(product, config);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <Link href="/" className="text-sm text-cyan-700 hover:underline">← Catalog</Link>
        <h1 className="text-2xl font-bold mt-2">Configure {product.name}</h1>
        <p className="text-slate-500 mb-4">{product.category}</p>

        {notice && <p role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded mb-4">{notice}</p>}

        {Object.keys(OPTIONS).map(key => (
          <fieldset key={key} className="bg-white border rounded-lg p-4 mb-3">
            <legend className="font-medium px-1">{OPTION_LABELS[key]}</legend>
            <div className="grid sm:grid-cols-2 gap-2 mt-1">
              {OPTIONS[key].map(opt => {
                const reason = optionDisabledReason(product, key, opt.id, config);
                const id = `${key}-${opt.id}`;
                return (
                  <label key={opt.id} htmlFor={id}
                    className={`flex items-center justify-between border rounded p-3 min-h-[44px] ${reason ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:border-cyan-500'} ${config[key] === opt.id ? 'border-cyan-600 bg-cyan-50' : ''}`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" id={id} name={key} value={opt.id} checked={config[key] === opt.id}
                        disabled={!!reason} onChange={() => select(key, opt.id)} aria-describedby={reason ? `${id}-reason` : undefined} />
                      <span>{opt.label}</span>
                      {reason && <span id={`${id}-reason`} className="text-xs text-slate-500">({reason})</span>}
                    </span>
                    <span className="text-sm text-slate-600">{opt.price === 0 ? '+$0' : opt.price > 0 ? `+${money(opt.price)}` : `−${money(-opt.price)}`}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="w-full md:w-72">
        <div className="bg-white border rounded-lg p-4 sticky top-20">
          <h2 className="font-bold mb-3">Summary</h2>
          <p className="text-sm text-slate-500">Unit price</p>
          <p className="text-2xl font-bold text-cyan-700" data-testid="unit-price">{money(unit)}</p>
          <div className="mt-4">
            <label htmlFor="config-qty" className="block text-sm font-medium mb-1">Quantity (1–500)</label>
            <input id="config-qty" type="number" min={1} max={500} value={qty}
              onChange={e => setQty(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
              className="w-full border rounded px-3 py-2" />
          </div>
          {qty > product.stock && (
            <p className="text-amber-700 text-sm mt-2">Backorder: {qty - product.stock} units ship in {product.leadTimeDays} days</p>
          )}
          <button onClick={() => { addToQuote(product, config, qty); router.push('/quote'); }}
            className="w-full mt-4 bg-cyan-600 text-white py-3 rounded font-medium hover:bg-cyan-700 min-h-[44px]">
            Add to Quote
          </button>
        </div>
      </div>
    </div>
  );
}

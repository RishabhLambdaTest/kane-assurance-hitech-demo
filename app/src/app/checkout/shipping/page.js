'use client';
import { useProcurement } from '../../../context/ProcurementContext';
import StepIndicator from '../../../components/StepIndicator';
import { COUNTRIES, POSTAL_PATTERNS, addBusinessDays, formatDate, money } from '../../../lib/pricing';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const SAVED_SITES = [
  { label: 'HQ — San Jose', company: 'Acme Corp', attention: 'IT Receiving', line1: '100 Innovation Way', line2: '', city: 'San Jose', state: 'CA', postal: '95134', country: 'United States', phone: '+1 408 555 0100', taxExemptId: '' },
  { label: 'EU Hub — Frankfurt', company: 'Acme GmbH', attention: 'Lager / Warehouse', line1: 'Mainzer Landstraße 50', line2: '', city: 'Frankfurt', state: 'HE', postal: '60325', country: 'Germany', phone: '+49 69 555 0100', taxExemptId: '' },
];

const EMPTY = { company: '', attention: '', line1: '', line2: '', city: '', state: '', postal: '', country: 'United States', phone: '', taxExemptId: '' };

export default function ShippingPage() {
  const ctx = useProcurement();
  const router = useRouter();
  const [form, setForm] = useState(ctx.shipTo || EMPTY);
  const [methodId, setMethodId] = useState(ctx.delivery?.id || '');
  const [errors, setErrors] = useState({});

  useEffect(() => { if (ctx.mounted && !ctx.canProceed) router.push('/quote'); }, [ctx.mounted, ctx.canProceed, router]);
  if (!ctx.mounted || !ctx.canProceed) return null;

  const methods = deliveryMethods(form.country, ctx.hardwareList - ctx.volumeDiscount, ctx.deviceCount, ctx.maxLeadTime);
  const selected = methods.find(m => m.id === methodId);

  const validate = () => {
    const e = {};
    const req = { company: 'Company name', attention: 'Attention', line1: 'Street address', city: 'City', state: 'State/Province', postal: 'Postal code', phone: 'Phone number' };
    Object.entries(req).forEach(([k, label]) => { if (!form[k].trim()) e[k] = `${label} is required`; });
    if (form.postal.trim() && !POSTAL_PATTERNS[form.country]?.test(form.postal.trim())) e.postal = 'Invalid postal code for ' + form.country;
    if (form.taxExemptId.trim() && !/^EXM-\d{6}$/.test(form.taxExemptId.trim())) e.taxExemptId = 'Invalid exemption certificate format (EXM-123456)';
    if (!selected) e.method = 'Select a delivery method';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    ctx.setShipTo({ ...form, taxExemptId: form.taxExemptId.trim() });
    ctx.setDelivery(selected);
    router.push('/checkout/payment');
  };

  const fields = [
    { id: 'company', label: 'Company name', required: true },
    { id: 'attention', label: 'Attention (recipient)', required: true },
    { id: 'line1', label: 'Street address', required: true },
    { id: 'line2', label: 'Street address line 2', required: false },
    { id: 'city', label: 'City', required: true },
    { id: 'state', label: 'State / Province', required: true },
    { id: 'postal', label: 'Postal code', required: true },
    { id: 'phone', label: 'Phone number', required: true },
    { id: 'taxExemptId', label: 'Tax exemption certificate number', required: false, placeholder: 'EXM-123456' },
  ];

  return (
    <div>
      <StepIndicator current="Shipping" />
      <h1 className="text-xl font-bold mb-4">Ship-to Site &amp; Delivery</h1>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-slate-500 mb-2">Saved sites</h2>
        <div className="grid sm:grid-cols-2 gap-2 max-w-2xl">
          {SAVED_SITES.map(({ label, ...site }) => (
            <button key={label} onClick={() => { setForm(site); setMethodId(''); }}
              className={`text-left border rounded-lg p-3 hover:border-cyan-500 transition min-h-[44px] ${form.line1 === site.line1 ? 'border-cyan-600 bg-cyan-50' : 'bg-white'}`}>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-slate-500">{site.line1}, {site.city} {site.postal}, {site.country}</p>
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-2">Or enter a new site below</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-white border rounded-lg p-4 space-y-3 flex-1 max-w-lg">
          {fields.map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block text-sm font-medium mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input id={f.id} type="text" value={form[f.id]} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                aria-invalid={!!errors[f.id]}
                className={`w-full border rounded px-3 py-2 ${errors[f.id] ? 'border-red-500' : ''}`} />
              {errors[f.id] && <p className="text-red-600 text-sm mt-1" role="alert">{errors[f.id]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-1">Country <span className="text-red-500">*</span></label>
            <select id="country" value={form.country} onChange={e => { setForm(p => ({ ...p, country: e.target.value })); setMethodId(''); }}
              className="w-full border rounded px-3 py-2">
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 max-w-lg">
          <h2 className="font-bold mb-2">Delivery method</h2>
          <div className="space-y-2" role="radiogroup" aria-label="Delivery method">
            {methods.map(m => (
              <button key={m.id} onClick={() => setMethodId(m.id)} role="radio" aria-checked={methodId === m.id}
                className={`w-full text-left border rounded-lg p-4 transition min-h-[44px] ${methodId === m.id ? 'border-cyan-600 bg-cyan-50' : 'bg-white hover:border-slate-400'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-slate-500">{m.window} — est. delivery {m.deliveryDate}</p>
                  </div>
                  <span className="font-bold">{m.cost === 0 ? 'FREE' : money(m.cost)}</span>
                </div>
              </button>
            ))}
          </div>
          {ctx.maxLeadTime > 0 && <p className="text-amber-700 text-sm mt-2">Includes {ctx.maxLeadTime}-day backorder lead time</p>}
          {errors.method && <p className="text-red-600 text-sm mt-2" role="alert">{errors.method}</p>}

          <button onClick={submit} className="w-full mt-4 bg-cyan-600 text-white py-3 rounded font-medium hover:bg-cyan-700 min-h-[44px]">
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// FR-5 delivery rules
function deliveryMethods(country, hardwareNet, deviceCount, leadTime) {
  const eta = (days) => formatDate(addBusinessDays(leadTime + days));
  const methods = [
    { id: 'ground', name: 'Standard Ground', window: '5–7 business days', cost: hardwareNet >= 5000 ? 0 : 49, deliveryDate: eta(7) },
  ];
  if (['United States', 'Canada'].includes(country)) {
    methods.push({ id: 'expedited', name: 'Expedited', window: '2–3 business days', cost: 199, deliveryDate: eta(3) });
  }
  if (country === 'United States' && deviceCount >= 25) {
    methods.push({ id: 'whiteglove', name: 'White-Glove Deployment', window: '10 business days', cost: 75 * deviceCount, deliveryDate: eta(10) });
  }
  return methods;
}

'use client';
import { useProcurement } from '../../../context/ProcurementContext';
import StepIndicator from '../../../components/StepIndicator';
import { CREDIT_LIMIT, CARD_LIMIT, money } from '../../../lib/pricing';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

function luhn(num) {
  const digits = num.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((s, d, i) => { if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; } return s + d; }, 0);
  return sum % 10 === 0 && digits.length >= 13;
}

function cardBrand(num) {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  return '';
}

export default function PaymentPage() {
  const ctx = useProcurement();
  const router = useRouter();
  const [method, setMethod] = useState(ctx.payment?.type === 'card' ? 'card' : 'po');
  const [po, setPo] = useState(ctx.payment?.poNumber || '');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [errors, setErrors] = useState({});
  const [payError, setPayError] = useState('');
  const [lockCountdown, setLockCountdown] = useState(0);
  const { paymentLockUntil, setPaymentLockUntil } = ctx;

  useEffect(() => {
    if (!paymentLockUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((paymentLockUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) setPaymentLockUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [paymentLockUntil, setPaymentLockUntil]);

  useEffect(() => { if (ctx.mounted && !ctx.delivery) router.push('/checkout/shipping'); }, [ctx.mounted, ctx.delivery, router]);
  if (!ctx.mounted || !ctx.delivery) return null;

  const total = ctx.orderTotal;
  const overCredit = total > CREDIT_LIMIT;
  const overCardLimit = total > CARD_LIMIT;
  const isLocked = paymentLockUntil && Date.now() < paymentLockUntil;
  const brand = cardBrand(card.number);
  const isAmex = brand === 'Amex';

  const submitPo = () => {
    const e = {};
    if (!po.trim()) e.po = 'PO number is required';
    else if (!/^PO-\d{6}$/.test(po.trim())) e.po = 'PO number must be in the format PO-123456';
    setErrors(e);
    if (Object.keys(e).length || overCredit) return;
    ctx.setPayment({ type: 'po', poNumber: po.trim(), terms: 'Net 30' });
    router.push('/checkout/review');
  };

  const validateCard = () => {
    const e = {};
    if (!card.name.trim()) e.name = 'Cardholder name is required';
    const num = card.number.replace(/\D/g, '');
    if (!num) e.number = 'Card number is required';
    else if (!luhn(card.number)) e.number = 'Invalid card number';
    else if (!brand) e.number = 'We accept Visa, Mastercard, and Amex';
    const [mm, yy] = (card.expiry || '').split('/');
    if (!mm || !yy) e.expiry = 'Expiry is required (MM/YY)';
    else if (new Date(2000 + parseInt(yy), parseInt(mm)) <= new Date()) e.expiry = 'Card is expired';
    const cvvLen = isAmex ? 4 : 3;
    if (!card.cvv) e.cvv = 'CVV is required';
    else if (card.cvv.replace(/\D/g, '').length !== cvvLen) e.cvv = `CVV must be ${cvvLen} digits`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitCard = () => {
    if (isLocked || overCardLimit) return;
    setPayError('');
    if (!validateCard()) return;
    // Test hook: any card ending 0000 is declined by the mock gateway
    if (card.number.replace(/\D/g, '').endsWith('0000')) {
      const attempts = ctx.failedPayments + 1;
      ctx.setFailedPayments(attempts);
      if (attempts >= 3) {
        setPaymentLockUntil(Date.now() + 15 * 60 * 1000);
        setPayError('Too many failed attempts. Contact support or try again in 15 minutes.');
      } else {
        setPayError('Payment could not be processed. Please check your details or try another method.');
      }
      return;
    }
    ctx.setFailedPayments(0);
    ctx.setPayment({ type: 'card', brand, last4: card.number.replace(/\D/g, '').slice(-4) });
    router.push('/checkout/review');
  };

  const cardField = (id, label, props = {}) => (
    <div className={props.wrap}>
      <label htmlFor={`card-${id}`} className="block text-sm font-medium mb-1">{label} <span className="text-red-500">*</span></label>
      <input id={`card-${id}`} type="text" value={card[id]} onChange={e => setCard(p => ({ ...p, [id]: e.target.value }))}
        placeholder={props.placeholder} maxLength={props.maxLength} aria-invalid={!!errors[id]}
        className={`w-full border rounded px-3 py-2 ${errors[id] ? 'border-red-500' : ''}`} />
      {errors[id] && <p className="text-red-600 text-sm mt-1" role="alert">{errors[id]}</p>}
    </div>
  );

  return (
    <div>
      <StepIndicator current="Payment" />
      <h1 className="text-xl font-bold mb-1">Payment</h1>
      <p className="text-slate-500 mb-4">Order total <span className="font-bold text-slate-900" data-testid="payment-total">{money(total)}</span></p>

      <div className="flex gap-2 mb-4" role="tablist" aria-label="Payment method">
        {[['po', 'Purchase Order'], ['card', 'Corporate Card']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={method === id} onClick={() => { setMethod(id); setErrors({}); setPayError(''); }}
            className={`px-4 py-2 rounded border min-h-[44px] ${method === id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white hover:border-slate-400'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4 max-w-lg space-y-4">
        {method === 'po' ? (
          <>
            <div>
              <label htmlFor="po-number" className="block text-sm font-medium mb-1">PO number <span className="text-red-500">*</span></label>
              <input id="po-number" type="text" value={po} onChange={e => setPo(e.target.value)} placeholder="PO-123456"
                aria-invalid={!!errors.po} className={`w-full border rounded px-3 py-2 ${errors.po ? 'border-red-500' : ''}`} />
              {errors.po && <p className="text-red-600 text-sm mt-1" role="alert">{errors.po}</p>}
            </div>
            <p className="text-sm text-slate-600">Payment terms: <span className="font-medium">Net 30</span></p>
            <p className="text-sm text-slate-600">Available credit: <span className="font-medium">{money(CREDIT_LIMIT)}</span></p>
            {overCredit && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded" role="alert">
                Order total exceeds available credit of {money(CREDIT_LIMIT)}. Pay by corporate card or contact your account manager.
              </p>
            )}
            <button onClick={submitPo} disabled={overCredit}
              className={`w-full py-3 rounded font-medium text-white min-h-[44px] ${overCredit ? 'bg-slate-300 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
              Continue to Review
            </button>
          </>
        ) : overCardLimit ? (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded" role="alert">
            Corporate card payments are limited to $10,000 per order. Use a purchase order.
          </p>
        ) : (
          <>
            {cardField('name', 'Cardholder name')}
            <div>
              {cardField('number', <>Card number {brand && <span className="ml-2 text-cyan-700 text-xs font-medium">{brand}</span>}</>, { placeholder: '4111 1111 1111 1111', maxLength: 19 })}
            </div>
            <div className="flex gap-4">
              {cardField('expiry', 'Expiry', { placeholder: 'MM/YY', maxLength: 5, wrap: 'flex-1' })}
              {cardField('cvv', 'CVV', { placeholder: isAmex ? '1234' : '123', maxLength: isAmex ? 4 : 3, wrap: 'flex-1' })}
            </div>
            {payError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded" role="alert">{payError}</p>}
            {isLocked ? (
              <div className="text-center py-3">
                <p className="text-red-600 font-medium">Card payments locked</p>
                <p className="text-sm text-slate-500">Try again in {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}</p>
                <p className="text-sm text-slate-500 mt-1">Contact support: b2b-support@novatech.example</p>
              </div>
            ) : (
              <button onClick={submitCard} className="w-full bg-cyan-600 text-white py-3 rounded font-medium hover:bg-cyan-700 min-h-[44px]">
                Continue to Review
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

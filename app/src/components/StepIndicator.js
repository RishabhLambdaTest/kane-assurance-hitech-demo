'use client';

const STEPS = ['Quote', 'Shipping', 'Payment', 'Review', 'Confirmation'];

export default function StepIndicator({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <nav className="flex items-center justify-center gap-1 mb-6 text-sm" aria-label="Checkout progress">
      {STEPS.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span aria-current={i === idx ? 'step' : undefined}
            className={`px-2 py-1 rounded ${i === idx ? 'bg-cyan-600 text-white font-medium' : i < idx ? 'text-cyan-700' : 'text-slate-400'}`}>
            {s}
          </span>
          {i < STEPS.length - 1 && <span className="text-slate-300">→</span>}
        </span>
      ))}
    </nav>
  );
}

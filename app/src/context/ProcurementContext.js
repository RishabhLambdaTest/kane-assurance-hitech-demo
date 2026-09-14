'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import products from '../data/products.json';
import { DEFAULT_CONFIG, priceLine, TAX_RATE, isHardware } from '../lib/pricing';

const ProcurementContext = createContext(null);

export const USERS = {
  buyer: { name: 'Priya Shah', title: 'IT Buyer' },
  approver: { name: 'Marcus Lee', title: 'Procurement Manager' },
};

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export function ProcurementProvider({ children }) {
  const [quote, setQuote] = useState([]);
  const [role, setRole] = useState('buyer');
  const [shipTo, setShipTo] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [payment, setPayment] = useState(null);
  const [savedQuote, setSavedQuote] = useState(null);
  const [requests, setRequests] = useState([]);
  const [failedPayments, setFailedPayments] = useState(0);
  const [paymentLockUntil, setPaymentLockUntil] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      // Deterministic fixture seeding for test automation:
      //   /quote?seed=d1:10,d6:10   → quote contains EXACTLY those lines (default config)
      //   ?role=approver            → switch persona
      //   ?reset=1                  → clear quote, checkout state, and approval requests
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset')) {
        ['nt_quote', 'nt_requests', 'nt_role'].forEach(k => localStorage.removeItem(k));
      }
      const seed = params.get('seed');
      if (seed) {
        const seeded = seed.split(',').map((pair, i) => {
          const [id, q] = pair.split(':');
          const product = products.find(p => p.id === (id || '').trim());
          if (!product) return null;
          return newLine(product, product.configurable ? { ...DEFAULT_CONFIG } : null, clampQty(parseInt(q, 10) || 1), i);
        }).filter(Boolean);
        setQuote(seeded);
      } else {
        setQuote(load('nt_quote', []));
      }
      const r = params.get('role');
      setRole(r === 'approver' || r === 'buyer' ? r : load('nt_role', 'buyer'));
      setRequests(load('nt_requests', []));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => { if (mounted) localStorage.setItem('nt_quote', JSON.stringify(quote)); }, [quote, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('nt_role', JSON.stringify(role)); }, [role, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('nt_requests', JSON.stringify(requests)); }, [requests, mounted]);

  const addToQuote = (product, config, qty) => {
    setQuote(prev => [...prev, newLine(product, config, clampQty(qty), Date.now())]);
  };

  const updateLine = (key, patch) => {
    setQuote(prev => prev.map(l => {
      if (l.key !== key) return l;
      const next = { ...l, ...patch };
      if (patch.qty !== undefined) {
        next.qty = clampQty(patch.qty);
        next.notice = '';
        // FR-4: imaging needs 10+ devices — drop it rather than leave an invalid line
        if (next.qty < 10 && next.addons.includes('imaging')) {
          next.addons = next.addons.filter(a => a !== 'imaging');
          next.notice = 'Custom OS Imaging requires 10 or more devices';
        }
      }
      return next;
    }));
  };

  const removeLine = (key) => setQuote(prev => prev.filter(l => l.key !== key));

  const clearCheckout = () => {
    setQuote([]); setShipTo(null); setDelivery(null); setPayment(null); setSavedQuote(null);
  };

  const priced = quote.map(l => ({ ...l, pricing: priceLine(l) }));
  const hardwareList = priced.reduce((s, l) => s + l.pricing.hardwareList, 0);
  const volumeDiscount = priced.reduce((s, l) => s + l.pricing.discount, 0);
  const servicesTotal = priced.reduce((s, l) => s + l.pricing.servicesTotal, 0);
  const subtotal = hardwareList - volumeDiscount + servicesTotal;
  const deviceCount = quote.filter(l => isHardware(l.product)).reduce((s, l) => s + l.qty, 0);
  const maxLeadTime = priced.reduce((m, l) => Math.max(m, l.pricing.leadTimeDays), 0);
  const taxExempt = !!shipTo?.taxExemptId;
  const tax = shipTo && !taxExempt ? Math.round(subtotal * TAX_RATE * 100) / 100 : 0;
  const deliveryCost = delivery?.cost ?? 0;
  const orderTotal = subtotal + tax + deliveryCost;
  const hasEol = quote.some(l => l.product.eol);
  const canProceed = quote.length > 0 && !hasEol;
  const user = USERS[role];

  return (
    <ProcurementContext.Provider value={{
      quote: priced, addToQuote, updateLine, removeLine, clearCheckout,
      role, setRole, user,
      shipTo, setShipTo, delivery, setDelivery, payment, setPayment,
      savedQuote, setSavedQuote,
      requests, setRequests,
      failedPayments, setFailedPayments, paymentLockUntil, setPaymentLockUntil,
      hardwareList, volumeDiscount, servicesTotal, subtotal, deviceCount, maxLeadTime,
      tax, taxExempt, deliveryCost, orderTotal, hasEol, canProceed, mounted,
    }}>
      {children}
    </ProcurementContext.Provider>
  );
}

function newLine(product, config, qty, salt) {
  return { key: `${product.id}-${salt}`, product, config, qty, warranty: 'standard', addons: [] };
}

function clampQty(q) {
  return Math.max(1, Math.min(500, Number.isFinite(q) ? q : 1));
}

export const useProcurement = () => useContext(ProcurementContext);

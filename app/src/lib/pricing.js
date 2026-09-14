// Business rules shared across pages. Every constant here maps to a line in
// docs/prd-enterprise-procurement.md — keep them in sync.

export const OPTIONS = {
  cpu: [
    { id: 'u5', label: 'Core Ultra 5', price: 0 },
    { id: 'u7', label: 'Core Ultra 7', price: 250 },
    { id: 'u9', label: 'Core Ultra 9', price: 550 },
  ],
  ram: [
    { id: '16', label: '16 GB', price: 0 },
    { id: '32', label: '32 GB', price: 200 },
    { id: '64', label: '64 GB', price: 500 },
  ],
  storage: [
    { id: '512', label: '512 GB', price: 0 },
    { id: '1tb', label: '1 TB', price: 150 },
    { id: '2tb', label: '2 TB', price: 350 },
    { id: '4tb', label: '4 TB', price: 700 },
  ],
  os: [
    { id: 'win', label: 'Windows 11 Pro', price: 0 },
    { id: 'ubuntu', label: 'Ubuntu 24.04 LTS', price: -50 },
  ],
};

export const OPTION_LABELS = { cpu: 'Processor', ram: 'Memory', storage: 'Storage', os: 'Operating System' };

export const DEFAULT_CONFIG = { cpu: 'u5', ram: '16', storage: '512', os: 'win' };

// FR-2 compatibility: returns a reason string when an option is not allowed
export function optionDisabledReason(product, key, id, config) {
  if (key === 'ram' && id === '64' && config.cpu !== 'u9') return 'Requires Core Ultra 9';
  if (key === 'storage' && id === '4tb' && product.category !== 'Workstation') return 'Workstation only';
  return null;
}

export function findOption(key, id) {
  return OPTIONS[key].find(o => o.id === id);
}

export function configSummary(config) {
  if (!config) return '';
  return Object.keys(OPTIONS).map(k => findOption(k, config[k])?.label).join(' · ');
}

export function listUnitPrice(product, config) {
  if (!product.configurable || !config) return product.basePrice;
  return product.basePrice + Object.keys(OPTIONS).reduce((s, k) => s + (findOption(k, config[k])?.price || 0), 0);
}

// FR-3 volume pricing
export function volumeDiscountRate(qty) {
  if (qty >= 100) return 0.15;
  if (qty >= 50) return 0.10;
  if (qty >= 10) return 0.05;
  return 0;
}

// FR-4 services
export const WARRANTIES = [
  { id: 'standard', label: 'Standard Warranty (1 year)', price: 0 },
  { id: 'prosupport', label: 'ProSupport (3 years, NBD onsite)', price: 149 },
  { id: 'prosupport-plus', label: 'ProSupport Plus (3 years, accidental damage)', price: 249 },
];

export const ADDONS = [
  { id: 'autopilot', label: 'Windows Autopilot Enrollment', price: 12 },
  { id: 'imaging', label: 'Custom OS Imaging', price: 15 },
  { id: 'tagging', label: 'Asset Tagging', price: 5 },
];

export function addonDisabledReason(line, id) {
  if (id === 'autopilot' && line.config && line.config.os !== 'win') return 'Windows 11 Pro only';
  if (id === 'imaging' && line.qty < 10) return 'Requires 10 or more devices';
  return null;
}

export function isHardware(product) {
  return product.category !== 'Accessory';
}

export function servicesPerDevice(line) {
  if (!isHardware(line.product)) return 0;
  const w = WARRANTIES.find(x => x.id === line.warranty)?.price || 0;
  const a = (line.addons || []).reduce((s, id) => s + (ADDONS.find(x => x.id === id)?.price || 0), 0);
  return w + a;
}

export function priceLine(line) {
  const list = listUnitPrice(line.product, line.config);
  const rate = volumeDiscountRate(line.qty);
  const unit = round2(list * (1 - rate));
  const services = servicesPerDevice(line);
  const backorder = Math.max(0, line.qty - line.product.stock);
  return {
    list, rate, unit, services,
    hardwareList: list * line.qty,
    discount: round2(list * line.qty * rate),
    servicesTotal: services * line.qty,
    total: round2(unit * line.qty + services * line.qty),
    backorder,
    leadTimeDays: backorder > 0 ? line.product.leadTimeDays : 0,
  };
}

export const TAX_RATE = 0.0825;
export const APPROVAL_LIMIT = 25000;
export const CREDIT_LIMIT = 150000;
export const CARD_LIMIT = 10000;

export const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'India'];
export const POSTAL_PATTERNS = {
  'United States': /^\d{5}(-\d{4})?$/,
  'Canada': /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/,
  'United Kingdom': /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
  'Germany': /^\d{5}$/,
  'France': /^\d{5}$/,
  'Japan': /^\d{3}-\d{4}$/,
  'India': /^\d{6}$/,
};

export function addBusinessDays(days, from = new Date()) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

export function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function money(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function newOrderNumber() {
  return 'NT-' + Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0');
}

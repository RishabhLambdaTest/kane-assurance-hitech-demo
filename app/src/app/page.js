'use client';
import products from '../data/products.json';
import { useProcurement } from '../context/ProcurementContext';
import { money } from '../lib/pricing';
import Link from 'next/link';
import { useState } from 'react';

export default function CatalogPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Product Catalog</h1>
      <p className="text-slate-500 mb-6">Contract pricing for Acme Corp. Volume discounts apply in your quote.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

function Availability({ product }) {
  if (product.eol) return <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded">End of Life</span>;
  if (product.stock === 0) return <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">Backorder — ships in {product.leadTimeDays} days</span>;
  return <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">In Stock</span>;
}

function ProductCard({ product }) {
  const { addToQuote } = useProcurement();
  const [added, setAdded] = useState(false);

  return (
    <div className="bg-white rounded-lg border p-3 flex flex-col" data-testid={`product-${product.id}`}>
      <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded mb-2" loading="lazy" />
      <p className="text-xs uppercase tracking-wide text-slate-400">{product.category}</p>
      <h2 className="font-medium text-sm">{product.name}</h2>
      <p className="text-cyan-700 font-bold mt-1">{product.configurable ? 'From ' : ''}{money(product.basePrice)}</p>
      <div className="mt-2"><Availability product={product} /></div>

      {product.eol ? (
        <p className="mt-2 text-xs text-slate-500">Recommended replacement: <span className="font-medium">{product.replacement}</span></p>
      ) : product.configurable ? (
        <Link href={`/configure/${product.id}`}
          className="mt-auto pt-2">
          <span className="block text-center bg-cyan-600 text-white text-sm py-2 px-3 rounded hover:bg-cyan-700 transition min-h-[44px] leading-7">Configure</span>
        </Link>
      ) : (
        <button onClick={() => { addToQuote(product, null, 1); setAdded(true); }}
          className="mt-auto bg-cyan-600 text-white text-sm py-2 px-3 rounded hover:bg-cyan-700 transition min-h-[44px]">
          {added ? 'Added ✓' : 'Add to Quote'}
        </button>
      )}
    </div>
  );
}

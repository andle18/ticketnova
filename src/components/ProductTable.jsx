import { useState, useMemo } from 'react';
import { useLang } from '../context/LangContext';

const NOVA_STYLES = {
  fresco: 'bg-[#639922]/15 text-[#8dc83a] border-[#639922]/25',
  minimo: 'bg-[#1D9E75]/15 text-[#25d4a0] border-[#1D9E75]/25',
  procesado: 'bg-[#EF9F27]/15 text-[#EF9F27] border-[#EF9F27]/25',
  ultra: 'bg-[#E24B4A]/15 text-[#f07070] border-[#E24B4A]/25',
};

export default function ProductTable({ products, currency = '€' }) {
  const { t, formatMoney } = useLang();
  const [filter, setFilter] = useState('all');

  const NOVA_LABELS = {
    fresco: t('labelFresco'),
    minimo: t('labelMinimo'),
    procesado: t('labelProcesado'),
    ultra: t('labelUltra'),
  };

  const counts = useMemo(() => {
    const c = { all: products.length, fresco: 0, minimo: 0, procesado: 0, ultra: 0 };
    products.forEach((p) => { c[p.nova] = (c[p.nova] || 0) + 1; });
    return c;
  }, [products]);

  const filtered = filter === 'all' ? products : products.filter((p) => p.nova === filter);

  const filters = [
    { key: 'all', label: t('filterAll') },
    { key: 'fresco', label: t('filterFresh') },
    { key: 'minimo', label: t('filterMinimo') },
    { key: 'procesado', label: t('filterProcessed') },
    { key: 'ultra', label: t('filterUltra') },
  ];

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white/90">{t('productsTitle')}</p>
          <span className="text-xs text-white/30">{filtered.length} / {products.length}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  text-xs px-3 py-1.5 rounded-full border transition
                  ${isActive
                    ? 'bg-white text-black border-white font-medium'
                    : 'bg-white/[0.04] text-white/45 border-white/[0.08] hover:border-white/20 hover:text-white/65'
                  }
                `}
              >
                {f.label} · {counts[f.key] || 0}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="grid grid-cols-[minmax(0,1fr),70px] sm:grid-cols-[minmax(0,1fr),80px,60px,120px] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-white/25 font-medium bg-white/[0.02]">
          <span>{t('colProduct')}</span>
          <span className="text-right">{t('colPrice')}</span>
          <span className="text-center">{t('colQty')}</span>
          <span className="text-right">{t('colNova')}</span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filtered.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr),70px] sm:grid-cols-[minmax(0,1fr),80px,60px,120px] gap-3 px-5 py-3 text-sm border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.03] transition"
            >
              <span className="text-white/75 break-words" title={t('originalName', { name: p.originalName || p.name })}>{p.name || t('unknownProduct')}</span>
              <span className="text-right tabular text-white/75">{formatMoney(p.price, currency)}</span>
              <span className="text-left sm:text-center text-white/35 text-xs">{p.quantity}</span>
              <span className="text-right">
                <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${NOVA_STYLES[p.nova]}`}>
                  {NOVA_LABELS[p.nova]}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

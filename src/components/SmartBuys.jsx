import { Check } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function SmartBuys({ items, currency = '€' }) {
  const { t, formatMoney } = useLang();

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#639922]/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-[#8dc83a]" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-white/90">{t('smartTitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="border border-white/[0.07] rounded-xl p-3.5 hover:border-[#639922]/30 hover:bg-[#639922]/[0.04] transition"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-medium text-white/80">{item.product}</p>
              <span className="text-xs text-white/30 tabular whitespace-nowrap">
                {formatMoney(item.price, currency)}
              </span>
            </div>
            <p className="text-xs text-white/38 leading-relaxed mb-2">{item.reason}</p>
            <span
              className={`
                inline-block text-[11px] px-2 py-0.5 rounded-full border
                ${item.action === 'mantener'
                  ? 'bg-[#639922]/15 text-[#8dc83a] border-[#639922]/25'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                }
              `}
            >
              {item.action === 'mantener' ? t('actionKeep') : t('actionExpand')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

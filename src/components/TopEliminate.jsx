import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function TopEliminate({ items, currency = '€' }) {
  const { t, formatMoney } = useLang();
  const totalSavings = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[#f07070]" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-white/90">{t('topTitle')}</p>
        </div>
        <span className="text-xs text-white/30">
          {t('reinvest')}: <span className="font-medium text-white/65 tabular">{formatMoney(totalSavings, currency)}</span>
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="border border-white/[0.07] rounded-xl p-3.5 hover:border-white/[0.12] hover:bg-white/[0.02] transition"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-5 h-5 rounded-full bg-red-500/15 text-[#f07070] text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm font-medium text-white/80 truncate">{item.product}</p>
              </div>
              <span className="text-sm font-medium text-[#f07070] tabular whitespace-nowrap">
                {formatMoney(-item.price, currency)}
              </span>
            </div>
            <p className="text-xs text-white/35 leading-relaxed mb-2 ml-7">{item.reason}</p>
            <div className="flex items-start gap-1.5 ml-7">
              <ArrowRight className="w-3.5 h-3.5 text-white/20 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50 leading-relaxed">{item.alternative}</p>
            </div>
            <p className="ml-7 mt-1 text-xs text-white/55">{t('priceUnavailable')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

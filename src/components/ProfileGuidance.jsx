import { Target, Plus, Minus } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function ProfileGuidance({ data, profile }) {
  const { t, formatNumber } = useLang();
  if (!data) return null;

  const buyMore = data.buyMore || [];
  const avoid = data.avoid || [];
  const hasContent = buyMore.length > 0 || avoid.length > 0 || data.untilNextPurchase;
  if (!hasContent) return null;

  const { currentWeightKg, idealWeightKg } = profile || {};
  const weightLabel =
    currentWeightKg && idealWeightKg ? `${formatNumber(currentWeightKg, 1)} → ${formatNumber(idealWeightKg, 1)} ${t('weightUnit')}` : null;

  return (
    <div className="bg-violet-500/[0.05] rounded-2xl border border-violet-500/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <Target className="w-4 h-4 text-violet-300" strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-white/90">
          {t('profileGuidanceTitle')}
          {weightLabel ? ` · ${weightLabel}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 flex items-center gap-1">
            <Plus className="w-3 h-3 text-[#8dc83a]" /> {t('profileBuyMore')}
          </p>
          <div className="space-y-2">
            {buyMore.map((item, i) => (
              <div key={i} className="text-sm">
                <span className="text-white/75">{item.item}</span>
                {item.reason && <p className="text-xs text-white/35 mt-0.5">{item.reason}</p>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-2 flex items-center gap-1">
            <Minus className="w-3 h-3 text-[#f07070]" /> {t('profileAvoid')}
          </p>
          <div className="space-y-2">
            {avoid.map((item, i) => (
              <div key={i} className="text-sm">
                <span className="text-white/75">{item.item}</span>
                {item.reason && <p className="text-xs text-white/35 mt-0.5">{item.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.untilNextPurchase && (
        <div className="pt-3 border-t border-white/[0.06]">
          <p className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-1.5">
            {t('profileUntilNext')}
          </p>
          <p className="text-sm text-white/65 leading-relaxed">{data.untilNextPurchase}</p>
        </div>
      )}
    </div>
  );
}

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function MetricCards({ summary, productsCount, currency = '€' }) {
  const { t, formatMoney, formatNumber } = useLang();
  const { totalSpent, freshPct, ultraPct, ratio } = summary;
  const ratioStatus = ratio >= 1.5 ? 'good' : ratio >= 0.8 ? 'mid' : 'bad';

  const cards = [
    {
      label: t('totalSpent'),
      value: formatMoney(totalSpent, currency),
      sub: t('productsCount', { count: productsCount }),
      color: 'text-white',
    },
    {
      label: t('fresh'),
      value: `${formatNumber(freshPct, 1)}%`,
      sub: formatMoney(totalSpent * freshPct / 100, currency),
      color: 'text-[#8dc83a]',
      Icon: TrendingUp,
    },
    {
      label: t('ultraProcessed'),
      value: `${formatNumber(ultraPct, 1)}%`,
      sub: formatMoney(totalSpent * ultraPct / 100, currency),
      color: 'text-[#f07070]',
      Icon: TrendingDown,
    },
    {
      label: t('ratio'),
      value: formatNumber(ratio),
      sub: t('ratioGoal'),
      color:
        ratioStatus === 'good' ? 'text-[#8dc83a]'
        : ratioStatus === 'mid' ? 'text-[#EF9F27]'
        : 'text-[#f07070]',
      Icon: ratioStatus === 'good' ? TrendingUp : ratioStatus === 'mid' ? Minus : TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white/[0.03] rounded-2xl border border-white/[0.07] p-5 animate-slide-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wider text-white/35 font-medium">
              {card.label}
            </p>
            {card.Icon && <card.Icon className={`w-3.5 h-3.5 ${card.color}`} strokeWidth={2} />}
          </div>
          <p className={`text-2xl font-semibold tabular ${card.color}`}>{card.value}</p>
          <p className="text-xs text-white/30 mt-1.5 tabular">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

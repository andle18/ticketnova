import { ShoppingCart, Download } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function NextWeekList({ data, currentTotal, currency = '€' }) {
  const { t, formatMoney } = useLang();
  const { keep, add, estimatedTotal } = data;
  const hasTotal = Number.isFinite(estimatedTotal);
  const diff = hasTotal ? estimatedTotal - currentTotal : null;
  const priceLabel = (item) => Number.isFinite(item.price)
    ? `${formatMoney(item.price, currency)} · ${t('receiptPrice')}`
    : t('priceUnavailable');

  const downloadList = () => {
    const lines = [
      t('downloadHeader'),
      '',
      t('downloadKeep'),
      ...keep.map((i) => `  ${i.name}  ${priceLabel(i)}`),
      '',
      t('downloadAdd'),
      ...add.map((i) => `  ${i.name}  ${priceLabel(i)}`),
      '',
      `${t('downloadTotal')}: ${hasTotal ? formatMoney(estimatedTotal, currency) : t('incompleteTotal')}`,
      t('shoppingPriceNote'),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('downloadFile');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/[0.08] flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white/55" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-white/90">{t('nextTitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">
            <span className="tabular font-medium text-white/65">{hasTotal ? formatMoney(estimatedTotal, currency) : t('incompleteTotal')}</span>
            {hasTotal && <span className={`ml-1.5 tabular ${diff < 0 ? 'text-[#8dc83a]' : diff > 0 ? 'text-[#f07070]' : 'text-white/30'}`}>
              ({diff > 0 ? '+' : ''}{formatMoney(diff, currency)})
            </span>}
          </span>
          <button
            onClick={downloadList}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
            aria-label={t('download')}
            title={t('download')}
          >
            <Download className="w-4 h-4 text-white/35" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-3">
            {t('sectionKeep')}
          </p>
          <div className="space-y-1.5">
            {keep.map((item, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-md hover:bg-white/[0.04] transition text-sm"
              >
                <span className="text-white/55">{item.name}</span>
                <span className="text-white/60 tabular text-xs">{priceLabel(item)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/25 font-medium mb-3">
            {t('sectionAdd')}
          </p>
          <div className="space-y-1.5">
            {add.map((item, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-md hover:bg-[#639922]/[0.06] transition text-sm"
              >
                <span className="text-white/55">{item.name}</span>
                <span className="text-white/60 tabular text-xs">{priceLabel(item)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/55">{t('shoppingPriceNote')}</p>
    </div>
  );
}

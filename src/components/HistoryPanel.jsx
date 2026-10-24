import { History, Trash2, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function HistoryPanel({ profile, entries, onOpen, onDelete, onClear, onClose }) {
  const { t, lang, formatMoney } = useLang();
  const date = value => new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  return (
    <section aria-labelledby="history-title" className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="history-title" className="flex min-w-0 items-center gap-2 text-sm font-medium text-white/90">
          <History className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="break-words">{t('historyTitle')}{profile.name ? ` · ${profile.name}` : ''}</span>
        </h2>
        <button type="button" onClick={onClose} aria-label={t('historyClose')} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/60">{t('historyPrivacy')}</p>
      {!profile.historyEnabled && <p className="mt-3 text-sm text-white/70">{t('historyDisabled')}</p>}
      {entries.length === 0 ? <p className="mt-4 text-sm text-white/60">{t('historyEmpty')}</p> : (
        <>
          <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {entries.map(entry => <li key={entry.id} className="flex items-center gap-2 rounded-xl border border-white/10 p-2">
              <button type="button" onClick={() => onOpen(entry)} className="flex-1 min-w-0 rounded-lg p-2 text-left hover:bg-white/5">
                <span className="block text-sm font-medium text-white/85 break-words">{entry.analysis.store || t('historyUnknownStore')}</span>
                <span className="block mt-1 text-xs text-white/60">{date(entry.savedAt)} · {formatMoney(entry.analysis.total, entry.analysis.currency)}</span>
                <span className="block mt-1 text-xs text-violet-300">{t('historyOpen')}</span>
              </button>
              <button type="button" onClick={() => onDelete(entry.id)} aria-label={`${t('historyDelete')}: ${entry.analysis.store || t('historyUnknownStore')}, ${date(entry.savedAt)}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-300 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>)}
          </ul>
          <button type="button" onClick={onClear} className="mt-4 min-h-11 rounded-lg border border-red-400/20 px-3 text-xs text-red-300 hover:bg-red-500/10">{t('historyClear')}</button>
        </>
      )}
    </section>
  );
}

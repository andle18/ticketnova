import { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { useLang } from '../context/LangContext';
import HistoryPanel from './HistoryPanel';
import ProfileForm from './ProfileForm';

export default function ProfileButton({
  profile, onSave, onClear, disabled, canViewHistory, historyOpen, historyEntries,
  historyNotice, onHistory, onCloseHistory, onOpenHistory, onDeleteHistory, onClearHistory,
}) {
  const { t, formatNumber } = useLang();
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const hasWeights = profile?.currentWeightKg && profile?.idealWeightKg;
  const hasProfile = profile?.name || hasWeights;

  const save = next => {
    const saved = onSave(next);
    if (saved) setOpen(false);
    return saved;
  };
  const clear = () => {
    if (!onClear()) {
      setStorageError(true);
      return;
    }
    setStorageError(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => {
        if (!open) { onCloseHistory(); setStorageError(false); }
        setOpen(value => !value);
      }} disabled={disabled} aria-label={t('profileBtn')} title={t('profileBtn')}
        aria-expanded={open} aria-controls="profile-panel"
        className={`flex min-h-11 items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition disabled:opacity-50 ${
          hasProfile ? 'border-violet-500/30 bg-violet-500/10 text-violet-300' : 'border-white/10 text-white/65 hover:border-white/25'
        }`}>
        <UserCog className="w-3.5 h-3.5" aria-hidden="true" />
        {hasWeights ? `${formatNumber(profile.currentWeightKg, 1)} → ${formatNumber(profile.idealWeightKg, 1)} ${t('weightUnit')}` : t('profileBtn')}
      </button>
      {open && (
        <div id="profile-panel" onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}
          className="fixed inset-x-4 top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 bg-[#131316] border border-white/10 rounded-xl p-4 shadow-xl z-20 text-left">
          {historyNotice && <p role="status" className="mb-3 text-xs text-white/70">{t(historyNotice)}</p>}
          {canViewHistory && historyOpen ? (
            <HistoryPanel profile={profile} entries={historyEntries}
              onOpen={entry => { onOpenHistory(entry); setOpen(false); }}
              onDelete={onDeleteHistory} onClear={onClearHistory} onClose={onCloseHistory} />
          ) : (
            <>
              <p className="text-sm font-medium text-white/90">{t('profileTitle')}</p>
              <p className="mt-1 mb-4 text-xs text-white/60">{t('profileSub')}</p>
              <ProfileForm profile={profile} onSave={save} />
              {canViewHistory && <button type="button" onClick={onHistory} className="w-full min-h-11 mt-2 text-xs text-white/80 border border-white/15 rounded-lg hover:bg-white/5">{t('historyTitle')}</button>}
              <p className="mt-3 text-xs text-white/55">{t('profileClearNote')}</p>
              <button type="button" onClick={clear} className="w-full min-h-11 mt-2 text-xs text-red-300 border border-red-400/20 rounded-lg hover:bg-red-400/10 transition">{t('profileClear')}</button>
              {storageError && <p role="alert" className="mt-2 text-xs text-red-300">{t('profileStorageError')}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

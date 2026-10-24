import { Languages } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { languages } from '../i18n/languages';

export default function LangSwitch({ onChange, disabled }) {
  const { t, languagePreference } = useLang();
  return (
    <label className="flex items-center gap-2 text-xs text-white/70">
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t('languageLabel')}</span>
      <select value={languagePreference} onChange={event => onChange(event.target.value)} disabled={disabled}
        className="min-h-11 max-w-48 rounded-xl border border-white/15 bg-[#131316] px-2 text-sm text-white disabled:opacity-50">
        <option value="auto">{t('languageAuto')}</option>
        {Object.entries(languages).map(([code, language]) => <option key={code} value={code}>{language.name}</option>)}
      </select>
    </label>
  );
}

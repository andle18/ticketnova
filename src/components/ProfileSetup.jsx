import { ShieldCheck } from 'lucide-react';
import { useLang } from '../context/LangContext';
import ProfileForm from './ProfileForm';

export default function ProfileSetup({ profile, onSave }) {
  const { t } = useLang();
  return (
    <section aria-labelledby="setup-title" className="mx-auto w-full max-w-lg animate-fade-in">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-violet-300">{t('setupEyebrow')}</p>
      <h2 id="setup-title" className="text-center text-3xl sm:text-4xl font-semibold tracking-tight">{t('setupTitle')}</h2>
      <p className="mx-auto mt-4 mb-6 text-center text-sm leading-relaxed text-white/60">{t('setupDescription')}</p>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <ProfileForm profile={profile} onSave={onSave} onboarding />
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-white/55">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{t('setupBrowserOnly')}
      </p>
    </section>
  );
}

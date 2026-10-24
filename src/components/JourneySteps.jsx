import { Check, UserRound, ReceiptText, Sparkles } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function JourneySteps({ currentStep }) {
  const { t } = useLang();
  const steps = [
    { title: 'journeyProfile', description: 'journeyProfileDesc', icon: UserRound },
    { title: 'journeyReceipt', description: 'journeyReceiptDesc', icon: ReceiptText },
    { title: 'journeyResults', description: 'journeyResultsDesc', icon: Sparkles },
  ];
  return (
    <nav aria-label={t('journeyLabel')} className="mx-auto mb-8 w-full max-w-3xl">
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {steps.map((step, index) => {
          const active = index + 1 === currentStep;
          const complete = index + 1 < currentStep;
          const Icon = complete ? Check : step.icon;
          return (
            <li key={step.title} aria-current={active ? 'step' : undefined}
              className={`flex items-start gap-3 rounded-xl border p-3 ${active ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-violet-400/20 text-violet-200' : complete ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-white/45'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${active ? 'text-white' : 'text-white/70'}`}>{index + 1}. {t(step.title)}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{t(step.description)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

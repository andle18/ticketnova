import { useEffect, useState } from 'react';
import { Scan, Brain, BarChart3 } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function LoadingState() {
  const { t } = useLang();
  const [active, setActive] = useState(0);

  const steps = [
    { icon: Scan, label: t('stepRead') },
    { icon: Brain, label: t('stepClassify') },
    { icon: BarChart3, label: t('stepRecs') },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] p-10 animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-white/50 animate-spin" />
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === active;
            const isDone = i < active;
            return (
              <div
                key={i}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-white/10 text-white scale-[1.02]' : ''}
                  ${isDone ? 'opacity-25 text-white/60' : ''}
                  ${!isActive && !isDone ? 'opacity-35 text-white/50' : ''}
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

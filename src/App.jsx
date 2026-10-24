import { useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Apple } from 'lucide-react';
import UploadZone from './components/UploadZone';
import LoadingState from './components/LoadingState';
import MetricCards from './components/MetricCards';
import NovaChart from './components/NovaChart';
import ProductTable from './components/ProductTable';
import TopEliminate from './components/TopEliminate';
import SmartBuys from './components/SmartBuys';
import NextWeekList from './components/NextWeekList';
import LangSwitch from './components/LangSwitch';
import ProfileButton from './components/ProfileButton';
import ProfileGuidance from './components/ProfileGuidance';
import ProfileSetup from './components/ProfileSetup';
import JourneySteps from './components/JourneySteps';
import { analyzeTicket } from './lib/analyzeTicket';
import { translateAnalysis } from './lib/analysisLanguage';
import { languages, supportedLanguage } from './i18n/languages';
import { getProfile, saveProfile, clearProfile, isProfileComplete } from './lib/profile';
import { getHistory, saveAnalysis, deleteAnalysis, clearHistory } from './lib/history';
import { useLang } from './context/LangContext';

export default function App() {
  const { t, lang, setLang, languagePreference, setLanguagePreference } = useLang();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(() => getProfile());
  const [historyEntries, setHistoryEntries] = useState(() => getHistory(profile.id));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyNotice, setHistoryNotice] = useState(null);
  const [resultProfile, setResultProfile] = useState(null);
  const [openedHistoryId, setOpenedHistoryId] = useState(null);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const needsProfile = !isProfileComplete(profile) || editingProfile;
  const translatedResults = useRef(new Map());
  const requestVersion = useRef(0);
  const profileId = useRef(profile.id);

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== null && !event.key.startsWith('ticket-analyzer:')) return;
      const next = getProfile();
      if (next.id !== profileId.current) {
        requestVersion.current++;
        setResult(null);
        setFile(null);
        setUploadVersion(value => value + 1);
        setResultProfile(null);
        setOpenedHistoryId(null);
        setHistoryNotice(null);
        setLoading(false);
        setTranslating(false);
        setTranslationError(false);
        setEditingProfile(false);
        translatedResults.current.clear();
      }
      profileId.current = next.id;
      setProfile(next);
      setHistoryEntries(getHistory(next.id));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleSaveProfile = (next) => {
    if (!isProfileComplete(next)) return false;
    if (!saveProfile({ ...next, id: profile.id })) return false;
    const saved = getProfile();
    profileId.current = saved.id;
    setProfile(saved);
    setHistoryEntries(getHistory(saved.id));
    if (needsProfile) reset();
    setEditingProfile(false);
    return true;
  };

  const handleClearProfile = () => {
    if (!clearProfile()) return false;
    requestVersion.current++;
    profileId.current = null;
    setProfile(getProfile());
    setHistoryEntries([]);
    setHistoryNotice(null);
    setHistoryOpen(false);
    setFile(null);
    setUploadVersion(value => value + 1);
    setResult(null);
    setResultProfile(null);
    setOpenedHistoryId(null);
    setError(null);
    setLoading(false);
    setTranslating(false);
    setTranslationError(false);
    setEditingProfile(false);
    translatedResults.current.clear();
    return true;
  };

  const handleAnalyze = async () => {
    if (!file || loading || !isProfileComplete(profile)) return;
    const version = ++requestVersion.current;
    const analyzedProfile = { ...profile };
    setLoading(true);
    setError(null);
    setHistoryNotice(null);
    setHistoryOpen(false);
    try {
      const data = await analyzeTicket(file, analyzedProfile, { language: languagePreference, fallbackLanguage: lang });
      if (version !== requestVersion.current) return;
      setResult(data);
      setLang(data.language);
      setTranslationError(false);
      translatedResults.current = new Map([[supportedLanguage(data.language), data]]);
      setResultProfile(analyzedProfile);
      setOpenedHistoryId(null);
      if (analyzedProfile.historyEnabled && analyzedProfile.id) {
        const saved = saveAnalysis(analyzedProfile, data);
        setHistoryEntries(getHistory(analyzedProfile.id));
        setHistoryNotice(saved ? 'historySaved' : 'historySaveError');
      }
    } catch (err) {
      if (version !== requestVersion.current) return;
      console.error(err);
      setError('analysisFailed');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  const reset = () => {
    requestVersion.current++;
    setFile(null);
    setResult(null);
    setError(null);
    setOpenedHistoryId(null);
    setResultProfile(null);
    setHistoryNotice(null);
    setHistoryOpen(false);
    setTranslating(false);
    setTranslationError(false);
    translatedResults.current.clear();
  };

  const openHistoryEntry = (entry) => {
    requestVersion.current++;
    setTranslating(false);
    setResult(entry.analysis);
    setLang(entry.analysis.language);
    setLanguagePreference('auto');
    setTranslationError(false);
    translatedResults.current = new Map([[supportedLanguage(entry.analysis.language), entry.analysis]]);
    setResultProfile(entry.profileSnapshot);
    setOpenedHistoryId(entry.id);
    setHistoryOpen(false);
    setHistoryNotice(null);
    setError(null);
    setFile(null);
  };

  const changeLanguage = async (preference) => {
    if (loading || translating) return;
    const target = preference === 'auto'
      ? supportedLanguage(result?.detectedLanguage, lang)
      : supportedLanguage(preference);
    if (!result || target === result.language) {
      setLanguagePreference(preference);
      setLang(target);
      return;
    }
    const version = ++requestVersion.current;
    setTranslating(true);
    setHistoryOpen(false);
    setTranslationError(false);
    try {
      const translated = translatedResults.current.get(target) ?? await translateAnalysis(result, target);
      if (version !== requestVersion.current) return;
      translatedResults.current.set(target, translated);
      setResult(translated);
      setLang(target);
      setLanguagePreference(preference);
    } catch {
      if (version === requestVersion.current) setTranslationError(true);
    } finally {
      if (version === requestVersion.current) setTranslating(false);
    }
  };

  const removeHistoryEntry = (id) => {
    if (!deleteAnalysis(profile.id, id)) {
      setHistoryNotice('historyDeleteError');
      return;
    }
    setHistoryEntries(getHistory(profile.id));
    if (openedHistoryId === id) reset();
  };

  const removeAllHistory = () => {
    if (!clearHistory(profile.id)) {
      setHistoryNotice('historyDeleteError');
      return;
    }
    setHistoryEntries([]);
    if (openedHistoryId) reset();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-x-hidden">
      {/* Background gradient orb */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 grid-bg"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.13) 0%, transparent 65%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Apple className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">
                Ticket Analyzer
              </h1>
              <p className="text-[11px] text-white/40">
                {t('tagline')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ProfileButton
              profile={profile} onSave={handleSaveProfile} onClear={handleClearProfile} disabled={loading || translating}
              canViewHistory={Boolean(result) && !needsProfile} historyOpen={historyOpen && Boolean(result) && !needsProfile}
              historyEntries={historyEntries} historyNotice={result ? historyNotice : null}
              onHistory={() => { if (result) setHistoryOpen(true); }}
              onCloseHistory={() => setHistoryOpen(false)} onOpenHistory={openHistoryEntry}
              onDeleteHistory={removeHistoryEntry} onClearHistory={removeAllHistory}
            />
            <LangSwitch onChange={changeLanguage} disabled={loading || translating} />
            {result && !needsProfile && (
              <button
                onClick={reset}
                disabled={translating}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl border border-white/10 text-white/55 hover:border-white/25 hover:text-white/85 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('newTicket')}
              </button>
            )}
          </div>
        </header>

        {profile.name && !needsProfile && (
          <p className="mb-6 text-center text-base text-white/75 break-words">
            {t('greeting')}, {profile.name}
          </p>
        )}

        <JourneySteps currentStep={needsProfile ? 1 : result ? 3 : 2} />

        {needsProfile && <ProfileSetup key={profile.id ?? 'new-profile'} profile={profile} onSave={handleSaveProfile} />}

        {/* Upload hero */}
        {!result && !needsProfile && (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 animate-fade-in">
              {t('receiptStepTitle')}
            </h2>

            <p className="text-sm leading-relaxed text-white/60 mb-6 max-w-lg animate-fade-in">
              {t('receiptStepDescription')}
            </p>

            <div className="w-full max-w-lg space-y-4 animate-slide-up">
              <UploadZone key={uploadVersion} onFile={setFile} disabled={loading} />

              {file && !loading && (
                <div className="flex justify-end animate-slide-up">
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('analyzeBtn')}
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-left animate-slide-up">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">{t('errorTitle')}</p>
                    <p className="text-xs text-red-400/70 mt-1">{t(error)}</p>
                    <p className="text-xs text-red-400/50 mt-2">
                      {t('errorHint')}
                    </p>
                  </div>
                </div>
              )}

              {loading && <LoadingState />}
            </div>
            {!loading && <button type="button" onClick={() => { setEditingProfile(true); setFile(null); setError(null); }} className="mt-4 min-h-11 px-3 text-xs text-white/65 underline hover:text-white">{t('reviewProfile')}</button>}
          </div>
        )}

        {/* Results dashboard */}
        {result && !needsProfile && (
          <div className="space-y-4 animate-fade-in">
            <section aria-labelledby="results-intro-title" className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5">
              <h2 id="results-intro-title" className="text-xl font-semibold text-white">{t('resultsStepTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{t('resultsStepDescription')}</p>
              <p className="mt-3 text-xs leading-relaxed text-white/55">{t('resultsDownloadHint')}</p>
            </section>
            <p className="text-xs text-white/60">{t('languageStatus', { language: languages[supportedLanguage(result.language)].name })}</p>
            {result.detectedLanguage === 'und' && <p className="text-xs text-amber-200">{t('languageUndetermined')}</p>}
            {translating && <p role="status" className="text-sm text-violet-300">{t('translating')}</p>}
            {translationError && <p role="alert" className="text-sm text-red-300">{t('translationFailed')}</p>}
            {openedHistoryId && <p className="text-xs text-violet-300">{t('historyViewing')}</p>}
            {/* Meta info */}
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
                {result.store || t('historyUnknownStore')}
              </span>
              {result.location && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
                  {result.location}
                </span>
              )}
              {result.date && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
                  {result.date}
                </span>
              )}
            </div>

            <MetricCards
              summary={result.summary}
              productsCount={result.products.length}
              currency={result.currency}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <NovaChart summary={result.summary} />
              <ProductTable products={result.products} currency={result.currency} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <TopEliminate items={result.topEliminate} currency={result.currency} />
              <SmartBuys items={result.smartBuys} currency={result.currency} />
            </div>

            <NextWeekList
              data={result.nextWeek}
              currentTotal={result.total}
              currency={result.currency}
            />

            {result.notes && (
              <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={2} />
                </div>
                <p className="text-sm text-amber-200/75 leading-relaxed">{result.notes}</p>
              </div>
            )}

            <ProfileGuidance data={result.profileGuidance} profile={resultProfile} />
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-white/[0.06] text-center text-xs text-white/20">
          {t('footer')}
        </footer>
      </div>
    </div>
  );
}

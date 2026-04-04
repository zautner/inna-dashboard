import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  Instagram, 
  Facebook, 
  Video, 
  FileText, 
  Settings,
  Sparkles,
  MapPin,
  Users,
  MessageSquare,
  Smartphone,
  Image as ImageIcon,
  CalendarDays,
  TerminalSquare,
  Save,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import ConfigurationPage from './components/ConfigurationPage';
import BotStatusPage from './components/BotStatusPage';

const APP_VERSION = '1.1.0';

interface InnaContext {
  name: string;
  specialty: string;
  location: string;
  philosophy: string;
  voice: {
    tone: string;
    forbiddenWords: string[];
    style: string;
  };
  targetAudience: string;
  quotes: string[];
}

interface SaveNotice {
  message: string;
  savedAt: string;
}

const DEFAULT_INNA_CONTEXT: InnaContext = {
  name: 'Inna',
  specialty: 'Shiatsu & Chinese Medicine',
  location: 'Tel Aviv, Gush Dan (Givatayim, Ramat Gan, Holon, Bat Yam)',
  philosophy: "Shiatsu is about touch and Qi flow. It's not just physical tissue; it's about helping the body heal itself by smoothing the flow of energy.",
  voice: {
    tone: 'Warm, human, expert but accessible, no corporate jargon, first-person.',
    forbiddenWords: ['my dear', 'sweetie', 'listen to me', 'I know best', 'final decision'],
    style: 'Short, to the point, leaving room for discussion.',
  },
  targetAudience: 'Women 40+, often with orthopedic issues (back, neck, shoulder pain), general fatigue, or lack of sleep.',
  quotes: [
    'Shiatsu is about Qi flow. If there is smooth flow, the person feels good. If there is stagnation, we feel pain.',
    'The treatment is who you are. The difference between masters is the quality of touch.',
    "I don't believe in just massage. Only the brain can release the muscle. In Shiatsu, we create a connection with the brain.",
    "It's a dialogue between practitioner and patient.",
  ],
};

const parseListFromTextarea = (value: string) =>
  value
    .split('\n')
    .map(part => part.trim())
    .filter(Boolean);

const normalizeContext = (raw: unknown): InnaContext => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<InnaContext> & { voice?: Partial<InnaContext['voice']> };
  const sourceVoice: Partial<InnaContext['voice']> = source.voice && typeof source.voice === 'object' ? source.voice : {};
  return {
    name: typeof source.name === 'string' && source.name.trim() ? source.name.trim() : DEFAULT_INNA_CONTEXT.name,
    specialty: typeof source.specialty === 'string' && source.specialty.trim() ? source.specialty.trim() : DEFAULT_INNA_CONTEXT.specialty,
    location: typeof source.location === 'string' && source.location.trim() ? source.location.trim() : DEFAULT_INNA_CONTEXT.location,
    philosophy: typeof source.philosophy === 'string' && source.philosophy.trim() ? source.philosophy.trim() : DEFAULT_INNA_CONTEXT.philosophy,
    voice: {
      tone: typeof sourceVoice.tone === 'string' && sourceVoice.tone.trim() ? sourceVoice.tone.trim() : DEFAULT_INNA_CONTEXT.voice.tone,
      forbiddenWords: Array.isArray(sourceVoice.forbiddenWords)
        ? sourceVoice.forbiddenWords.filter((word): word is string => typeof word === 'string' && word.trim().length > 0).map(word => word.trim())
        : [...DEFAULT_INNA_CONTEXT.voice.forbiddenWords],
      style: typeof sourceVoice.style === 'string' && sourceVoice.style.trim() ? sourceVoice.style.trim() : DEFAULT_INNA_CONTEXT.voice.style,
    },
    targetAudience: typeof source.targetAudience === 'string' && source.targetAudience.trim() ? source.targetAudience.trim() : DEFAULT_INNA_CONTEXT.targetAudience,
    quotes: Array.isArray(source.quotes)
      ? source.quotes.filter((quote): quote is string => typeof quote === 'string' && quote.trim().length > 0).map(quote => quote.trim())
      : [...DEFAULT_INNA_CONTEXT.quotes],
  };
};

const getLocationChips = (location: string): string[] => {
  const chips = location
    .replace(/[()]/g, ',')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  return chips.length ? chips : [location];
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'strategy' | 'configuration' | 'bot'>('dashboard');
  const [queueStats, setQueueStats] = useState({ inQueue: 0, draftsPending: 0, approved: 0 });
  const [innaContext, setInnaContext] = useState<InnaContext>(DEFAULT_INNA_CONTEXT);
  const [contextDraft, setContextDraft] = useState<InnaContext>(DEFAULT_INNA_CONTEXT);
  const [isContextLoading, setIsContextLoading] = useState(false);
  const [isContextSaving, setIsContextSaving] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextSaveNotice, setContextSaveNotice] = useState<SaveNotice | null>(null);

  useEffect(() => {
    fetch('/api/queue-stats')
      .then(r => r.json())
      .then(data => setQueueStats(data))
      .catch(err => console.error('Failed to load queue stats:', err));
  }, []);

  const loadInnaContext = async () => {
    setIsContextLoading(true);
    try {
      const res = await fetch('/api/inna-context');
      if (!res.ok) {
        setContextError('Could not load business context.');
        setContextSaveNotice(null);
        return;
      }
      const payload = normalizeContext(await res.json());
      setInnaContext(payload);
      setContextDraft(payload);
      setContextError(null);
      setContextSaveNotice(null);
    } catch {
      setContextError('Could not load business context.');
      setContextSaveNotice(null);
    } finally {
      setIsContextLoading(false);
    }
  };

  useEffect(() => {
    loadInnaContext();
  }, []);

  const hasContextChanges = JSON.stringify(contextDraft) !== JSON.stringify(innaContext);

  const handleSaveContext = async () => {
    setIsContextSaving(true);
    try {
      const res = await fetch('/api/inna-context', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextDraft),
      });
      if (!res.ok) {
        setContextError('Could not save business context.');
        setContextSaveNotice(null);
        return;
      }
      const payload = normalizeContext(await res.json());
      setInnaContext(payload);
      setContextDraft(payload);
      setContextError(null);
      setContextSaveNotice({
        message: 'Business context saved.',
        savedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    } catch {
      setContextError('Could not save business context.');
      setContextSaveNotice(null);
    } finally {
      setIsContextSaving(false);
    }
  };

  useEffect(() => {
    if (!contextSaveNotice) return;
    const timer = window.setTimeout(() => setContextSaveNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [contextSaveNotice]);

  const telegramUrl = process.env.TELEGRAM_BOT_USERNAME
    ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}`
    : null;

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-blue-100 palette-darken-20">
      {/* Mobile Nav */}
      <div className="lg:hidden bg-white border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <h1 className="font-bold text-slate-900">Inna AI</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('dashboard')} className={cn("p-2", activeTab === 'dashboard' ? "text-blue-500" : "text-slate-400")}>
            <LayoutDashboard size={20} />
          </button>
          <button onClick={() => setActiveTab('configuration')} className={cn("p-2", activeTab === 'configuration' ? "text-blue-500" : "text-slate-400")}>
            <CalendarDays size={20} />
          </button>
          <button onClick={() => setActiveTab('bot')} className={cn("p-2", activeTab === 'bot' ? "text-blue-500" : "text-slate-400")}>
            <TerminalSquare size={20} />
          </button>
          <button onClick={() => setActiveTab('strategy')} className={cn("p-2", activeTab === 'strategy' ? "text-blue-500" : "text-slate-400")}>
            <FileText size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 z-50 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Inna AI</h1>
              <p className="text-xs text-slate-400">Social Media Agent · v{APP_VERSION}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Command Center" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<CalendarDays size={20} />} 
            label="Configuration" 
            active={activeTab === 'configuration'} 
            onClick={() => setActiveTab('configuration')} 
          />
          <NavItem
            icon={<TerminalSquare size={20} />}
            label="Bot Monitor"
            active={activeTab === 'bot'}
            onClick={() => setActiveTab('bot')}
          />
          <NavItem
            icon={<FileText size={20} />}
            label="Business Strategy"
            active={activeTab === 'strategy'}
            onClick={() => setActiveTab('strategy')}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Connected Accounts</p>
            <div className="flex gap-2">
              <Instagram size={16} className="text-pink-500" />
              <Facebook size={16} className="text-blue-600" />
              <Video size={16} className="text-black" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        <header className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && "Command Center"}
              {activeTab === 'configuration' && "Plan Configuration"}
              {activeTab === 'bot' && "Bot Monitor"}
              {activeTab === 'strategy' && "Business Strategy 2025"}
            </h2>
            <p className="text-slate-500">
              {activeTab === 'dashboard' && "Your Telegram-first media pipeline"}
              {activeTab === 'configuration' && "Manage your upcoming content plans"}
              {activeTab === 'bot' && "Recent bot commands, operational outcomes, and severe errors"}
              {activeTab === 'strategy' && "Roadmap and goals for Shiatsu Inna"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">v{APP_VERSION}</span>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://picsum.photos/seed/inna/100/100" alt="Inna" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">The bot is waiting for your media!</h3>
                    <p className="text-blue-100 mb-6 leading-relaxed">
                      The workflow has moved entirely to Telegram. Upload your photos and videos for the upcoming week directly to the bot. It will automatically generate authentic posts and send them back to you for approval.
                    </p>
                    <div className="flex gap-4">
                      {telegramUrl ? (
                        <a href={telegramUrl} target="_blank" rel="noreferrer" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                          <Smartphone size={18} />
                          Open Telegram Bot
                        </a>
                      ) : (
                        <span className="bg-white/50 text-blue-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-default select-none">
                          <Smartphone size={18} />
                          Open Telegram Bot
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-64 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Clock size={16} /> How it works
                    </h4>
                    <ul className="space-y-3 text-sm text-blue-50">
                      <li className="flex items-start gap-2">
                        <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                        Upload photos/videos via Telegram
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                        Send /process to start generating
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                        Approve, Rethink, or Cancel directly in chat
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Queue</p>
                    <p className="text-2xl font-bold text-slate-900">{queueStats.inQueue}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts Pending</p>
                    <p className="text-2xl font-bold text-slate-900">{queueStats.draftsPending}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                    <p className="text-2xl font-bold text-slate-900">{queueStats.approved}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'configuration' && (
            <motion.div 
              key="configuration"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ConfigurationPage />
            </motion.div>
          )}

          {activeTab === 'bot' && (
            <motion.div
              key="bot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BotStatusPage />
            </motion.div>
          )}

          {activeTab === 'strategy' && (
            <motion.div 
              key="strategy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <LayoutDashboard className="text-blue-500" />
                    Executive Summary
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    AI-driven social media promotion for {innaContext.name}'s {innaContext.specialty} practice.
                    Targeting {innaContext.targetAudience} in {innaContext.location}.
                    {innaContext.philosophy}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Primary Goal</p>
                      <p className="text-slate-900 font-semibold">+20% Monthly Growth</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Target Region</p>
                      <p className="text-slate-900 font-semibold">Gush Dan Area</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users className="text-blue-500" />
                    Target Audience Segments
                  </h3>
                  <div className="space-y-4">
                    <AudienceItem title="Primary Audience" desc={innaContext.targetAudience} />
                    <AudienceItem title="Location Focus" desc={innaContext.location} />
                    <AudienceItem title="Core Specialty" desc={innaContext.specialty} />
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-blue-500" />
                    Roadmap 2025
                  </h3>
                  <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    <RoadmapStep month="Month 1" title="Foundation" desc="Setup AI agent, define voice, connect Meta API." active />
                    <RoadmapStep month="Month 2" title="Growth" desc="Expand to TikTok, start local geotargeting campaigns." />
                    <RoadmapStep month="Month 3" title="Optimization" desc="Analyze performance, refine content based on engagement." />
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-900">Persona Context Editor</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadInnaContext}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <RefreshCw size={14} className={cn(isContextLoading && 'animate-spin')} /> Reload
                      </button>
                      <button
                        onClick={handleSaveContext}
                        disabled={!hasContextChanges || isContextSaving}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white',
                          hasContextChanges && !isContextSaving ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'
                        )}
                      >
                        <Save size={14} /> {isContextSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  {contextError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      {contextError}
                    </div>
                  )}
                  {contextSaveNotice && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
                      <div className="font-medium">{contextSaveNotice.message}</div>
                      <div className="text-xs text-emerald-600 mt-0.5">Saved at {contextSaveNotice.savedAt}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    <LabeledInput label="Name" value={contextDraft.name} onChange={(value) => setContextDraft(prev => ({ ...prev, name: value }))} />
                    <LabeledInput label="Specialty" value={contextDraft.specialty} onChange={(value) => setContextDraft(prev => ({ ...prev, specialty: value }))} />
                    <LabeledInput label="Location" value={contextDraft.location} onChange={(value) => setContextDraft(prev => ({ ...prev, location: value }))} />
                    <LabeledTextarea label="Philosophy" rows={3} value={contextDraft.philosophy} onChange={(value) => setContextDraft(prev => ({ ...prev, philosophy: value }))} />
                    <LabeledTextarea label="Target Audience" rows={2} value={contextDraft.targetAudience} onChange={(value) => setContextDraft(prev => ({ ...prev, targetAudience: value }))} />
                    <LabeledTextarea label="Voice Tone" rows={2} value={contextDraft.voice.tone} onChange={(value) => setContextDraft(prev => ({ ...prev, voice: { ...prev.voice, tone: value } }))} />
                    <LabeledTextarea label="Voice Style" rows={2} value={contextDraft.voice.style} onChange={(value) => setContextDraft(prev => ({ ...prev, voice: { ...prev.voice, style: value } }))} />
                    <LabeledTextarea
                      label="Forbidden Words (one per line)"
                      rows={4}
                      value={contextDraft.voice.forbiddenWords.join('\n')}
                      onChange={(value) => setContextDraft(prev => ({ ...prev, voice: { ...prev.voice, forbiddenWords: parseListFromTextarea(value) } }))}
                    />
                    <LabeledTextarea
                      label="Quotes (one per line)"
                      rows={5}
                      value={contextDraft.quotes.join('\n')}
                      onChange={(value) => setContextDraft(prev => ({ ...prev, quotes: parseListFromTextarea(value) }))}
                    />
                  </div>
                </section>

                <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="text-blue-400" />
                    {innaContext.name}'s Voice
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Philosophy</p>
                      <p className="text-sm italic text-slate-300">"{innaContext.quotes[0] ?? innaContext.philosophy}"</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tone Guidelines</p>
                      <ul className="text-sm space-y-2 text-slate-300">
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> {innaContext.voice.tone}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> {innaContext.voice.style}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> Forbidden: {innaContext.voice.forbiddenWords.join(', ')}</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="text-blue-500" />
                    Geotargeting
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getLocationChips(innaContext.location).map(city => (
                      <span key={city} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-100">
                        {city}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </label>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
        active
          ? "bg-blue-50 text-blue-600 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
    </button>
  );
}

function AudienceItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
        <Users size={20} />
      </div>
      <div>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function RoadmapStep({ month, title, desc, active = false }: { month: string, title: string, desc: string, active?: boolean }) {
  return (
    <div className="relative pl-10">
      <div className={cn(
        "absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2",
        active ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-100 text-slate-300"
      )}>
        {active ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
      </div>
      <div>
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{month}</span>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

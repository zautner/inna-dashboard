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
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'strategy'>('dashboard');

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 font-sans selection:bg-orange-100">
      {/* Mobile Nav */}
      <div className="lg:hidden bg-white border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <h1 className="font-bold text-slate-900">Inna AI</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('dashboard')} className={cn("p-2", activeTab === 'dashboard' ? "text-orange-500" : "text-slate-400")}>
            <LayoutDashboard size={20} />
          </button>
          <button onClick={() => setActiveTab('strategy')} className={cn("p-2", activeTab === 'strategy' ? "text-orange-500" : "text-slate-400")}>
            <FileText size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 z-50 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Inna AI</h1>
              <p className="text-xs text-slate-400">Social Media Agent</p>
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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && "Command Center"}
              {activeTab === 'strategy' && "Business Strategy 2025"}
            </h2>
            <p className="text-slate-500">
              {activeTab === 'dashboard' && "Your Telegram-first media pipeline"}
              {activeTab === 'strategy' && "Roadmap and goals for Shiatsu Inna"}
            </p>
          </div>
          <div className="flex items-center gap-4">
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
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">The bot is waiting for your media!</h3>
                    <p className="text-orange-100 mb-6 leading-relaxed">
                      The workflow has moved entirely to Telegram. Upload your photos and videos for the upcoming week directly to the bot. It will automatically generate authentic posts and send them back to you for approval.
                    </p>
                    <div className="flex gap-4">
                      <a href="#" className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                        <Smartphone size={18} />
                        Open Telegram Bot
                      </a>
                    </div>
                  </div>
                  <div className="w-full md:w-64 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Clock size={16} /> How it works
                    </h4>
                    <ul className="space-y-3 text-sm text-orange-50">
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
                    <p className="text-2xl font-bold text-slate-900">0</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts Pending</p>
                    <p className="text-2xl font-bold text-slate-900">0</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                    <p className="text-2xl font-bold text-slate-900">0</p>
                  </div>
                </div>
              </div>
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
                    <LayoutDashboard className="text-orange-500" />
                    Executive Summary
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    AI-driven social media promotion for Inna's Shiatsu practice. 
                    Targeting women 40+ in Tel Aviv and Gush Dan (Givatayim, Ramat Gan, Holon, Bat Yam).
                    Inna maintains full control via an approval-based workflow.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-2xl">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Primary Goal</p>
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
                    <Users className="text-orange-500" />
                    Target Audience Segments
                  </h3>
                  <div className="space-y-4">
                    <AudienceItem title="Busy Professionals" desc="Stress relief and neck/shoulder pain from desk work." />
                    <AudienceItem title="Active Women 40+" desc="Orthopedic support and maintaining vitality." />
                    <AudienceItem title="Local Residents" desc="Seeking a trusted practitioner in their neighborhood." />
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-orange-500" />
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
                <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="text-orange-400" />
                    Inna's Voice
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Philosophy</p>
                      <p className="text-sm italic text-slate-300">"The treatment is who you are. It's a dialogue between practitioner and patient."</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tone Guidelines</p>
                      <ul className="text-sm space-y-2 text-slate-300">
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> Warm & Human</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> Expert but Accessible</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> No Aggressive Sales</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="text-orange-500" />
                    Geotargeting
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["Tel Aviv", "Givatayim", "Ramat Gan", "Holon", "Bat Yam"].map(city => (
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

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
        active 
          ? "bg-orange-50 text-orange-600 shadow-sm" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
    </button>
  );
}

function AudienceItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
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
        active ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-100 text-slate-300"
      )}>
        {active ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
      </div>
      <div>
        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{month}</span>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

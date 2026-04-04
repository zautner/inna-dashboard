import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, TerminalSquare, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface BotCommandEntry {
  id: string;
  timestamp: string;
  command?: string;
  outcome?: string;
  severity?: string;
  summary?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

interface BotErrorEntry {
  id: string;
  timestamp: string;
  source?: string;
  command?: string;
  item_id?: string;
  severity?: string;
  summary?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

interface BotMonitorResponse {
  commands: BotCommandEntry[];
  severeErrors: BotErrorEntry[];
  lastUpdatedAt: string | null;
  publishing: {
    waitingForApproval: number;
    waitingForSchedule: number;
    scheduledTargets: number;
    publishedTargets: number;
    failedTargets: number;
    nextPublishAt: string | null;
    upcoming: Array<{
      id: string;
      planName: string;
      caption: string;
      publishAt: string;
      targets: string[];
    }>;
  };
}

const DEFAULT_DATA: BotMonitorResponse = {
  commands: [],
  severeErrors: [],
  lastUpdatedAt: null,
  publishing: {
    waitingForApproval: 0,
    waitingForSchedule: 0,
    scheduledTargets: 0,
    publishedTargets: 0,
    failedTargets: 0,
    nextPublishAt: null,
    upcoming: [],
  },
};

export default function BotStatusPage() {
  const [data, setData] = useState<BotMonitorResponse>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchMonitor = async (background = false) => {
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch('/api/bot-monitor');
      if (!res.ok) {
        setLoadError('Could not load bot monitoring data.');
        return;
      }
      const payload: BotMonitorResponse = await res.json();
      setData({
        commands: Array.isArray(payload.commands) ? payload.commands : [],
        severeErrors: Array.isArray(payload.severeErrors) ? payload.severeErrors : [],
        lastUpdatedAt: payload.lastUpdatedAt ?? null,
        publishing: payload.publishing ?? DEFAULT_DATA.publishing,
      });
      setLoadError(null);
    } catch {
      setLoadError('Could not load bot monitoring data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitor();
    const timer = window.setInterval(() => {
      fetchMonitor(true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    const successCount = data.commands.filter(command => command.outcome === 'success').length;
    const noopCount = data.commands.filter(command => command.outcome === 'noop').length;
    const errorCount = data.commands.filter(command => command.outcome === 'error').length;
    return { successCount, noopCount, errorCount };
  }, [data.commands]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Bot Monitor</h3>
            <p className="text-slate-500 mt-1">Recent Telegram command results and severe bot errors from the shared activity log.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              Last update:{' '}
              <span className="font-medium text-slate-700">
                {data.lastUpdatedAt ? formatTimestamp(data.lastUpdatedAt) : 'No activity yet'}
              </span>
            </div>
            <button
              onClick={() => fetchMonitor(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <MetricCard icon={<TerminalSquare size={18} />} label="Recent Commands" value={String(data.commands.length)} tone="blue" />
          <MetricCard icon={<CheckCircle2 size={18} />} label="Successful" value={String(summary.successCount)} tone="green" />
          <MetricCard icon={<Clock size={18} />} label="No-op / Informational" value={String(summary.noopCount)} tone="amber" />
          <MetricCard icon={<AlertTriangle size={18} />} label="Severe Errors" value={String(data.severeErrors.length)} tone="red" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <MetricCard icon={<Clock size={18} />} label="Scheduled Targets" value={String(data.publishing.scheduledTargets)} tone="blue" />
          <MetricCard icon={<CheckCircle2 size={18} />} label="Published Targets" value={String(data.publishing.publishedTargets)} tone="green" />
          <MetricCard icon={<AlertTriangle size={18} />} label="Failed Targets" value={String(data.publishing.failedTargets)} tone="red" />
          <MetricCard icon={<TerminalSquare size={18} />} label="Waiting For Approval" value={String(data.publishing.waitingForApproval)} tone="amber" />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>Next scheduled publish: <strong className="text-slate-900">{data.publishing.nextPublishAt ? formatTimestamp(data.publishing.nextPublishAt) : 'None scheduled'}</strong></span>
          <span>Approved items missing schedule: <strong className="text-slate-900">{data.publishing.waitingForSchedule}</strong></span>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-blue-500" size={20} />
          <h4 className="text-lg font-bold text-slate-900">Upcoming Scheduled Publications</h4>
        </div>

        {isLoading ? (
          <LoadingState label="Loading publication schedule…" />
        ) : data.publishing.upcoming.length === 0 ? (
          <EmptyState title="No upcoming scheduled publications" description="Approve items in Telegram after setting the plan start date in the dashboard." />
        ) : (
          <div className="space-y-4">
            {data.publishing.upcoming.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">scheduled</span>
                      <span className="font-semibold text-slate-900">{item.planName || 'Untitled plan item'}</span>
                      <span className="text-xs text-slate-400">{formatTimestamp(item.publishAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600 wrap-break-word">{item.caption || 'No caption available.'}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.targets.map(target => <MetaChip key={target} label={target} />)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <TerminalSquare className="text-blue-500" size={20} />
            <h4 className="text-lg font-bold text-slate-900">Last Bot Commands</h4>
          </div>

          {isLoading ? (
            <LoadingState label="Loading command history…" />
          ) : data.commands.length === 0 ? (
            <EmptyState title="No commands yet" description="Run a bot command in Telegram to populate this feed." />
          ) : (
            <div className="space-y-4">
              {data.commands.map(entry => (
                <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusPill outcome={entry.outcome} severity={entry.severity} />
                        <span className="font-semibold text-slate-900">/{entry.command ?? 'unknown'}</span>
                        <span className="text-xs text-slate-400">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{entry.summary || 'No summary provided.'}</p>
                      {entry.details && <p className="text-sm text-slate-500 wrap-break-word">{entry.details}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="text-red-500" size={20} />
            <h4 className="text-lg font-bold text-slate-900">Severe Bot Errors</h4>
          </div>

          {isLoading ? (
            <LoadingState label="Loading severe errors…" />
          ) : data.severeErrors.length === 0 ? (
            <EmptyState title="No severe errors" description="Critical bot failures will appear here automatically." />
          ) : (
            <div className="space-y-4">
              {data.severeErrors.map(error => (
                <div key={error.id} className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <SeverityPill severity={error.severity} />
                    <span className="font-semibold text-slate-900">{error.source ?? 'bot'}</span>
                    <span className="text-xs text-slate-400">{formatTimestamp(error.timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium text-red-900">{error.summary || 'Unknown error'}</p>
                  {error.details && <p className="text-sm text-red-800/80 mt-1 wrap-break-word">{error.details}</p>}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-red-700">
                    {error.command && <MetaChip label={`/${error.command}`} />}
                    {error.item_id && <MetaChip label={`Item ${error.item_id}`} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  } as const;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', tones[tone])}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function StatusPill({ outcome, severity }: { outcome?: string; severity?: string }) {
  const normalizedOutcome = outcome ?? 'unknown';
  const tone = normalizedOutcome === 'success'
    ? 'bg-green-100 text-green-700 border-green-200'
    : normalizedOutcome === 'noop'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-700 border-red-200';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', tone)}>
      {normalizedOutcome === 'success' ? <CheckCircle2 size={12} /> : normalizedOutcome === 'noop' ? <Clock size={12} /> : <XCircle size={12} />}
      {normalizedOutcome}{severity === 'warning' ? ' · warning' : ''}
    </span>
  );
}

function SeverityPill({ severity }: { severity?: string }) {
  const normalized = severity ?? 'error';
  const tone = normalized === 'critical'
    ? 'bg-red-600 text-white border-red-600'
    : 'bg-red-100 text-red-700 border-red-200';

  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase', tone)}>{normalized}</span>;
}

function MetaChip({ label }: { label: string }) {
  return <span className="rounded-full bg-white/80 border border-red-200 px-2 py-1">{label}</span>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="text-sm text-slate-500">{label}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

function formatTimestamp(timestamp?: string | null) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
}



import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, BookOpenText, FileText, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface HelpDocument {
  id: string;
  title: string;
  relativePath: string;
  updatedAt: string | null;
  available: boolean;
  content: string;
  error?: string;
}

interface HelpDocsResponse {
  documents: HelpDocument[];
}

const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return 'Unavailable';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Unavailable'
    : parsed.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
};

export default function HelpPage() {
  const [documents, setDocuments] = useState<HelpDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string>('dashboard-readme');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/help-docs');
      if (!response.ok) {
        setDocuments([]);
        setError('Could not load help documents.');
        return;
      }

      const payload = (await response.json()) as HelpDocsResponse;
      const nextDocuments = Array.isArray(payload.documents) ? payload.documents : [];
      setDocuments(nextDocuments);

      if (!nextDocuments.some((document) => document.id === activeDocumentId)) {
        setActiveDocumentId(nextDocuments[0]?.id ?? 'dashboard-readme');
      }
    } catch (loadError) {
      setDocuments([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load help documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? documents[0] ?? null,
    [activeDocumentId, documents]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-medium">
              <BookOpenText size={16} /> Workspace help
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Product and bot documentation in one place</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                This page shows the repository-level documentation from <code>README.md</code> and the bot-specific guide from <code>bot/README.md</code>.
                Use it when you need setup steps, environment variable details, publishing notes, or bot workflow instructions without leaving the dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={loadDocuments}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium border transition-colors',
              isLoading
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-wait'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
            {isLoading ? 'Refreshing…' : 'Refresh docs'}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <aside className="space-y-3">
          {documents.map((document) => {
            const isActive = document.id === (activeDocument?.id ?? '');
            return (
              <button
                key={document.id}
                onClick={() => setActiveDocumentId(document.id)}
                className={cn(
                  'w-full text-left rounded-3xl border p-4 shadow-sm transition-all bg-white',
                  isActive
                    ? 'border-blue-200 ring-2 ring-blue-100'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <FileText size={16} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                      {document.title}
                    </div>
                    <div className="mt-1 text-xs font-mono text-slate-400">{document.relativePath}</div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                      document.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    )}
                  >
                    {document.available ? 'Ready' : 'Missing'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Last updated: <span className="font-medium text-slate-600">{formatUpdatedAt(document.updatedAt)}</span>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-128">
          {isLoading && !documents.length ? (
            <div className="h-full min-h-128 flex items-center justify-center text-slate-500">
              Loading help documents…
            </div>
          ) : activeDocument ? (
            <>
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/70">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg font-bold text-slate-900">{activeDocument.title}</h4>
                  <div className="text-sm text-slate-500 font-mono">{activeDocument.relativePath}</div>
                </div>
              </div>
              <div className="px-6 py-6 lg:px-8 lg:py-8">
                {activeDocument.available ? (
                  <div className="help-markdown">
                    <ReactMarkdown
                      components={{
                        a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                      }}
                    >
                      {activeDocument.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                    <div>
                      <div className="font-medium">This document could not be loaded.</div>
                      <div className="mt-1">{activeDocument.error ?? 'Unknown error.'}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-128 flex items-center justify-center text-slate-500 px-6 text-center">
              No help documents are available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}



import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, Video, CalendarDays, CheckCircle2, Clock, XCircle, Send, X, Save, Pencil, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export type PlanType = 'week' | 'month' | 'quarter';
export type MediaType = 'photo' | 'video' | 'any';
export type UploadedMediaType = Exclude<MediaType, 'any'>;
export type ContentType = 'Instagram Feed' | 'Instagram Story' | 'Instagram Reel' | 'Facebook Post' | 'TikTok Video';
export const CONTENT_TYPES: ContentType[] = ['Instagram Feed', 'Instagram Story', 'Instagram Reel', 'Facebook Post', 'TikTok Video'];
export type PostStatus = 'preparing' | 'waiting for approval' | 'approved' | 'posted' | 'canceled';
export type PlanStatus = 'open' | 'closed';

export interface PlanItem {
  id: string;
  day: string;
  publishAt?: string;
  mediaType: MediaType;
  uploadedMediaType?: UploadedMediaType;
  contentTypes: ContentType[];
  status: PostStatus;
  mediaUrl?: string;
  tags: string[];
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  status: PlanStatus;
  items: PlanItem[];
}

const inferUploadedMediaType = (mediaUrl?: string, mediaType?: MediaType): UploadedMediaType | undefined => {
  if (mediaUrl) {
    const lowerUrl = mediaUrl.toLowerCase();
    if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].some(ext => lowerUrl.endsWith(ext))) return 'video';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].some(ext => lowerUrl.endsWith(ext))) return 'photo';
  }

  if (mediaType === 'photo' || mediaType === 'video') return mediaType;
  return undefined;
};

const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatPublishAt = (value?: string): string => {
  if (!value) return 'No publish time set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const normalizePlan = (rawPlan: any): Plan => ({
  id: String(rawPlan?.id ?? crypto.randomUUID()),
  name: String(rawPlan?.name ?? 'Untitled Plan'),
  type: rawPlan?.type === 'month' || rawPlan?.type === 'quarter' ? rawPlan.type : 'week',
  status: rawPlan?.status === 'closed' ? 'closed' : 'open',
  items: Array.isArray(rawPlan?.items)
    ? rawPlan.items.map((item: any, index: number): PlanItem => ({
        id: String(item?.id ?? `${rawPlan?.id ?? 'plan'}-${index}`),
        day: String(item?.day ?? ''),
        publishAt: typeof item?.publishAt === 'string' ? item.publishAt : undefined,
        mediaType: item?.mediaType === 'photo' || item?.mediaType === 'video' || item?.mediaType === 'any' ? item.mediaType : 'any',
        uploadedMediaType: item?.uploadedMediaType === 'photo' || item?.uploadedMediaType === 'video'
          ? item.uploadedMediaType
          : inferUploadedMediaType(item?.mediaUrl, item?.mediaType),
        contentTypes: Array.isArray(item?.contentTypes) && item.contentTypes.length > 0
          ? item.contentTypes.filter((contentType: unknown): contentType is ContentType => CONTENT_TYPES.includes(contentType as ContentType))
          : ['Instagram Feed'],
        status: item?.status === 'waiting for approval' || item?.status === 'approved' || item?.status === 'posted' || item?.status === 'canceled'
          ? item.status
          : 'preparing',
        mediaUrl: typeof item?.mediaUrl === 'string' ? item.mediaUrl : undefined,
        tags: Array.isArray(item?.tags) ? item.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
      }))
    : [],
});

const getDefaultRequirements = (type: PlanType): {day: string, mediaType: MediaType, contentTypes: ContentType[]}[] => {
  if (type === 'week') {
    return [
      { day: 'Monday', mediaType: 'photo', contentTypes: ['Instagram Feed', 'Facebook Post'] },
      { day: 'Wednesday', mediaType: 'video', contentTypes: ['Instagram Story'] },
      { day: 'Friday', mediaType: 'video', contentTypes: ['Instagram Reel', 'TikTok Video'] },
    ];
  } else if (type === 'month') {
    return Array.from({ length: 8 }).map((_, i) => ({
      day: `Week ${Math.floor(i/2) + 1} - ${i % 2 === 0 ? 'Tuesday' : 'Thursday'}`,
      mediaType: i % 2 === 0 ? 'photo' : 'video',
      contentTypes: i % 2 === 0 ? ['Instagram Feed', 'Facebook Post'] : ['Instagram Reel', 'TikTok Video']
    }));
  } else {
    // quarter
    return Array.from({ length: 12 }).map((_, i) => ({
      day: `Month ${Math.floor(i/4) + 1}, Week ${(i%4) + 1}`,
      mediaType: 'any',
      contentTypes: ['Facebook Post', 'Instagram Feed']
    }));
  }
};

export default function ConfigurationPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // Track File objects for items that have local (not-yet-uploaded) media
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());
  // IDs of items whose media failed to upload on the last save
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);

  // Form state
  const [planType, setPlanType] = useState<PlanType>('week');
  const [requirements, setRequirements] = useState<{day: string, mediaType: MediaType, contentTypes: ContentType[]}[]>(
    getDefaultRequirements('week')
  );

  // Load plans from API (or localStorage fallback) on mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (!res.ok) return;
        const data: Plan[] = await res.json();
        setSavedPlans(data.map(normalizePlan));
      } catch {
        const local = localStorage.getItem('inna_plans');
        if (local) {
          try { setSavedPlans(JSON.parse(local).map(normalizePlan)); } catch { /* ignore */ }
        }
      }
    };
    loadPlans();
  }, []);

  const persistPlans = async (plansToPersist: Plan[]) => {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plansToPersist),
      });
      if (!res.ok) {
        localStorage.setItem('inna_plans', JSON.stringify(plansToPersist));
      }
    } catch {
      localStorage.setItem('inna_plans', JSON.stringify(plansToPersist));
    }
  };

  const handleCreatePlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
      type: planType,
      status: 'open',
      items: requirements.map((req, i) => ({
        id: `${Date.now()}-${i}`,
        day: req.day,
        publishAt: undefined,
        mediaType: req.mediaType,
        contentTypes: req.contentTypes,
        status: 'preparing',
        tags: []
      }))
    };
    setPlan(newPlan);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSavePlan = async () => {
    if (!plan) return;
    setIsSaving(true);
    setUploadErrors([]);

    // Upload media for all items that still have a pending local file.
    // Collect results first, then apply all state changes at once.
    const successfulUploads = new Map<string, string>(); // itemId -> server URL
    const failedItemIds: string[] = [];

    for (const [itemId, file] of pendingFiles.entries()) {
      const item = plan.items.find(i => i.id === itemId);
      if (item) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            successfulUploads.set(itemId, url);
          } else {
            failedItemIds.push(itemId);
          }
        } catch {
          failedItemIds.push(itemId);
        }
      }
    }

    // Apply server URLs and remove successfully uploaded items from pendingFiles
    let latestPlan = plan;
    if (successfulUploads.size > 0) {
      latestPlan = {
        ...latestPlan,
        items: latestPlan.items.map(i =>
          successfulUploads.has(i.id) ? { ...i, mediaUrl: successfulUploads.get(i.id) } : i
        ),
      };
      setPendingFiles(prev => {
        const next = new Map(prev);
        for (const itemId of successfulUploads.keys()) next.delete(itemId);
        return next;
      });
    }
    if (failedItemIds.length > 0) {
      setUploadErrors(failedItemIds);
    }
    setPlan(latestPlan);

    const updatedPlans = savedPlans.some(p => p.id === latestPlan.id)
      ? savedPlans.map(p => p.id === latestPlan.id ? latestPlan : p)
      : [...savedPlans, latestPlan];

    setSavedPlans(updatedPlans);
    setIsEditing(false);

    await persistPlans(updatedPlans);

    setIsSaving(false);
  };

  const handleFileUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const uploadedMediaType: UploadedMediaType = file.type.startsWith('video/') ? 'video' : 'photo';
      setPendingFiles(prev => new Map(prev).set(itemId, file));
      setPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, mediaUrl: url, uploadedMediaType, status: 'waiting for approval' } : item
          )
        };
      });
    }
  };

  const handleStartProcessing = (itemId: string) => {
    const currentItem = plan?.items.find(item => item.id === itemId);
    if (!currentItem?.publishAt) {
      setPublishErrors(prev => Array.from(new Set([...prev, itemId])));
      return;
    }
    setPublishErrors(prev => prev.filter(id => id !== itemId));
    updateItemStatus(itemId, 'approved');
  };

  const updateItemStatus = (itemId: string, newStatus: PostStatus) => {
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      };
    });
  };

  const handleCancelItem = (itemId: string) => {
    setPendingFiles(prev => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, mediaUrl: undefined, uploadedMediaType: undefined, status: 'preparing' } : item
        )
      };
    });
    setPublishErrors(prev => prev.filter(id => id !== itemId));
  };

  const handleDeleteMedia = (itemId: string) => {
    handleCancelItem(itemId);
  };

  const handleAddTag = (itemId: string, tag: string) => {
    if (!tag.trim()) return;
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId && !(item.tags || []).includes(tag.trim())
            ? { ...item, tags: [...(item.tags || []), tag.trim()] } 
            : item
        )
      };
    });
  };

  const handleRemoveTag = (itemId: string, tagToRemove: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId 
            ? { ...item, tags: (item.tags || []).filter(t => t !== tagToRemove) } 
            : item
        )
      };
    });
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;
    const updatedPlans = savedPlans.filter(p => p.id !== planId);
    setSavedPlans(updatedPlans);
    if (plan?.id === planId) {
      setPlan(null);
      setIsEditing(false);
    }
    await persistPlans(updatedPlans);
  };

  const handleDeleteItem = (itemId: string) => {
    setPendingFiles(prev => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
    setPlan(prev => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter(item => item.id !== itemId) };
    });
    setPublishErrors(prev => prev.filter(id => id !== itemId));
  };

  const handleUpdateItemDay = (itemId: string, day: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => item.id === itemId ? { ...item, day } : item)
      };
    });
  };

  const handleUpdateItemPublishAt = (itemId: string, publishAtValue: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => item.id === itemId ? { ...item, publishAt: publishAtValue ? new Date(publishAtValue).toISOString() : undefined } : item)
      };
    });
    setPublishErrors(prev => prev.filter(id => id !== itemId));
  };

  const handleUpdateItemMediaType = (itemId: string, mediaType: MediaType) => {
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => item.id === itemId ? { ...item, mediaType } : item)
      };
    });
  };

  const handleToggleItemContentType = (itemId: string, contentType: ContentType) => {
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          const exists = item.contentTypes.includes(contentType);
          // Require at least one content type to remain on the item
          if (exists && item.contentTypes.length === 1) return item;
          return {
            ...item,
            contentTypes: exists
              ? item.contentTypes.filter(ct => ct !== contentType)
              : [...item.contentTypes, contentType]
          };
        })
      };
    });
  };

  const handleAppendItem = () => {
    const newItem: PlanItem = {
      id: crypto.randomUUID(),
      day: '',
      publishAt: undefined,
      mediaType: 'any',
      contentTypes: ['Instagram Feed'],
      status: 'preparing',
      tags: []
    };
    setPlan(prev => {
      if (!prev) return prev;
      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const handleUpdatePlanStatus = async (nextStatus: PlanStatus) => {
    if (!plan) return;
    const nextPlan = { ...plan, status: nextStatus };
    const updatedPlans = savedPlans.some(savedPlan => savedPlan.id === nextPlan.id)
      ? savedPlans.map(savedPlan => savedPlan.id === nextPlan.id ? nextPlan : savedPlan)
      : [...savedPlans, nextPlan];

    setPlan(nextPlan);
    setSavedPlans(updatedPlans);
    setIsEditing(false);
    await persistPlans(updatedPlans);
  };

  if (!plan && !isCreating) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PlanActionBar
          canBack={false} canNew={true} canEdit={false} canSave={false} isSaving={false} canHelp={false} showHelp={false} canClose={false} canReopen={false}
          onBack={() => {}} onNew={() => setIsCreating(true)} onEdit={() => {}} onSave={() => {}} onHelp={() => {}} onClose={() => {}} onReopen={() => {}}
        />
        {savedPlans.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Saved Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPlans.map(p => {
                const approvedCount = p.items.filter(i => i.status === 'approved').length;
                const postedCount = p.items.filter(i => i.status === 'posted').length;
                return (
                  <div
                    key={p.id}
                    className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div
                      onClick={() => { setPlan(p); setIsEditing(false); }}
                      className="cursor-pointer"
                    >
                      <h4 className="font-bold text-slate-900 truncate pr-8">{p.name}</h4>
                      <p className="text-slate-500 text-sm capitalize mt-0.5">{p.type} plan · {p.items.length} posts · {p.status === 'closed' ? 'closed' : 'open'}</p>
                      <div className="flex gap-3 mt-3 text-xs font-medium">
                        <span className="text-green-600">{approvedCount} approved</span>
                        <span className="text-blue-600">{postedCount} posted</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(p.id); }}
                      className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
            <CalendarDays size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{savedPlans.length === 0 ? 'No Active Plan' : 'Create Another Plan'}</h3>
          <p className="text-slate-500 mb-6">Create a new content plan to organize your upcoming posts.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            Create New Plan
          </button>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-4">
        <PlanActionBar
          canBack={true} canNew={false} canEdit={false} canSave={false} isSaving={false} canHelp={false} showHelp={false} canClose={false} canReopen={false}
          onBack={() => setIsCreating(false)} onNew={() => {}} onEdit={() => {}} onSave={() => {}} onHelp={() => {}} onClose={() => {}} onReopen={() => {}}
        />
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-bold mb-6">Create New Plan</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Plan Duration</label>
          <div className="flex gap-4">
            {(['week', 'month', 'quarter'] as PlanType[]).map(type => (
              <button
                key={type}
                onClick={() => {
                  setPlanType(type);
                  setRequirements(getDefaultRequirements(type));
                }}
                className={cn(
                  "flex-1 py-3 rounded-xl border font-semibold capitalize transition-all",
                  planType === type 
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-bold text-slate-700">Post Requirements</label>
            <button 
              onClick={() => setRequirements([...requirements, { day: '', mediaType: 'any', contentTypes: ['Instagram Feed'] }])}
              className="text-sm text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-600"
            >
              <Plus size={16} /> Add Post
            </button>
          </div>
          
          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div key={index} className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    placeholder="Day (e.g., Monday, Day 5)" 
                    value={req.day}
                    onChange={(e) => {
                      const newReqs = [...requirements];
                      newReqs[index].day = e.target.value;
                      setRequirements(newReqs);
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <select 
                    value={req.mediaType}
                    onChange={(e) => {
                      const newReqs = [...requirements];
                      newReqs[index].mediaType = e.target.value as MediaType;
                      setRequirements(newReqs);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="any">Any Media</option>
                  </select>
                  <button 
                    onClick={() => setRequirements(requirements.filter((_, i) => i !== index))}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    disabled={requirements.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map(ct => {
                    const isSelected = req.contentTypes.includes(ct);
                    return (
                      <button
                        key={ct}
                        onClick={() => {
                          const newReqs = [...requirements];
                          if (isSelected) {
                            if (req.contentTypes.length > 1) {
                              newReqs[index].contentTypes = req.contentTypes.filter(t => t !== ct);
                            }
                          } else {
                            newReqs[index].contentTypes = [...req.contentTypes, ct];
                          }
                          setRequirements(newReqs);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
                          isSelected 
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        )}
                      >
                        {ct}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setIsCreating(false)}
            className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreatePlan}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-sm"
          >
            Generate Plan
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlanActionBar
        canBack={true}
        canNew={!isEditing}
        canEdit={!isEditing && plan?.status !== 'closed'}
        canSave={isEditing}
        isSaving={isSaving}
        canHelp={true}
        showHelp={showHelp}
        canClose={!isEditing && plan?.status !== 'closed'}
        canReopen={!isEditing && plan?.status === 'closed'}
        onBack={() => { setPlan(null); setIsEditing(false); }}
        onNew={() => { setPlan(null); setIsEditing(false); setIsCreating(true); }}
        onEdit={() => setIsEditing(true)}
        onSave={handleSavePlan}
        onHelp={() => setShowHelp(v => !v)}
        onClose={() => handleUpdatePlanStatus('closed')}
        onReopen={() => handleUpdatePlanStatus('open')}
      />
      <div className={cn(
        "bg-white p-6 rounded-3xl border shadow-sm",
        isEditing ? "border-blue-300 ring-2 ring-blue-500/10" : "border-slate-100"
      )}>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-0.5">
              <input
                value={plan?.name ?? ''}
                onChange={(e) => setPlan(prev => prev ? { ...prev, name: e.target.value } : prev)}
                className="text-xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent w-full"
                placeholder="Plan name..."
              />
              <span className="shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Editing</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 truncate">{plan?.name}</h3>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                plan?.status === 'closed'
                  ? "text-slate-600 bg-slate-100 border-slate-200"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              )}>
                {plan?.status === 'closed' ? 'Closed' : 'Open'}
              </span>
            </div>
          )}
          <p className="text-slate-500 text-sm">{plan?.items.length} posts scheduled{isEditing && <span className="ml-2 text-blue-500">· Click Save when done</span>}</p>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
              <HelpCircle size={18} />
              How does the media approval flow work?
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-blue-400 hover:text-blue-700 transition-colors rounded-lg p-1 hover:bg-blue-100"
            >
              <X size={16} />
            </button>
          </div>
          <ol className="space-y-3 text-sm text-blue-800">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">1</span>
              <span><strong>Choose media</strong> for an item — click the upload area to pick a photo or video. A local preview appears and <em>Start Processing</em> / <em>Delete Media</em> buttons become available.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">2</span>
              <span><strong>Start processing or delete media</strong> — click <em>Start Processing</em> to lock the item and queue it for the bot on save, or <em>Delete Media</em> to remove the current file and start over.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">3</span>
              <span><strong>Set the publish time</strong> — every item that enters processing needs an exact publish date and time, so the bot can hold it until the right moment and route it to the requested social channel(s).</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">4</span>
              <span><strong>Bot queue + scheduled publish</strong> — once saved, processing items are automatically added to the Telegram bot queue (<code className="bg-blue-100 px-1 rounded">media_queue.json</code>). After Telegram approval, the bot keeps them waiting until their scheduled publish time and then routes them to the configured media-specific publisher target.</span>
            </li>
          </ol>
          <p className="text-xs text-blue-500 pt-1 border-t border-blue-100">
            💡 Tip: Unsaved changes are only in your browser — always <strong>Save</strong> after approving so media is uploaded and changes are persisted to the server.
          </p>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3 text-sm text-red-700">
          <XCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <strong>Some media files could not be uploaded.</strong> The plan was saved with local previews for those items. Re-open edit mode and save again to retry.
          </div>
          <button onClick={() => setUploadErrors([])} className="ml-auto shrink-0 text-red-400 hover:text-red-700 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plan?.items.map(item => {
          const previewMediaType = item.uploadedMediaType ?? inferUploadedMediaType(item.mediaUrl, item.mediaType) ?? (item.mediaType === 'video' ? 'video' : 'photo');
          const isItemLocked = plan?.status === 'closed' || item.status === 'approved' || item.status === 'posted';
          const canEditStructure = isEditing && !isItemLocked;
          const canEditMedia = !isItemLocked;
          const mediaAccept = item.mediaType === 'video' ? 'video/*' : item.mediaType === 'any' ? 'image/*,video/*' : 'image/*';
          
          return (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {canEditStructure ? (
                      <select
                        value={item.mediaType}
                        onChange={(e) => handleUpdateItemMediaType(item.id, e.target.value as MediaType)}
                        className="h-10 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-2 shrink-0"
                        title="Media type"
                      >
                        <option value="photo">Photo</option>
                        <option value="video">Video</option>
                        <option value="any">Any</option>
                      </select>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                        {previewMediaType === 'video' ? <Video size={18} /> : <ImageIcon size={18} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {canEditStructure ? (
                        <input
                          value={item.day}
                          onChange={(e) => handleUpdateItemDay(item.id, e.target.value)}
                          placeholder="Day (e.g., Monday)"
                          className="font-bold text-slate-900 text-sm border-b border-slate-300 outline-none bg-transparent w-full mb-1 focus:border-blue-500"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 block leading-tight mb-1">{item.day || 'Unspecified Day'}</span>
                      )}
                      {canEditStructure ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {CONTENT_TYPES.map(ct => (
                            <button
                              key={ct}
                              onClick={() => handleToggleItemContentType(item.id, ct)}
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap border transition-all",
                                item.contentTypes.includes(ct)
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                              )}
                            >
                              {ct}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.contentTypes.map(ct => (
                            <span key={ct} className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap">
                              {ct}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-500">
                        {canEditStructure ? (
                          <div className="flex flex-col gap-1.5">
                            <label className="font-semibold text-slate-500 uppercase tracking-wider">Publish At</label>
                            <input
                              type="datetime-local"
                              value={toDateTimeLocalValue(item.publishAt)}
                              onChange={(e) => handleUpdateItemPublishAt(item.id, e.target.value)}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                publishErrors.includes(item.id)
                                  ? "border-red-300 bg-red-50 text-red-700 focus:border-red-400"
                                  : "border-slate-200 bg-white text-slate-700 focus:border-blue-500"
                              )}
                            />
                            {publishErrors.includes(item.id) && (
                              <span className="text-red-600">Set a publish date and time before starting processing.</span>
                            )}
                          </div>
                        ) : (
                          <span><strong>Publish:</strong> {formatPublishAt(item.publishAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canEditStructure && (
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                {item.mediaUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video mb-4 group">
                      {previewMediaType === 'video' ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={item.mediaUrl} alt="Uploaded media" className="w-full h-full object-cover" />
                    )}
                      {canEditMedia && (
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                        <span className="flex items-center gap-2 font-medium bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                          <Upload size={16} /> Change Media
                        </span>
                        <input type="file" accept={mediaAccept} className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className={cn(
                    "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 p-8 mb-4 transition-all min-h-40",
                      canEditMedia
                      ? "border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer text-slate-500 hover:text-blue-500"
                      : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                  )}>
                    <Upload size={24} />
                    <span className="font-medium text-sm">Upload {item.mediaType}</span>
                    <input 
                      type="file" 
                      accept={mediaAccept} 
                      className="hidden" 
                      disabled={!canEditMedia}
                      onChange={(e) => handleFileUpload(item.id, e)}
                    />
                  </label>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Context Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(item.tags || []).map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-sm font-medium border border-slate-200">
                        {tag}
                        {canEditMedia && (
                          <button onClick={() => handleRemoveTag(item.id, tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    ))}
                    {(item.tags || []).length === 0 && !canEditMedia && (
                      <span className="text-sm text-slate-400 italic">No tags added</span>
                    )}
                  </div>
                  {canEditMedia && (
                    <input
                      type="text" 
                      placeholder="Add a tag and press Enter..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(item.id, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  )}
                </div>

                {/* Actions based on status */}
                <div className="mt-auto pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                  {item.status === 'preparing' && (
                    <p className="flex-1 text-center text-sm text-slate-400 py-2">
                      {(() => {
                        const label = item.mediaType === 'any' ? 'photo or video' : item.mediaType;
                        return `Choose a ${label} above to approve this item.`;
                      })()}
                    </p>
                  )}
                  
                  {item.status === 'waiting for approval' && (
                    <>
                      <button 
                        onClick={() => handleStartProcessing(item.id)}
                        className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-sm font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={16} /> Start Processing
                      </button>
                      <button 
                        onClick={() => handleDeleteMedia(item.id)}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                      >
                        <XCircle size={16} /> Delete Media
                      </button>
                    </>
                  )}

                  {item.status === 'approved' && (
                    <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      Scheduled publish is now handled by the bot after Telegram approval. Target time: <strong>{formatPublishAt(item.publishAt)}</strong>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isEditing && (
          <button
            onClick={handleAppendItem}
            className="bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 p-8 min-h-50 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 text-slate-400 transition-all"
          >
            <Plus size={28} />
            <span className="font-medium text-sm">Add Item</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface PlanActionBarProps {
  canBack: boolean;
  canNew: boolean;
  canEdit: boolean;
  canSave: boolean;
  isSaving: boolean;
  canHelp: boolean;
  showHelp: boolean;
  canClose: boolean;
  canReopen: boolean;
  onBack: () => void;
  onNew: () => void;
  onEdit: () => void;
  onSave: () => void;
  onHelp: () => void;
  onClose: () => void;
  onReopen: () => void;
}

function PlanActionBar({ canBack, canNew, canEdit, canSave, isSaving, canHelp, showHelp, canClose, canReopen, onBack, onNew, onEdit, onSave, onHelp, onClose, onReopen }: PlanActionBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex items-center gap-1 flex-wrap">
      <button
        onClick={onBack}
        disabled={!canBack}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          canBack ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900" : "text-slate-400 opacity-40 cursor-not-allowed"
        )}
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="w-px h-5 bg-slate-100 mx-1" />

      <button
        onClick={onNew}
        disabled={!canNew}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          canNew ? "text-blue-600 hover:bg-blue-50" : "text-blue-400 opacity-40 cursor-not-allowed"
        )}
      >
        <Plus size={15} /> New Plan
      </button>

      <button
        onClick={onEdit}
        disabled={!canEdit}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          canEdit ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-50 text-slate-400 opacity-40 cursor-not-allowed"
        )}
      >
        <Pencil size={15} /> Edit
      </button>

      <button
        onClick={onSave}
        disabled={!canSave || isSaving}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm",
          canSave && !isSaving
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-blue-200 text-blue-100 opacity-40 cursor-not-allowed shadow-none"
        )}
      >
        <Save size={15} /> {isSaving ? 'Saving…' : 'Save'}
      </button>

      <button
        onClick={onClose}
        disabled={!canClose}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          canClose ? "text-slate-700 hover:bg-slate-100" : "text-slate-400 opacity-40 cursor-not-allowed"
        )}
      >
        <XCircle size={15} /> Close Plan
      </button>

      <button
        onClick={onReopen}
        disabled={!canReopen}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          canReopen ? "text-emerald-700 hover:bg-emerald-50" : "text-emerald-400 opacity-40 cursor-not-allowed"
        )}
      >
        <CheckCircle2 size={15} /> Reopen
      </button>

      <div className="ml-auto" />

      <button
        onClick={onHelp}
        disabled={!canHelp}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          !canHelp
            ? "text-slate-400 opacity-40 cursor-not-allowed"
            : showHelp
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
        title="How does approval work?"
      >
        <HelpCircle size={15} /> Help
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  switch (status) {
    case 'preparing':
      return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Preparing</span>;
    case 'waiting for approval':
      return <span className="px-2.5 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Pending</span>;
    case 'approved':
      return <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Processing</span>;
    case 'posted':
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Send size={12} /> Posted</span>;
    case 'canceled':
      return <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><XCircle size={12} /> Canceled</span>;
  }
}

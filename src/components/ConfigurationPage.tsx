import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, Video, CalendarDays, CheckCircle2, Clock, XCircle, Send, X, Save, Pencil, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export type PlanType = 'week' | 'month' | 'quarter';
export type MediaType = 'photo' | 'video' | 'any';
export type ContentType = 'Instagram Feed' | 'Instagram Story' | 'Instagram Reel' | 'Facebook Post' | 'TikTok Video';
export const CONTENT_TYPES: ContentType[] = ['Instagram Feed', 'Instagram Story', 'Instagram Reel', 'Facebook Post', 'TikTok Video'];
export type PostStatus = 'preparing' | 'waiting for approval' | 'approved' | 'posted' | 'canceled';

export interface PlanItem {
  id: string;
  day: string;
  mediaType: MediaType;
  contentTypes: ContentType[];
  status: PostStatus;
  mediaUrl?: string;
  tags: string[];
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  items: PlanItem[];
}

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
        if (!res.ok) throw new Error('API unavailable');
        const data: Plan[] = await res.json();
        setSavedPlans(data);
      } catch {
        const local = localStorage.getItem('inna_plans');
        if (local) {
          try { setSavedPlans(JSON.parse(local)); } catch { /* ignore */ }
        }
      }
    };
    loadPlans();
  }, []);

  const handleCreatePlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
      type: planType,
      items: requirements.map((req, i) => ({
        id: `${Date.now()}-${i}`,
        day: req.day,
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

    // Upload media for all approved items that still have a pending local file.
    // Collect results first, then apply all state changes at once.
    const successfulUploads = new Map<string, string>(); // itemId -> server URL
    const failedItemIds: string[] = [];

    for (const [itemId, file] of pendingFiles.entries()) {
      const item = plan.items.find(i => i.id === itemId);
      if (item && item.status === 'approved') {
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

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlans),
      });
      if (!res.ok) throw new Error('API error');
    } catch {
      // Fallback: persist in localStorage
      localStorage.setItem('inna_plans', JSON.stringify(updatedPlans));
    }

    setIsSaving(false);
  };

  const handleFileUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPendingFiles(prev => new Map(prev).set(itemId, file));
      setPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, mediaUrl: url, status: 'waiting for approval' } : item
          )
        };
      });
    }
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
          item.id === itemId ? { ...item, mediaUrl: undefined, status: 'preparing' } : item
        )
      };
    });
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

  if (!plan && !isCreating) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PlanActionBar
          canBack={false} canNew={true} canEdit={false} canSave={false} isSaving={false} canHelp={false} showHelp={false}
          onBack={() => {}} onNew={() => setIsCreating(true)} onEdit={() => {}} onSave={() => {}} onHelp={() => {}}
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
                    onClick={() => { setPlan(p); setIsEditing(false); }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                    <p className="text-slate-500 text-sm capitalize mt-0.5">{p.type} plan · {p.items.length} posts</p>
                    <div className="flex gap-3 mt-3 text-xs font-medium">
                      <span className="text-green-600">{approvedCount} approved</span>
                      <span className="text-blue-600">{postedCount} posted</span>
                    </div>
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
          canBack={true} canNew={false} canEdit={false} canSave={false} isSaving={false} canHelp={false} showHelp={false}
          onBack={() => setIsCreating(false)} onNew={() => {}} onEdit={() => {}} onSave={() => {}} onHelp={() => {}}
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
        canEdit={!isEditing}
        canSave={isEditing}
        isSaving={isSaving}
        canHelp={true}
        showHelp={showHelp}
        onBack={() => { setPlan(null); setIsEditing(false); }}
        onNew={() => { setPlan(null); setIsEditing(false); setIsCreating(true); }}
        onEdit={() => setIsEditing(true)}
        onSave={handleSavePlan}
        onHelp={() => setShowHelp(v => !v)}
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
            <h3 className="text-xl font-bold text-slate-900 truncate">{plan?.name}</h3>
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
              <span><strong>Choose media</strong> for an item — click the upload area to pick a photo or video. A local preview appears and <em>Approve</em> / <em>Cancel</em> buttons become available.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">2</span>
              <span><strong>Approve or Cancel</strong> — click <em>Approve</em> to mark the item ready for publishing, or <em>Cancel</em> to clear the selection and start over.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">3</span>
              <span><strong>Save the plan</strong> — click <em>Save</em> in the action bar. Approved items have their media uploaded to the server at that point; the preview then shows the server-hosted file.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">4</span>
              <span><strong>Bot queue</strong> — once saved, approved items are automatically added to the Telegram bot queue (<code className="bg-blue-100 px-1 rounded">media_queue.json</code>). The bot asks Gemini to draft post copy and sends it to Inna for final sign-off.</span>
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
          const isEditable = item.status === 'preparing' || item.status === 'waiting for approval';
          
          return (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                    {item.mediaType === 'video' ? <Video size={18} /> : <ImageIcon size={18} />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight mb-1">{item.day || 'Unspecified Day'}</span>
                    <div className="flex flex-wrap gap-1">
                      {item.contentTypes.map(ct => (
                        <span key={ct} className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap">
                          {ct}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                {item.mediaUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video mb-4 group">
                    {item.mediaType === 'video' ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={item.mediaUrl} alt="Uploaded media" className="w-full h-full object-cover" />
                    )}
                    {isEditable && (
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                        <span className="flex items-center gap-2 font-medium bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                          <Upload size={16} /> Change Media
                        </span>
                        <input type="file" accept={item.mediaType === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className={cn(
                    "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 p-8 mb-4 transition-all min-h-[160px]",
                    isEditable 
                      ? "border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer text-slate-500 hover:text-blue-500" 
                      : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                  )}>
                    <Upload size={24} />
                    <span className="font-medium text-sm">Upload {item.mediaType}</span>
                    <input 
                      type="file" 
                      accept={item.mediaType === 'video' ? 'video/*' : 'image/*'} 
                      className="hidden" 
                      disabled={!isEditable}
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
                        {isEditable && (
                          <button onClick={() => handleRemoveTag(item.id, tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    ))}
                    {(item.tags || []).length === 0 && !isEditable && (
                      <span className="text-sm text-slate-400 italic">No tags added</span>
                    )}
                  </div>
                  {isEditable && (
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
                        onClick={() => updateItemStatus(item.id, 'approved')}
                        className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-sm font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleCancelItem(item.id)}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                    </>
                  )}

                  {item.status === 'approved' && (
                    <button 
                      onClick={() => updateItemStatus(item.id, 'posted')}
                      className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                    >
                      <Send size={16} /> Mark as Posted
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
  onBack: () => void;
  onNew: () => void;
  onEdit: () => void;
  onSave: () => void;
  onHelp: () => void;
}

function PlanActionBar({ canBack, canNew, canEdit, canSave, isSaving, canHelp, showHelp, onBack, onNew, onEdit, onSave, onHelp }: PlanActionBarProps) {
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
      return <span className="px-2.5 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Approved</span>;
    case 'posted':
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Send size={12} /> Posted</span>;
    case 'canceled':
      return <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><XCircle size={12} /> Canceled</span>;
  }
}

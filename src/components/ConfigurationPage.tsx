import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, Video, CalendarDays, CheckCircle2, Clock, XCircle, Send, X, Save, Pencil, ArrowLeft } from 'lucide-react';
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

    const updatedPlans = savedPlans.some(p => p.id === plan.id)
      ? savedPlans.map(p => p.id === plan.id ? plan : p)
      : [...savedPlans, plan];

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
      setPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId ? { ...item, mediaUrl: url } : item
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
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn(
        "flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm gap-4",
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
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <button
              onClick={handleSavePlan}
              disabled={isSaving}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              <Save size={15} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all flex items-center gap-1.5"
            >
              <Pencil size={15} /> Edit
            </button>
          )}
          <button
            onClick={() => { setPlan(null); setIsEditing(false); }}
            className="text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"
          >
            <ArrowLeft size={15} /> Plans
          </button>
        </div>
      </div>

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
                    <button 
                      onClick={() => updateItemStatus(item.id, 'waiting for approval')}
                      disabled={!item.mediaUrl}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit for Approval
                    </button>
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
                        onClick={() => updateItemStatus(item.id, 'canceled')}
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

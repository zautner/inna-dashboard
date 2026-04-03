import React, { useState } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, Video, CalendarDays, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { cn } from '../lib/utils';

export type PlanType = 'week' | 'month' | 'quarter';
export type MediaType = 'photo' | 'video' | 'any';
export type PostStatus = 'preparing' | 'waiting for approval' | 'approved' | 'posted' | 'canceled';

export interface PlanItem {
  id: string;
  day: string;
  mediaType: MediaType;
  status: PostStatus;
  mediaUrl?: string;
}

export interface Plan {
  id: string;
  type: PlanType;
  items: PlanItem[];
}

export default function ConfigurationPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [planType, setPlanType] = useState<PlanType>('week');
  const [requirements, setRequirements] = useState<{day: string, mediaType: MediaType}[]>([
    { day: 'Monday', mediaType: 'photo' }
  ]);

  const handleCreatePlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      type: planType,
      items: requirements.map((req, i) => ({
        id: `${Date.now()}-${i}`,
        day: req.day,
        mediaType: req.mediaType,
        status: 'preparing'
      }))
    };
    setPlan(newPlan);
    setIsCreating(false);
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

  if (!plan && !isCreating) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
          <CalendarDays size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Plan</h3>
        <p className="text-slate-500 mb-6">Create a new content plan to organize your upcoming posts.</p>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2 mx-auto"
        >
          <Plus size={18} />
          Create New Plan
        </button>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-bold mb-6">Create New Plan</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Plan Duration</label>
          <div className="flex gap-4">
            {(['week', 'month', 'quarter'] as PlanType[]).map(type => (
              <button
                key={type}
                onClick={() => setPlanType(type)}
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
              onClick={() => setRequirements([...requirements, { day: '', mediaType: 'any' }])}
              className="text-sm text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-600"
            >
              <Plus size={16} /> Add Post
            </button>
          </div>
          
          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div key={index} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
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
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900 capitalize">{plan?.type} Plan</h3>
          <p className="text-slate-500 text-sm">{plan?.items.length} posts scheduled</p>
        </div>
        <button 
          onClick={() => { setPlan(null); setIsCreating(true); }}
          className="text-sm text-slate-500 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
        >
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plan?.items.map(item => {
          const isEditable = item.status === 'preparing' || item.status === 'waiting for approval';
          
          return (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                    {item.mediaType === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                  </div>
                  <span className="font-bold text-slate-900">{item.day || 'Unspecified Day'}</span>
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

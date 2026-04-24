import React, { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const CATEGORIES = [
  'Workshop', 'Seminar', 'Guest Lecture', 'Career Fair', 'Hackathon', 
  'Research Symposium', 'Club Meeting', 'Social Gathering', 'Movie Night', 
  'Sports & Fitness', 'Volunteer/Service', 'Competition', 'Networking'
]

const CreateEvent = ({ initialData, onRefresh }) => {
  const fileInputRef = useRef(null)
  const formRef = useRef(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [noDeadline, setNoDeadline] = useState(false)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

  const isEditMode = !!initialData;

  // ── PRE-FILL FORM WHEN EDITING ──
  useEffect(() => {
    if (initialData && formRef.current) {
      const f = formRef.current;
      f.title.value = initialData.title || '';
      f.description.value = initialData.description || '';
      f.venue.value = initialData.venue || '';
      
      if (initialData.start_datetime) {
        const start = new Date(initialData.start_datetime);
        f.startDate.value = start.toISOString().split('T')[0];
        f.startTime.value = start.toTimeString().slice(0, 5);
      }
      if (initialData.end_datetime) {
        const end = new Date(initialData.end_datetime);
        f.endDate.value = end.toISOString().split('T')[0];
        f.endTime.value = end.toTimeString().slice(0, 5);
      }
      if (initialData.registration_deadline) {
        const dead = new Date(initialData.registration_deadline);
        f.deadlineDate.value = dead.toISOString().split('T')[0];
        f.deadlineTime.value = dead.toTimeString().slice(0, 5);
        setNoDeadline(false);
      } else {
        setNoDeadline(true);
      }

      // MATCHING SCHEMA: 'categories' (plural)
      setSelectedCategories(initialData.categories || []); 
      setIsUnlimited(!initialData.capacity);
      if (initialData.capacity) f.capacity.value = initialData.capacity;
      setPreviewUrl(initialData.image_url);
    }
  }, [initialData]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const showToast = (message, type = 'error') => setToast({ show: true, message, type })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image is too large (Max 10MB)')
        return
      }
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : prev.length < 3 ? [...prev, cat] : prev
    )
  }

  const handleClear = () => {
    setSelectedCategories([])
    setNoDeadline(false)
    setIsUnlimited(false)
    setPreviewUrl(null)
    if (formRef.current) formRef.current.reset()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
  
    try {
      const formData = new FormData(e.currentTarget)
      const { data: { user } } = await supabase.auth.getUser()

      // Handle Image
      let final_image_url = previewUrl;
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const fileName = `${Date.now()}-${file.name}`
        await supabase.storage.from('event-images').upload(fileName, file)
        const { data: pUrl } = supabase.storage.from('event-images').getPublicUrl(fileName)
        final_image_url = pUrl.publicUrl
      }

      if (!final_image_url) throw new Error("Event poster is required");

      // ── THE CRITICAL FIX: Matching your SQL Schema exactly ──
      const eventPayload = {
        organizer_id: user.id, // Fixed: organizer_id
        title: formData.get('title'),
        description: formData.get('description'),
        venue: formData.get('venue'),
        capacity: isUnlimited ? null : Number(formData.get('capacity')),
        start_datetime: new Date(`${formData.get('startDate')}T${formData.get('startTime')}`).toISOString(),
        end_datetime: new Date(`${formData.get('endDate')}T${formData.get('endTime')}`).toISOString(),
        registration_deadline: noDeadline ? null : new Date(`${formData.get('deadlineDate')}T${formData.get('deadlineTime')}`).toISOString(),
        image_url: final_image_url,
        categories: selectedCategories, // Fixed: 'categories' with 's'
        status: 'pending'              // Fixed: 'status' instead of 'event_status'
      }

      if (isEditMode) {
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', initialData.id); // Primary Key is 'id'

        if (error) throw error;
        showToast('Update submitted for review!', 'success');
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventPayload]);

        if (error) throw error;
        showToast('Event created successfully!', 'success');
      }

      setTimeout(() => { if (onRefresh) onRefresh(); handleClear(); }, 1500);

    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-17 px-2 relative">
      {/* Toast Feedback */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center justify-between w-80 md:w-96 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <p className="text-white text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="text-white/80 p-1 ml-4"><X size={20} /></button>
        </div>
      )}

      <header className="mb-6 flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
           <p className="text-sm text-slate-500 mt-1">Fill in the details below and submit for review.</p>
        </div>
        {isEditMode && <button onClick={onRefresh} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel Edit</button>}
      </header>

      <hr className="border-unity-yellow border-t-2 w-16 mb-3" />

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-10 items-start">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Event Title *</label>
            <input name="title" type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-unity-yellow outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Description *</label>
            <textarea name="description" rows={4} required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-unity-yellow outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Categories (Max 3) *</label>
            <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategories.includes(cat) ? 'bg-unity-yellow text-unity-navy shadow-sm' : 'bg-white text-slate-600 border border-slate-200'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Event Image *</label>
            <div onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed border-slate-200 rounded-lg h-48 flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer overflow-hidden">
              {previewUrl ? <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-center"><ImageIcon className="mx-auto text-slate-400 mb-2" size={22} /><p className="text-xs text-slate-500">Upload Poster</p></div>}
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Start Date *</label>
              <input name="startDate" type="date" required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Start Time *</label>
              <input name="startTime" type="time" required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">End Date *</label>
              <input name="endDate" type="date" required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">End Time *</label>
              <input name="endTime" type="time" required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Venue *</label>
            <input name="venue" type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={noDeadline} onChange={e => setNoDeadline(e.target.checked)} className="accent-unity-yellow" />
                <span className="text-xs text-slate-500 italic">No deadline</span>
              </label>
            </div>
            <div className={`grid grid-cols-2 gap-3 ${noDeadline ? 'opacity-30 pointer-events-none' : ''}`}>
              <input name="deadlineDate" type="date" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
              <input name="deadlineTime" type="time" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isUnlimited} onChange={e => setIsUnlimited(e.target.checked)} className="accent-unity-yellow" />
                <span className="text-xs text-slate-500">Unlimited</span>
              </label>
            </div>
            <input disabled={isUnlimited} name="capacity" type="number" className={`w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 ${isUnlimited ? 'opacity-30' : ''}`} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="reset" onClick={handleClear} className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">Clear</button>
            <button type="submit" disabled={loading} className="flex-1 px-8 py-2 bg-unity-yellow text-unity-navy rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16}/> : isEditMode ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateEvent
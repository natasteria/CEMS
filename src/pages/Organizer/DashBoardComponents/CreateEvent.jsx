import React, { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

const CATEGORIES = [
  'Workshop', 'Seminar', 'Guest Lecture', 'Career Fair', 'Hackathon', 
  'Research Symposium', 'Club Meeting', 'Social Gathering', 'Movie Night', 
  'Sports & Fitness', 'Volunteer/Service', 'Competition', 'Networking'
]

const CreateEvent = () => {
  const fileInputRef = useRef(null)
  const formRef = useRef(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [noDeadline, setNoDeadline] = useState(false)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null) // New: Image Preview State
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type })
  }

  // New: Handle Image Selection and Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image is too large (Max 10MB)')
        e.target.value = ''
        return
      }
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat) 
        : prev.length < 3 ? [...prev, cat] : prev
    )
  }

  const handleClear = () => {
    setSelectedCategories([])
    setNoDeadline(false)
    setIsUnlimited(false)
    setPreviewUrl(null) // Clear preview
    if (formRef.current) formRef.current.reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
  
    try {
      const formData = new FormData(e.currentTarget)
      const title = formData.get('title')?.trim()
      const description = formData.get('description')?.trim()
      const venue = formData.get('venue')?.trim()
      const startDate = formData.get('startDate')
      const startTime = formData.get('startTime')
      const endDate = formData.get('endDate')
      const endTime = formData.get('endTime')
      const file = fileInputRef.current?.files?.[0]

      if (!title) return showToast('Event title is required')
      if (!description) return showToast('Event description is required')
      if (selectedCategories.length === 0) return showToast('Please select at least one category')
      if (!file) return showToast('Event poster/image is required')
      if (!startDate || !startTime || !endDate || !endTime) return showToast('All event dates and times are required')
      if (!venue) return showToast('Venue is required')

      const capacityValue = formData.get('capacity')
      let capacity = null
      if (!isUnlimited) {
        if (!capacityValue || Number(capacityValue) <= 0) {
          return showToast('Please provide a valid capacity or select "Unlimited"')
        }
        capacity = Number(capacityValue)
      }

      const start_datetime = new Date(`${startDate}T${startTime}`)
      const end_datetime = new Date(`${endDate}T${endTime}`)
      if (end_datetime <= start_datetime) return showToast('End time must be after start time')

      let registration_deadline = null
      if (!noDeadline) {
        const dDate = formData.get('deadlineDate')
        const dTime = formData.get('deadlineTime')
        if (!dDate || !dTime) return showToast('Please set a registration deadline')
        registration_deadline = new Date(`${dDate}T${dTime}`)
        if (registration_deadline > start_datetime) return showToast('Deadline must be before event start')
      }

      const { data: { user } } = await supabase.auth.getUser()
      const { data: organizer } = await supabase.from('organizers').select('id').eq('id', user.id).single()

      const fileName = `${Date.now()}-${file.name}`
      await supabase.storage.from('event-images').upload(fileName, file)
      const { data: publicUrlData } = supabase.storage.from('event-images').getPublicUrl(fileName)
      const image_url = publicUrlData.publicUrl

      const { error: insertError } = await supabase.from('events').insert([{
        organizer_id: organizer.id,
        title, description, venue, capacity,
        start_datetime: start_datetime.toISOString(),
        end_datetime: end_datetime.toISOString(),
        registration_deadline: registration_deadline?.toISOString() || null,
        image_url,
        categories: selectedCategories,
        status: 'pending'
      }])

      if (insertError) throw insertError
      showToast('Event created successfully!', 'success')
      handleClear()
    } catch (err) {
      showToast(err.message || 'Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-17 px-2 relative">
      {/* TOAST UI */}
      {toast.show && (
        <div className={`fixed top-6 right-6 flex items-center justify-between w-80 md:w-96 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <div className="flex flex-col">
            <span className="text-white text-sm font-bold tracking-wide uppercase opacity-80">
              {toast.type === 'success' ? 'Success' : 'Error'}
            </span>
            <p className="text-white text-sm font-medium mt-0.5">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="text-white/80 hover:text-white p-1 ml-4"><X size={20} /></button>
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Event</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the details below and submit your event for Admin Review.</p>
      </header>

      <hr className="border-unity-yellow border-t-2 w-16 mb-3" />

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-10 items-start">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Event Title *</label>
            <input name="title" type="text" placeholder="Give your event a clear title" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-unity-yellow" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Description *</label>
            <textarea name="description" rows={4} placeholder="Describe the event..." className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-unity-yellow" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Categories *</label>
            <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategories.includes(cat) ? 'bg-unity-yellow text-unity-navy shadow-sm' : 'bg-white text-slate-600 border border-slate-200'}`}>{cat}</button>
              ))}
            </div>
          </div>

          {/* IMAGE PREVIEW LOGIC */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Event Image *</label>
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="relative border-2 border-dashed border-slate-200 rounded-lg min-h-[160px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-unity-yellow cursor-pointer transition-all overflow-hidden"
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="mx-auto text-slate-400 mb-2" size={22} />
                  <p className="text-sm font-medium text-slate-600">Upload Event Poster</p>
                  <p className="text-xs text-slate-500">PNG or JPG (max 10 MB)</p>
                </div>
              )}
            </div>
            <input 
              ref={fileInputRef} 
              name="image" 
              type="file" 
              accept="image/png,image/jpeg" 
              className="hidden" 
              onChange={handleImageChange} 
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Event Dates *</label>
            <div className="grid grid-cols-2 gap-3">
              <input name="startDate" type="date" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
              <input name="endDate" type="date" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Event Time *</label>
            <div className="grid grid-cols-2 gap-3">
              <input name="startTime" type="time" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
              <input name="endTime" type="time" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Venue *</label>
            <input name="venue" type="text" placeholder="Example: Main Campus Hall 4" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration Deadline *</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="noDeadline" checked={noDeadline} onChange={(e) => setNoDeadline(e.target.checked)} className="accent-unity-yellow" />
                <label htmlFor="noDeadline" className="text-xs text-slate-500 cursor-pointer italic">No deadline</label>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-3 transition-opacity ${noDeadline ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <input name="deadlineDate" type="date" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
              <input name="deadlineTime" type="time" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity *</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="unlimited" checked={isUnlimited} onChange={(e) => setIsUnlimited(e.target.checked)} className="accent-unity-yellow" />
                <label htmlFor="unlimited" className="text-xs text-slate-500 cursor-pointer">Unlimited</label>
              </div>
            </div>
            <div className={`transition-opacity ${isUnlimited ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <input name="capacity" type="number" min={1} placeholder="Max attendees" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="reset" onClick={handleClear} className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50">Clear</button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-8 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${loading ? 'bg-gray-300 text-gray-600' : 'bg-unity-yellow text-unity-navy'}`}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateEvent
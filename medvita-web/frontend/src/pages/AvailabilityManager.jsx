import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Save, Check } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function AvailabilityManager() {
  const { user } = useAuth()
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [, setSuccess] = useState(false)

  useEffect(() => {
    fetchAvailability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)

      if (error) throw error

      const availMap = {}
      DAYS.forEach(day => {
        const found = data.find(d => d.day_of_week === day)
        availMap[day] = found ? {
          start: found.start_time,
          end: found.end_time,
          id: found.id
        } : { start: '09:00', end: '17:00', id: null }
      })
      setAvailability(availMap)
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const upserts = []

      for (const day of DAYS) {
        const item = availability[day]
        upserts.push({
          doctor_id: user.id,
          day_of_week: day,
          start_time: item.start,
          end_time: item.end,
          ...(item.id ? { id: item.id } : {}) // Include ID for update if exists
        })
      }

      // We use upsert. 
      // Note: In Supabase, upsert works if primary key match. 
      // Here we might have separate rows. 
      // Since we are iterating known days, if we have an ID, we update. If not, we insert.
      // Ideally we should have a unique constraint on (doctor_id, day_of_week) to make upsert easier.
      // But based on my schema, I just have ID. 
      // So I'll do it carefully:
      // Actually, upserting with ID works. For new ones (no ID), it inserts.

      const { error } = await supabase
        .from('doctor_availability')
        .upsert(upserts)

      if (error) throw error

      setSuccess(true)
      // Refresh to get new IDs
      fetchAvailability()
    } catch (error) {
      alert('Error saving availability: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Availability Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your weekly schedule and working hours</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-teal-200"
        >
          {saving ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-slate-700/50">
          {DAYS.map((day) => (
            <div key={day} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${day === 'Saturday' || day === 'Sunday'
              ? 'bg-slate-200 dark:bg-slate-700'
              : 'bg-teal-500/20 dark:bg-teal-500/40'
            }`}></div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white w-28">{day}</p>
                </div>

                <div className="flex items-center gap-4 flex-1 sm:justify-end">
                  <div className="relative w-full sm:w-auto">
                    <input
                      type="time"
                      className="input-field cursor-pointer font-mono text-sm"
                      value={availability[day]?.start}
                      onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                    />
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium px-2">to</span>
                  <div className="relative w-full sm:w-auto">
                    <input
                      type="time"
                      className="input-field cursor-pointer font-mono text-sm"
                      value={availability[day]?.end}
                      onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

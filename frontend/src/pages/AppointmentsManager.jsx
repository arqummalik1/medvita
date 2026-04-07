import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { addDays, addWeeks, format, isSameDay, parseISO, startOfDay, subWeeks, startOfMonth, endOfMonth, endOfWeek, startOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { Calendar as CalendarIcon, User, Clock, CheckCircle, XCircle, Plus, Search, ChevronLeft, ChevronRight, MoreVertical, MapPin } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import clsx from 'clsx'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Input, SearchInput } from '../components/ui/Input'
import { createCalendarEvent, generateCalendarLink } from '../lib/googleCalendar'

export default function AppointmentsManager() {
  const { user, profile } = useAuth()

  // Manage local state for appointments and related data
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [myPatients, setMyPatients] = useState([])

  // UI state management for loading, modals, and responsive layout
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date())) // Replaces currentWeekStart for generic use
  const [viewMode, setViewMode] = useState('month') // Default to 'month' as requested
  const [isMobile, setIsMobile] = useState(false)

  // Day Details Modal State
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false)
  const [viewingDate, setViewingDate] = useState(new Date())

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Form states
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')

  const isDoctor = profile?.role === 'doctor'

  // Time slots for booking
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ]

  useEffect(() => {
    if (profile) {
      fetchAppointments()
      if (isDoctor) {
        fetchMyPatients()
      } else {
        fetchDoctors()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isDoctor, user, isModalOpen, viewMode, currentDate])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (user) {
        if (isDoctor) {
          query = query.eq('doctor_id', user.id)
        } else {
          query = query.eq('patient_id', user.id)
        }
      }

      const { data, error } = await query
      if (error) throw error

      // Batch-resolve missing names instead of N+1 individual queries
      const missingPatientIds = [...new Set(data.filter(a => !a.patient_name || a.patient_name === 'Unknown Patient').map(a => a.patient_id).filter(Boolean))]
      const missingDoctorIds = [...new Set(data.map(a => a.doctor_id).filter(Boolean))]

      let patientNameMap = {}
      let doctorNameMap = {}

      if (isDoctor && missingPatientIds.length > 0) {
        const { data: patients } = await supabase.from('patients').select('id, name').in('id', missingPatientIds)
        if (patients) patients.forEach(p => { patientNameMap[p.id] = p.name })
        // Also check profiles for patient_ids that are auth user IDs
        const unresolvedIds = missingPatientIds.filter(id => !patientNameMap[id])
        if (unresolvedIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', unresolvedIds)
          if (profiles) profiles.forEach(p => { patientNameMap[p.id] = p.full_name })
        }
      }

      if (!isDoctor && missingDoctorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', missingDoctorIds)
        if (profiles) profiles.forEach(p => { doctorNameMap[p.id] = p.full_name })
      }

      const processedData = data.map(apt => {
        const result = { ...apt }
        if ((!apt.patient_name || apt.patient_name === 'Unknown Patient') && patientNameMap[apt.patient_id]) {
          result.patient_name = patientNameMap[apt.patient_id]
        }
        if (!isDoctor && doctorNameMap[apt.doctor_id]) {
          result.doctor = { full_name: doctorNameMap[apt.doctor_id] }
        }
        return result
      })

      setAppointments(processedData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'doctor')
      setDoctors(data || [])
    } catch (error) { console.error(error) }
  }

  const fetchMyPatients = async () => {
    try {
      const { data } = await supabase.from('patients').select('id, name').eq('doctor_id', user.id).order('name')
      setMyPatients(data || [])
    } catch (error) { console.error(error) }
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    try {
      if (!selectedEntity || !selectedDate || !selectedTime) {
        alert('Please fill in all fields')
        return
      }

      const appointmentData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'scheduled'
      }

      if (isDoctor) {
        const patient = myPatients.find(p => p.id === selectedEntity)
        if (!patient) throw new Error('Selected patient not found')
        appointmentData.doctor_id = user.id
        appointmentData.patient_id = patient.id
        appointmentData.patient_name = patient.name
      } else {
        appointmentData.doctor_id = selectedEntity
        appointmentData.patient_id = user.id
        appointmentData.patient_name = profile?.full_name || user.email
      }

      const { data, error } = await supabase.from('appointments').insert([appointmentData]).select()
      if (error) throw error

      if (isDoctor && profile?.google_calendar_sync_enabled && data && data[0]) {
        try {
          await createCalendarEvent(data[0])
        } catch (calendarError) {
          console.error('Failed to sync to Google Calendar:', calendarError)
          const useLink = confirm('Failed to sync to Google Calendar. Would you like to add it manually?')
          if (useLink) window.open(generateCalendarLink(data[0]), '_blank')
        }
      }

      setIsModalOpen(false)
      setSelectedEntity('')
      setSelectedTime('')
      fetchAppointments()
    } catch (error) {
      alert('Error booking appointment: ' + error.message)
    }
  }

  // View Navigation Logic
  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addDays(startOfMonth(currentDate), 32)) // Jump to next month safe
    else setCurrentDate(isMobile ? addDays(currentDate, 3) : addWeeks(currentDate, 1))
  }

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addDays(startOfMonth(currentDate), -1)) // Jump to prev month
    else setCurrentDate(isMobile ? addDays(currentDate, -3) : subWeeks(currentDate, 1))
  }

  // Helper for clicking a slot
  const handleTimeSlotClick = (day, time) => {
    setSelectedDate(day)
    setSelectedTime(time)
    setIsModalOpen(true)
  }

  // Grid Generators
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: startDate, end: endDate })
  }

  const getWeekDays = () => Array.from({ length: isMobile ? 3 : 7 }, (_, i) => addDays(startOfWeek(currentDate), i))

  const handleDayClick = (day) => {
    setViewingDate(day)
    setIsDayDetailsOpen(true)
  }

  const getAppointmentsForDate = (date) => {
    return appointments.filter(a => isSameDay(parseISO(a.date), date))
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading appointments...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Appointments</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your schedule and upcoming visits.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="flex glass-panel p-1 rounded-full w-full sm:w-auto shadow-sm">
            {['month', 'week', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  "flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-full transition-all text-center capitalize",
                  viewMode === mode
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="whitespace-nowrap w-full sm:w-auto justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30">
            <Plus className="h-5 w-5 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* List View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="glass-panel group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all rounded-[24px] relative">
              {/* Google Calendar Sync Indicator */}
              {isDoctor && profile?.google_calendar_sync_enabled && (
                <div className="absolute top-3 right-3" title="Synced to Google Calendar">
                  <CalendarIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" fill="currentColor" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-2xl text-white text-center min-w-[64px] shadow-lg shadow-cyan-500/30">
                    <span className="text-xl font-bold block leading-none">{format(new Date(apt.date), 'd')}</span>
                    <span className="text-xs font-medium uppercase">{format(new Date(apt.date), 'MMM')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {format(new Date(`${apt.date}T${apt.time}`), 'EEEE')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(`${apt.date}T${apt.time}`), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <Badge variant={apt.status === 'confirmed' ? 'success' : 'default'}>{apt.status}</Badge>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                      {isDoctor ? 'Patient' : 'Doctor'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {isDoctor ? (apt.patient_name || 'Unknown') : `Dr. ${apt.doctor?.full_name || 'Unknown'}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(generateCalendarLink(apt), '_blank')
                  }}
                  className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
                  title="Add to Google Calendar"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500 glass-panel rounded-[24px]">
              No appointments found.
            </div>
          )}
        </div>
      ) : (
        /* Calendar Views (Month & Week) */
        <div className="glass-panel overflow-hidden p-0 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={prevPeriod} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                {viewMode === 'month'
                  ? format(currentDate, 'MMMM yyyy')
                  : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
                }
              </h2>
              <button onClick={nextPeriod} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="w-full">
            {/* Days Header */}
            <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : (isMobile ? 'grid-cols-4' : 'grid-cols-8')} bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700`}>
              {viewMode === 'week' && (
                <div className="p-4 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 text-center border-r border-slate-200 dark:border-slate-700 flex items-center justify-center tracking-widest">
                  TIME
                </div>
              )}
              {(viewMode === 'month' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : getWeekDays().map(d => format(d, 'EEE'))).map((day, i) => (
                <div key={i} className="p-3 sm:p-4 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</span>
                  {viewMode === 'week' && (
                    <p className={clsx("text-lg font-bold mt-1", isSameDay(getWeekDays()[i], new Date()) ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white")}>
                      {format(getWeekDays()[i], 'd')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* View Content */}
            {viewMode === 'month' ? (
              <div className="grid grid-cols-7 auto-rows-fr bg-white dark:bg-slate-900">
                {getMonthDays().map((day, dayIdx) => {
                  const dayAppointments = getAppointmentsForDate(day)
                  const count = dayAppointments.length
                  const isSelectedMonth = isSameMonth(day, currentDate)

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => handleDayClick(day)}
                      className={clsx(
                        "min-h-[100px] sm:min-h-[120px] p-2 border-b border-r border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer relative group",
                        !isSelectedMonth && "bg-slate-50/30 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600",
                        isToday(day) && "bg-cyan-50/20 dark:bg-cyan-900/10"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className={clsx(
                          "text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center",
                          isToday(day)
                            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                            : "text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      {count > 0 && (
                        <div className="mt-2 space-y-1">
                          {/* Badge Style Count as requested */}
                          <div className="flex justify-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold text-xs shadow-md border-2 border-white dark:border-slate-900 transform group-hover:scale-110 transition-transform">
                              {count}
                            </span>
                          </div>
                          <p className="text-[10px] text-center text-slate-400 font-medium hidden sm:block">
                            {count === 1 ? 'Appointment' : 'Appointments'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Week View Grid Implementation (Simplified for conciseness but robust) */
              <div className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                {timeSlots.map(time => (
                  <div
                    key={time}
                    className={clsx("grid", isMobile ? 'grid-cols-4' : 'grid-cols-8')}
                  >
                    <div className="p-2 sm:p-3 text-xs font-medium text-slate-400 dark:text-slate-500 text-center border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-center">
                      {time}
                    </div>
                    {getWeekDays().map(day => {
                      const apts = getAppointmentsForDate(day).filter(a => a.time.substring(0, 5) === time)

                      return (
                        <div
                          key={`${day}-${time}`}
                          onClick={() => handleTimeSlotClick(day, time)} // Click to Book
                          className={clsx("p-1 border-r border-slate-200 dark:border-slate-700 min-h-[50px] relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer group",
                            isToday(day) && "bg-cyan-50/10 dark:bg-cyan-900/5"
                          )}>
                          {/* Hover Effect for Booking */}
                          {apts.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Plus className="h-4 w-4 text-cyan-500" />
                            </div>
                          )}

                          {apts.map(apt => (
                            <div
                              key={apt.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Open details view instead of booking
                                handleDayClick(day)
                              }}
                              className={clsx(
                                "absolute inset-1 rounded-lg p-1.5 text-[10px] border cursor-pointer hover:shadow-lg transition-all z-10 overflow-hidden",
                                apt.status === 'confirmed'
                                  ? "bg-emerald-100/90 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                  : "bg-cyan-100/90 dark:bg-cyan-900/60 border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300"
                              )}>
                              <div className="font-bold truncate">{isDoctor ? apt.patient_name : `Dr. ${apt.doctor?.full_name || 'Doc'}`}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full glass-panel rounded-[24px] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {isDoctor ? 'New Appointment' : 'Book Consultation'}
            </h2>
            <form onSubmit={handleBookAppointment} className="space-y-6">
              {/* Form Content (same as before) */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">{isDoctor ? 'Patient' : 'Doctor'}</label>
                <div className="relative">
                  <select required value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="input-field appearance-none w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <option value="">Select...</option>
                    {isDoctor ? myPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-3.5 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <Input type="date" label="Date" required value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="rounded-xl border-slate-200 dark:border-slate-700" />
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Time</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                  {timeSlots.map(time => (
                    <button key={time} type="button" onClick={() => setSelectedTime(time)} className={clsx("py-2 text-xs font-bold rounded-lg border transition-all", selectedTime === time ? "bg-cyan-500 text-white border-cyan-500" : "border-slate-200 dark:border-slate-700 hover:border-cyan-400")}>{time}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="secondary" className="flex-1 rounded-full" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white">Confirm</Button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Day Details Modal (New) */}
      <Dialog open={isDayDetailsOpen} onClose={() => setIsDayDetailsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full glass-panel rounded-[24px] shadow-2xl p-0 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{format(viewingDate, 'EEEE')}</h2>
                  <p className="text-cyan-100 font-medium">{format(viewingDate, 'MMMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsDayDetailsOpen(false)
                      setSelectedDate(viewingDate)
                      setIsModalOpen(true)
                    }}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    title="Add Appointment"
                  >
                    <Plus className="h-5 w-5 text-white" />
                  </button>
                  <button onClick={() => setIsDayDetailsOpen(false)} className="p-2 rounded-full hover:bg-white/20 transition-colors"><XCircle className="h-6 w-6" /></button>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 bg-white dark:bg-slate-900">
              {getAppointmentsForDate(viewingDate).length > 0 ? (
                getAppointmentsForDate(viewingDate).map(apt => (
                  <div key={apt.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-slate-200 dark:border-slate-700 pr-4">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{apt.time.substring(0, 5)}</span>
                      <span className="text-xs text-slate-500 uppercase">{parseInt(apt.time) >= 12 ? 'PM' : 'AM'}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{isDoctor ? apt.patient_name : `Dr. ${apt.doctor?.full_name || 'Unknown'}`}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={apt.status === 'confirmed' ? 'success' : 'default'} className="text-[10px] px-2 py-0.5">{apt.status}</Badge>
                        {isDoctor && profile?.google_calendar_sync_enabled && (
                          <button onClick={() => window.open(generateCalendarLink(apt), '_blank')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" /> Sync
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No appointments planned for this day.</p>
                  <Button variant="ghost" onClick={() => { setIsDayDetailsOpen(false); setSelectedDate(viewingDate); setIsModalOpen(true); }} className="mt-4 text-cyan-600 dark:text-cyan-400">
                    + Book Appointment
                  </Button>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, addDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, User, Clock, CheckCircle, XCircle, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import clsx from 'clsx'

export default function AppointmentsManager() {
  const { user, profile } = useAuth()
  
  // Data states
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([]) // For patients
  const [myPatients, setMyPatients] = useState([]) // For doctors
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form states
  const [selectedEntity, setSelectedEntity] = useState('') // doctor_id or patient_id
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')

  const isDoctor = profile?.role === 'doctor'

  // Time slots generation
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]

  useEffect(() => {
    if (profile) {
      fetchAppointments()
      if (isDoctor) {
        fetchMyPatients()
      } else {
        fetchDoctors()
        setPatientName(profile.full_name || '')
        setPatientEmail(user?.email || '')
      }
    }
  }, [profile, isDoctor, user])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
      
      const { data, error } = await query
      
      if (error) throw error

      const processedData = await Promise.all(data.map(async (apt) => {
        if (apt.patient_name) return apt
        
        if (isDoctor) {
           const { data: pData } = await supabase
             .from('patients')
             .select('name')
             .eq('id', apt.patient_id)
             .maybeSingle()
           
           if (pData) return { ...apt, patient_name: pData.name }
           
           const { data: uData } = await supabase
             .from('profiles')
             .select('full_name')
             .eq('id', apt.patient_id)
             .maybeSingle()
             
           if (uData) return { ...apt, patient_name: uData.full_name }
        }
        
        return { ...apt, patient_name: 'Unknown Patient' }
      }))

      setAppointments(processedData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'doctor')
      if (error) throw error
      setDoctors(data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const fetchMyPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .eq('doctor_id', user.id)
        .order('name')
      if (error) throw error
      setMyPatients(data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
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

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData])

      if (error) throw error

      setIsModalOpen(false)
      setSelectedEntity('')
      setSelectedTime('')
      fetchAppointments()
      // Ideally show a toast here
    } catch (error) {
      alert('Error booking appointment: ' + error.message)
    }
  }

  const nextMonth = () => setCurrentMonth(addDays(currentMonth, 30)) // Simplified
  const prevMonth = () => setCurrentMonth(addDays(currentMonth, -30))

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        days.push(
          <div
            key={day}
            className={clsx(
              "p-2 text-center text-sm rounded-lg cursor-pointer transition-all",
              !isSameMonth(day, monthStart) ? "text-slate-300 dark:text-slate-700" : 
              isSameDay(day, selectedDate) ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700"
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            {formattedDate}
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="space-y-1">{rows}</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Appointments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your schedule and upcoming visits.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Appointment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CalendarIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No appointments found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            {isDoctor 
              ? "You haven't scheduled any appointments yet. Start by creating one for your patients." 
              : "You don't have any upcoming appointments. Book a consultation with a doctor."}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-8 btn btn-secondary"
          >
            Schedule Now
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((apt) => (
            <div 
              key={apt.id} 
              className="glass-card rounded-2xl p-6 group hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
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
                <span className={clsx(
                  "badge",
                  apt.status === 'scheduled' ? "badge-green" :
                  apt.status === 'completed' ? "badge-slate" : "badge-red"
                )}>
                  {apt.status}
                </span>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      {isDoctor ? 'Patient' : 'Doctor'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isDoctor ? apt.patient_name : `Dr. ${apt.doctor?.full_name || 'Unknown'}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full glass-panel rounded-3xl p-0 overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row h-full md:h-[600px]">
              {/* Left Side: Form & Calendar */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isDoctor ? 'New Appointment' : 'Book Visit'}
                  </Dialog.Title>
                </div>

                <form id="booking-form" onSubmit={handleBookAppointment} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      {isDoctor ? 'Select Patient' : 'Choose Doctor'}
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={selectedEntity}
                        onChange={(e) => setSelectedEntity(e.target.value)}
                        className="input-field appearance-none"
                      >
                        <option value="">Select...</option>
                        {isDoctor ? (
                          myPatients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))
                        ) : (
                          doctors.map(d => (
                            <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
                          ))
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <Search className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Custom Calendar */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Date</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full"><ChevronLeft className="h-5 w-5" /></button>
                        <span className="font-bold text-slate-900 dark:text-white">{format(currentMonth, 'MMMM yyyy')}</span>
                        <button type="button" onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full"><ChevronRight className="h-5 w-5" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                          <div key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</div>
                        ))}
                      </div>
                      {renderCalendar()}
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Side: Time Slots & Summary */}
              <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-l border-slate-100 dark:border-slate-700 flex flex-col">
                 <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Available Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={clsx(
                            "px-2 py-2 text-xs font-bold rounded-xl border transition-all",
                            selectedTime === time
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="mt-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Booking Summary</p>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {format(selectedDate, 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-blue-500" />
                         <span className="text-sm font-semibold text-slate-900 dark:text-white">
                           {selectedTime || 'Select a time'}
                         </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="booking-form"
                        className="flex-1 btn btn-primary"
                      >
                        Confirm
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

import { useAuth } from '../context/AuthContext'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { format } from 'date-fns'
import StatCard from '../components/StatCard'
import PatientEngagementChart from '../components/PatientEngagementChart'
import { Plus, Calendar, FileText, Users, CheckCircle2, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// ─── Today's Queue Panel (Doctor Only) ────────────────────────────────────────
function TodaysQueuePanel({ doctorId }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState(null)
  // Stable ref so Realtime callback always has latest setter
  const setPatientsr = useRef(setPatients)
  setPatientsr.current = setPatients

  const fetchQueue = useCallback(async () => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('patients')
      .select('id, name, age, sex, patient_id, blood_pressure, heart_rate, queue_status, created_at')
      .eq('doctor_id', doctorId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: true }) // oldest first = position 1 first

    if (!error) setPatientsr.current(data || [])
    setLoading(false)
  }, [doctorId])

  useEffect(() => {
    if (!doctorId) return
    fetchQueue()

    const channel = supabase
      .channel(`doctor:queue:${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'patients',
          filter: `doctor_id=eq.${doctorId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPatientsr.current(prev => [...prev, payload.new].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            ))
          } else if (payload.eventType === 'UPDATE') {
            setPatientsr.current(prev =>
              prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
            )
          } else if (payload.eventType === 'DELETE') {
            setPatientsr.current(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Doctor realtime queue connected')
        }
      })

    return () => supabase.removeChannel(channel)
  }, [doctorId, fetchQueue])

  const markSeen = async (patient) => {
    setMarkingId(patient.id)
    const newStatus = patient.queue_status === 'seen' ? 'waiting' : 'seen'
    const { error } = await supabase
      .from('patients')
      .update({ queue_status: newStatus })
      .eq('id', patient.id)
    if (error) console.error('Failed to update status:', error)
    setMarkingId(null)
    // Realtime will update the UI automatically
  }

  const waiting = patients.filter(p => p.queue_status !== 'seen')
  const seen = patients.filter(p => p.queue_status === 'seen')
  const nextPatient = waiting[0]

  return (
    <div className="glass-panel p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Today's Queue
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Walk-ins via Reception Desk · Live</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-3 py-1 rounded-full text-xs border border-amber-200 dark:border-amber-800">
            {waiting.length} Waiting
          </span>
          {seen.length > 0 && (
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-xs border border-emerald-200 dark:border-emerald-800">
              {seen.length} Seen
            </span>
          )}
        </div>
      </div>

      {/* Next up highlight */}
      {nextPatient && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Next Up</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{nextPatient.name}</p>
          </div>
          <button
            onClick={() => markSeen(nextPatient)}
            disabled={markingId === nextPatient.id}
            className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {markingId === nextPatient.id ? '...' : 'Mark Seen ✓'}
          </button>
        </div>
      )}

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Queue is empty</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Receptionist will add walk-ins here</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {/* Waiting patients */}
            {waiting.map((patient, i) => (
              <motion.div
                key={patient.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center gap-3 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              >
                {/* Position number */}
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors',
                  i === 0
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                )}>
                  {i + 1}
                </div>
                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{patient.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex-wrap">
                    {patient.patient_id && <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{patient.patient_id}</span>}
                    {patient.age && <span>{patient.age}y {patient.sex}</span>}
                    {patient.blood_pressure && <span>BP {patient.blood_pressure}</span>}
                    {patient.heart_rate && <span>HR {patient.heart_rate}</span>}
                  </div>
                </div>
                {/* Time */}
                <div className="text-[10px] text-slate-400 whitespace-nowrap mr-1">
                  {new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {/* Mark seen */}
                <button
                  onClick={() => markSeen(patient)}
                  disabled={markingId === patient.id}
                  title="Mark as seen"
                  className="shrink-0 w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center transition-all group-hover:opacity-100 disabled:opacity-40"
                >
                  {markingId === patient.id
                    ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    : <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  }
                </button>
              </motion.div>
            ))}

            {/* Seen patients (collapsed section) */}
            {seen.length > 0 && (
              <div key="seen-section" className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  ✓ Seen Today ({seen.length})
                </p>
                {seen.map((patient) => (
                  <motion.div
                    key={patient.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl flex items-center gap-3 mb-2 opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 truncate line-through decoration-slate-300">{patient.name}</p>
                    </div>
                    <button
                      onClick={() => markSeen(patient)}
                      disabled={markingId === patient.id}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
                    >
                      Undo
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

// ─── Main DashboardHome ────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { profile, loading, user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ patients: 0, appointments: 0, earnings: 0 })
  const [todaysAppointments, setTodaysAppointments] = useState([])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id || !profile?.role) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]

      if (profile.role === 'doctor') {
        const [{ count: patientsCount }, { count: apptCount }] = await Promise.all([
          supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', user.id),
          supabase.from('appointments').select('id', { count: 'exact' }).eq('doctor_id', user.id),
        ])
        setStats({ patients: patientsCount || 0, appointments: apptCount || 0, earnings: 6220 })

        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', user.id)
          .gte('date', today)
          .lt('date', tomorrow)
          .order('time', { ascending: true })

        if (appointments?.length) {
          const patientIds = [...new Set(appointments.map(a => a.patient_id))]
          const { data: patientsData } = await supabase.from('patients').select('id, name').in('id', patientIds)
          const map = (patientsData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
          setTodaysAppointments(appointments.map(a => ({ ...a, patients: map[a.patient_id] })))
        } else {
          setTodaysAppointments([])
        }
      } else if (profile.role === 'patient') {
        const [{ count: apptCount }, { count: rxCount }] = await Promise.all([
          supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('patient_id', user.id),
          supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('patient_id', user.id),
        ])
        setStats({ appointments: apptCount || 0, patients: rxCount || 0, earnings: 0 })

        const { data: appointments } = await supabase
          .from('appointments')
          .select('*, doctors:doctor_id(name)')
          .eq('patient_id', user.id)
          .gte('date', today)
          .lt('date', tomorrow)
          .order('date', { ascending: true })
        setTodaysAppointments(appointments || [])
      }
    } catch (error) {
      console.error('Dashboard data error:', error)
    }
  }, [user?.id, profile?.role])

  useEffect(() => {
    if (profile && user) fetchDashboardData()
  }, [profile, user, fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (profile?.role === 'receptionist') {
    return <Navigate to="/dashboard/reception" replace />
  }

  const isDoctor = profile?.role === 'doctor'

  const quickActions = isDoctor ? [
    { icon: Users, label: 'Add Patient', path: '/dashboard/patients?action=create', color: 'from-cyan-500 to-blue-500' },
    { icon: Calendar, label: 'New Appointment', path: '/dashboard/appointments?action=new', color: 'from-blue-500 to-cyan-500' },
    { icon: FileText, label: 'Create Prescription', path: '/dashboard/patients?action=prescription', color: 'from-emerald-500 to-teal-500' },
  ] : [
    { icon: Calendar, label: 'Book Appointment', path: '/dashboard/appointments', color: 'from-cyan-500 to-blue-500' },
    { icon: FileText, label: 'View Prescriptions', path: '/dashboard/prescriptions', color: 'from-blue-500 to-emerald-500' },
  ]

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Quick Actions:
          </div>
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${action.color} text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to={isDoctor ? '/dashboard/patients' : '/dashboard/prescriptions'} className="block transition-transform hover:scale-[1.02]">
          <StatCard
            title={isDoctor ? 'Total Patients' : 'Total Prescriptions'}
            value={stats.patients}
            trendValue={10}
            chartData={[120, 150, 140, 180, 160, 190, 210]}
          />
        </Link>
        <Link to="/dashboard/appointments" className="block transition-transform hover:scale-[1.02]">
          <StatCard
            title="Total Appointments"
            value={stats.appointments}
            trendValue={-2}
            chartData={[90, 85, 95, 88, 92, 85, 82]}
          />
        </Link>
        {isDoctor ? (
          <div className="block">
            <StatCard
              title="Total Earnings"
              value={`$${stats.earnings.toLocaleString()}`}
              trendValue={16}
              chartData={[500, 520, 540, 580, 600, 620, 640]}
            />
          </div>
        ) : (
          <div className="block">
            <StatCard
              title="Upcoming Visits"
              value={todaysAppointments.length}
              trendValue={5}
              chartData={[2, 3, 2, 4, 3, 5, 4]}
            />
          </div>
        )}
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isDoctor && <PatientEngagementChart />}

        {/* Today's Appointments */}
        <div className={`glass-panel col-span-1 ${isDoctor ? '' : 'lg:col-span-2'} p-6 flex flex-col`} style={{ minHeight: '360px' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Appointments</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your schedule for today</p>
            </div>
            <Link
              to="/dashboard/appointments"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-4 py-2 rounded-xl transition-all hover:scale-105"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {todaysAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4 shadow-lg">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">No appointments today</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">You're all clear!</p>
              </div>
            ) : (
              todaysAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-base shadow-lg group-hover:scale-110 transition-transform">
                      {isDoctor ? (apt.patients?.name?.charAt(0) || 'P') : (apt.doctors?.name?.charAt(0) || 'D')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {isDoctor ? (apt.patients?.name || 'Patient') : (apt.doctors?.name || 'Doctor')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {format(new Date(`${apt.date}T${apt.time}`), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide',
                    apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      apt.status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )}>
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Queue — Doctor Only */}
        {isDoctor && (
          <div style={{ minHeight: '360px' }}>
            <TodaysQueuePanel doctorId={user?.id} />
          </div>
        )}
      </div>
    </div>
  )
}

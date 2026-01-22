import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Users, Calendar, FileText, Activity, Clock, ArrowUpRight, TrendingUp, Search, MoreVertical, Shield, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { format } from 'date-fns'

export default function DashboardHome() {
  const { profile, loading, user } = useAuth()
  const [greeting, setGreeting] = useState('')
  const [stats, setStats] = useState({
    col1: 0,
    col2: 0,
    col3: '98%',
    col4: 0
  })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [upcomingAppointment, setUpcomingAppointment] = useState(null)
  const [recentPrescriptions, setRecentPrescriptions] = useState([])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    if (profile && user) {
      fetchDashboardData()
    }
  }, [profile, user])

  const fetchDashboardData = async () => {
    try {
      if (profile.role === 'doctor') {
        // Fetch Stats
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', user.id)
          
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', user.id)
          .eq('status', 'scheduled')

        const { count: prescriptionsCount } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', user.id)

        setStats({
          col1: patientsCount || 0,
          col2: appointmentsCount || 0,
          col3: '98%',
          col4: prescriptionsCount || 0
        })

        // Fetch Recent Appointments (Today/Upcoming)
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            *,
            patients (first_name, last_name)
          `)
          .eq('doctor_id', user.id)
          .eq('status', 'scheduled')
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(5)

        setRecentAppointments(appointments || [])

      } else {
        // Patient Logic
        const { data: patientData } = await supabase
          .from('patients')
          .select('id')
          .eq('email', user.email)
          .single()
        
        const patientId = patientData?.id

        let appointmentsCount = 0
        let prescriptionsCount = 0

        // Count appointments
        let aptQuery = supabase.from('appointments').select('*', { count: 'exact', head: true })
        
        if (patientId) {
          aptQuery = aptQuery.or(`patient_id.eq.${user.id},patient_id.eq.${patientId}`)
        } else {
          aptQuery = aptQuery.eq('patient_id', user.id)
        }
        
        const { count: aptCount } = await aptQuery
        appointmentsCount = aptCount || 0

        // Count prescriptions
        if (patientId) {
          const { count: rxCount } = await supabase
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
          prescriptionsCount = rxCount || 0
        }

        setStats({
          col1: appointmentsCount,
          col2: prescriptionsCount,
          col3: 'Good',
          col4: 0
        })

        // Fetch Next Appointment
        let nextAptQuery = supabase
          .from('appointments')
          .select(`
            *,
            profiles:doctor_id (full_name)
          `)
          .eq('status', 'scheduled')
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(1)

        if (patientId) {
          nextAptQuery = nextAptQuery.or(`patient_id.eq.${user.id},patient_id.eq.${patientId}`)
        } else {
          nextAptQuery = nextAptQuery.eq('patient_id', user.id)
        }

        const { data: nextApt } = await nextAptQuery
        setUpcomingAppointment(nextApt?.[0] || null)

        // Fetch Recent Prescriptions
        if (patientId) {
          const { data: rx } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(3)
          setRecentPrescriptions(rx || [])
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 glass-card rounded-2xl max-w-md mx-auto border border-red-200">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't load your profile information. This usually happens if the database setup is incomplete.
          </p>
          <div className="text-sm text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
             <code className="text-red-500">Error: Missing 'profiles' table</code>
          </div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 shadow-xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {greeting}, {profile.full_name?.split(' ')[0]}
              </h1>
              <p className="mt-2 text-blue-100 text-lg max-w-xl">
                {profile.role === 'doctor' 
                  ? "You have a busy schedule ahead. Here's your daily overview." 
                  : "Track your health journey and manage your appointments easily."}
              </p>
            </div>
            {profile.role === 'patient' && (
              <Link to="/dashboard/appointments" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-blue-700 bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-lg shadow-blue-900/20 hover:scale-105 transform">
                Book Appointment
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid (Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={profile.role === 'doctor' ? "Total Patients" : "Appointments"} 
          value={stats.col1} 
          trend={profile.role === 'doctor' ? "Active" : "Upcoming"} 
          trendUp={true} 
          icon={Users}
          color="blue"
        />
        <StatCard 
          title={profile.role === 'doctor' ? "Pending Visits" : "Prescriptions"} 
          value={stats.col2} 
          trend={profile.role === 'doctor' ? "Scheduled" : "Active"} 
          trendUp={true} 
          icon={Calendar}
          color="purple"
        />
        <StatCard 
          title="Health Score" 
          value={stats.col3} 
          trend="Stable" 
          trendUp={true} 
          icon={Activity}
          color="emerald"
        />
        <StatCard 
          title="Documents" 
          value={stats.col4} 
          trend="Total" 
          trendUp={true} 
          icon={FileText}
          color="indigo"
        />
      </div>

      {/* Role Specific Content */}
      {profile.role === 'doctor' ? (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Today's Schedule
              </h2>
              <Link to="/dashboard/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors">
                View Calendar <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {recentAppointments.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {recentAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                          {format(new Date(apt.appointment_date), 'h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {apt.patients?.first_name?.[0]}{apt.patients?.last_name?.[0]}
                            </div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {apt.patients?.first_name} {apt.patients?.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          General Checkup
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Confirmed
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">No appointments today</h3>
                  <p className="mt-1 text-slate-500">Enjoy your free time!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointment */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-32 h-32 text-blue-600" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Next Appointment
              </h2>
              {upcomingAppointment ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {format(new Date(upcomingAppointment.appointment_date), 'd')}
                      </span>
                      <span className="text-sm font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase">
                        {format(new Date(upcomingAppointment.appointment_date), 'MMM')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Consultation with {upcomingAppointment.profiles?.full_name}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        General Checkup • 30 mins
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Clock className="h-4 w-4" />
                        {format(new Date(upcomingAppointment.appointment_date), 'h:mm a')}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Confirmed
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No upcoming appointments scheduled.</p>
                  <Link to="/dashboard/appointments" className="btn btn-primary btn-sm">
                    Book Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Recent Prescriptions
            </h2>
            <div className="space-y-4">
              {recentPrescriptions.length > 0 ? (
                recentPrescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {rx.medication_name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {format(new Date(rx.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent prescriptions.</p>
              )}
              <Link to="/dashboard/prescriptions" className="block text-center text-sm font-bold text-purple-600 hover:text-purple-700 mt-4">
                View All History
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.role === 'doctor' ? (
            <>
              <ActionCard 
                title="Manage Patients" 
                description="View records, update history, and manage patient files."
                icon={Users}
                link="/dashboard/patients"
                color="from-blue-500 to-blue-600"
              />
              <ActionCard 
                title="Add New Patient" 
                description="Register a new patient to your practice."
                icon={TrendingUp}
                link="/dashboard/patients?action=create"
                color="from-indigo-500 to-purple-600"
              />
              <ActionCard 
                title="Availability"  
                description="Update your weekly schedule and working hours."
                icon={Calendar}
                link="/dashboard/availability"
                color="from-emerald-500 to-emerald-600"
              />
              <ActionCard 
                title="Appointments" 
                description="View your schedule and book appointments for patients."
                icon={Clock}
                link="/dashboard/appointments"
                color="from-purple-500 to-purple-600"
              />
            </>
          ) : (
            <>
              <ActionCard 
                title="Book Appointment" 
                description="Find a doctor and schedule a consultation."
                icon={Calendar}
                link="/dashboard/appointments"
                color="from-indigo-500 to-indigo-600"
              />
              <ActionCard 
                title="My Prescriptions" 
                description="Access your digital prescriptions and history."
                icon={FileText}
                link="/dashboard/prescriptions"
                color="from-purple-500 to-purple-600"
              />
              <ActionCard 
                title="Health Records" 
                description="View your medical history and test results."
                icon={Activity}
                link="#"
                color="from-pink-500 to-pink-600"
              />
            </>
          )}
        </div>
      </div>

    </div>
  )
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  }

  return (
    <div className="glass-card p-6 rounded-2xl transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{title}</p>
    </div>
  )
}

function ActionCard({ title, description, icon: Icon, link, color }) {
  return (
    <Link to={link} className="glass-card group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${color}`}></div>
      <div className="p-8">
        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
          {description}
        </p>
        <div className="mt-6 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          View Details <ArrowUpRight className="ml-2 h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}

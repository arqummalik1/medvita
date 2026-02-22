import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
    UserPlus, Activity, Users, Clock,
    Loader2, CheckCircle2, AlertCircle,
    WifiOff, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'

// ── Isolated toast helper ────────────────────────────────────────────────────
function useToast() {
    const [toast, setToast] = useState(null)
    const show = useCallback((type, message) => {
        setToast({ type, message })
        const id = setTimeout(() => setToast(null), 3500)
        return () => clearTimeout(id)
    }, [])
    return { toast, show }
}

// ── Empty-queue state ────────────────────────────────────────────────────────
function EmptyQueue() {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/30">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-semibold">Queue is empty</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Add a patient using the form on the left.</p>
        </div>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ReceptionDashboard() {
    const { profile, loading: authLoading } = useAuth()
    const { toast, show: showToast } = useToast()
    const [submitting, setSubmitting] = useState(false)
    const [isLoadingPatients, setIsLoadingPatients] = useState(true)
    const [todayPatients, setTodayPatients] = useState([])

    const EMPTY_FORM = { name: '', age: '', sex: '', phone: '', email: '', blood_pressure: '', heart_rate: '' }
    const [formData, setFormData] = useState(EMPTY_FORM)

    // ── Fetch today's queue ──────────────────────────────────────────────────
    const fetchTodayPatients = useCallback(async () => {
        if (!profile?.employer_id) return
        setIsLoadingPatients(true)

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from('patients')
            .select('id, name, age, sex, patient_id, blood_pressure, heart_rate, created_at')
            .eq('doctor_id', profile.employer_id)
            .gte('created_at', startOfDay.toISOString())
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Failed to load queue:', error)
            showToast('error', 'Could not load today\'s queue. Please refresh.')
        } else {
            setTodayPatients(data || [])
        }
        setIsLoadingPatients(false)
    }, [profile?.employer_id, showToast])

    // ── Realtime subscription ────────────────────────────────────────────────
    useEffect(() => {
        if (!profile?.employer_id) return
        fetchTodayPatients()

        const channel = supabase
            .channel(`reception:patients:${profile.employer_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'patients',
                    filter: `doctor_id=eq.${profile.employer_id}`,
                },
                (payload) => {
                    const startOfDay = new Date()
                    startOfDay.setHours(0, 0, 0, 0)

                    if (payload.eventType === 'INSERT') {
                        // Only add if it's today's patient
                        if (new Date(payload.new.created_at) >= startOfDay) {
                            setTodayPatients(prev => [payload.new, ...prev])
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setTodayPatients(prev =>
                            prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setTodayPatients(prev => prev.filter(p => p.id !== payload.old.id))
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Reception realtime connected')
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ Reception realtime error — falling back to manual refresh')
                }
            })

        return () => supabase.removeChannel(channel)
    }, [profile?.employer_id, fetchTodayPatients])

    // ── Auth / profile loading ───────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            </div>
        )
    }

    // ── Unlinked receptionist guard ─────────────────────────────────────────
    if (!profile?.employer_id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 gap-4">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <WifiOff className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Not Linked</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
                    Your staff account is not yet linked to a clinic. This can happen if the Clinic Code was invalid.
                    Please contact your doctor and ask them to share a valid <strong>6-character Clinic Code</strong> from their Settings.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    You may need to create a new account using the correct code.
                </p>
            </div>
        )
    }

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            showToast('error', 'Patient name is required.')
            return
        }
        setSubmitting(true)

        try {
            const patientId = 'P-' + Math.random().toString(36).substring(2, 8).toUpperCase()

            const { error } = await supabase.from('patients').insert([{
                name: formData.name.trim(),
                age: formData.age ? parseInt(formData.age, 10) : null,
                sex: formData.sex || null,
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                blood_pressure: formData.blood_pressure.trim() || null,
                heart_rate: formData.heart_rate ? parseInt(formData.heart_rate, 10) : null,
                patient_id: patientId,
                doctor_id: profile.employer_id,
            }])

            if (error) {
                // RLS violation — likely employer_id mismatch
                if (error.code === '42501') {
                    throw new Error('Permission denied. Your account may not be properly linked to this clinic.')
                }
                throw error
            }

            showToast('success', `✓ ${formData.name} added to the queue!`)
            setFormData(EMPTY_FORM)
            // Queue refreshes automatically via realtime subscription
        } catch (err) {
            console.error('Failed to add patient:', err)
            showToast('error', err.message || 'Failed to add patient. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">

            {/* Fixed toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: -20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.97 }}
                        className={clsx(
                            'fixed top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 border',
                            toast.type === 'success'
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'bg-red-500 border-red-400 text-white'
                        )}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                            : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p className="font-bold text-sm">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                        <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reception Desk</h1>
                        <p className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Fast-entry clinic queue manager
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchTodayPatients}
                    title="Refresh queue"
                    className="relative z-10 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors self-start md:self-center"
                >
                    <RefreshCw className="h-5 w-5 text-white" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Input Form ─────────────────────────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 shadow-xl sticky top-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add Patient to Queue</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Patient Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input-field w-full"
                                    placeholder="Full Name"
                                    maxLength={120}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        min="0"
                                        max="150"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        placeholder="e.g. 34"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Gender</label>
                                    <select
                                        name="sex"
                                        value={formData.sex}
                                        onChange={handleChange}
                                        className="input-field w-full text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Phone <span className="font-normal normal-case">(opt)</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        placeholder="+92 300 0000000"
                                        maxLength={20}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email <span className="font-normal normal-case">(opt)</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        placeholder="patient@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Blood Pressure</label>
                                    <input
                                        type="text"
                                        name="blood_pressure"
                                        value={formData.blood_pressure}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        placeholder="120/80"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Heart Rate</label>
                                    <input
                                        type="number"
                                        name="heart_rate"
                                        min="0"
                                        max="300"
                                        value={formData.heart_rate}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        placeholder="bpm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {submitting
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</>
                                    : <><Activity className="w-5 h-5" /> Send to Doctor</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Today's Queue ───────────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Waitlist Today
                        </h2>
                        <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-200/50 dark:border-blue-800/50">
                            {isLoadingPatients ? '...' : `${todayPatients.length} Waiting`}
                        </div>
                    </div>

                    {isLoadingPatients ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                            <p className="text-sm">Loading queue...</p>
                        </div>
                    ) : todayPatients.length === 0 ? (
                        <EmptyQueue />
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {todayPatients.map((patient, i) => (
                                    <motion.div
                                        key={patient.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                                        className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4"
                                    >
                                        {/* Avatar & name */}
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-base shadow-inner shrink-0">
                                                {patient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 dark:text-white truncate">{patient.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                                                    {patient.patient_id && (
                                                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                                            {patient.patient_id}
                                                        </span>
                                                    )}
                                                    {patient.age && <span>{patient.age} y/o</span>}
                                                    {patient.sex && <span>{patient.sex}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vitals + time */}
                                        <div className="hidden sm:flex items-center gap-4 shrink-0">
                                            {(patient.blood_pressure || patient.heart_rate) && (
                                                <div className="flex gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
                                                    {patient.blood_pressure && (
                                                        <div>
                                                            <span className="block text-[9px] uppercase text-slate-400 font-bold">BP</span>
                                                            <span className="font-mono text-slate-700 dark:text-slate-300">{patient.blood_pressure}</span>
                                                        </div>
                                                    )}
                                                    {patient.heart_rate && (
                                                        <div>
                                                            <span className="block text-[9px] uppercase text-slate-400 font-bold">HR</span>
                                                            <span className="font-mono text-slate-700 dark:text-slate-300">{patient.heart_rate} <span className="text-[9px]">bpm</span></span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Time</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

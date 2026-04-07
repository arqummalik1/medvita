import { useState, Fragment, useEffect } from 'react'
import { Dialog, Transition, RadioGroup, Switch } from '@headlessui/react'
import { X, Moon, Sun, Monitor, Type, Layout, Bell, Calendar, Settings, FileText, Save, Loader2, Key, Copy, RefreshCw, Check, Activity } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { signInToGoogle, signOutFromGoogle, initializeGoogleAPI } from '../lib/googleCalendar'
import clsx from 'clsx'

export default function SettingsModal({ isOpen, onClose }) {
    const { theme, toggleTheme, density, setDensity, appStyle, setAppStyle } = useTheme()
    const { user, profile, fetchProfile } = useAuth()

    // Notifications State
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        return localStorage.getItem('notifications_enabled') !== 'false'
    })

    // View State for sub-pages
    const [view, setView] = useState('main') // 'main' | 'prescription'

    // Google Calendar State
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)

    // Prescription Settings Local State
    const [prescriptionForm, setPrescriptionForm] = useState({
        clinic_name: '',
        doctor_qualification: '',
        clinic_address: '',
        clinic_timings: '',
        doctor_footer_text: '',
        clinic_logo_url: ''
    })
    const [isSavingPrescription, setIsSavingPrescription] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Clinic Code State
    const [clinicCode, setClinicCode] = useState('')
    const [isGeneratingCode, setIsGeneratingCode] = useState(false)
    const [copiedCode, setCopiedCode] = useState(false)

    useEffect(() => {
        if (profile?.role === 'doctor') {
            initializeGoogleAPI().catch(console.error)
            // Initialize local form state from profile
            setPrescriptionForm({
                clinic_name: profile.clinic_name || '',
                doctor_qualification: profile.doctor_qualification || '',
                clinic_address: profile.clinic_address || '',
                clinic_timings: profile.clinic_timings || '',
                doctor_footer_text: profile.doctor_footer_text || '',
                clinic_logo_url: profile.clinic_logo_url || ''
            })
            setClinicCode(profile.clinic_code || '')
        }
    }, [profile])


    const handleNotificationsToggle = (enabled) => {
        setNotificationsEnabled(enabled)
        localStorage.setItem('notifications_enabled', enabled.toString())
    }

    const handleGoogleCalendarToggle = async (enabled) => {
        if (!user) return

        setIsConnectingGoogle(true)
        try {
            if (enabled) {
                await signInToGoogle()
                const { error } = await supabase
                    .from('profiles')
                    .update({ google_calendar_sync_enabled: true })
                    .eq('id', user.id)
                if (error) throw error
            } else {
                signOutFromGoogle()
                const { error } = await supabase
                    .from('profiles')
                    .update({ google_calendar_sync_enabled: false })
                    .eq('id', user.id)
                if (error) throw error
            }
            await fetchProfile(user.id)
        } catch (error) {
            console.error('Error toggling Google Calendar:', error)
            alert('Failed to update Google Calendar settings: ' + error.message)
        } finally {
            setIsConnectingGoogle(false)
        }
    }

    const handlePrescriptionChange = (e) => {
        const { name, value } = e.target
        setPrescriptionForm(prev => ({ ...prev, [name]: value }))
        setHasChanges(true)
    }

    const savePrescriptionSettings = async () => {
        setIsSavingPrescription(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    clinic_name: prescriptionForm.clinic_name,
                    doctor_qualification: prescriptionForm.doctor_qualification,
                    clinic_address: prescriptionForm.clinic_address,
                    clinic_timings: prescriptionForm.clinic_timings,
                    doctor_footer_text: prescriptionForm.doctor_footer_text,
                    clinic_logo_url: prescriptionForm.clinic_logo_url
                })
                .eq('id', user.id)

            if (error) throw error
            await fetchProfile(user.id)
            setHasChanges(false)
            alert('Settings saved successfully!')
        } catch (error) {
            console.error('Error saving prescription settings:', error)
            alert('Failed to save settings: ' + (error.message || error.hint || JSON.stringify(error)))
        } finally {
            setIsSavingPrescription(false)
        }
    }

    const generateClinicCode = async (retries = 0) => {
        if (retries > 3) {
            alert('Failed to generate a unique code after multiple attempts. Please try again.')
            setIsGeneratingCode(false)
            return
        }
        setIsGeneratingCode(true)
        try {
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
            const { error } = await supabase
                .from('profiles')
                .update({ clinic_code: newCode })
                .eq('id', user.id)

            if (error) {
                if (error.code === '23505') {
                    return generateClinicCode(retries + 1)
                }
                throw error
            }

            setClinicCode(newCode)
            await fetchProfile(user.id)
        } catch (error) {
            console.error('Error generating clinic code:', error)
            alert('Failed to generate code: ' + error.message)
        } finally {
            setIsGeneratingCode(false)
        }
    }

    const copyCodeToClipboard = () => {
        if (!clinicCode) return
        navigator.clipboard.writeText(clinicCode)
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
    }

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            // Use Base64 for simplicity as requested previously
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64 = reader.result
                setPrescriptionForm(prev => ({ ...prev, clinic_logo_url: base64 }))
                setHasChanges(true)
            }
            reader.readAsDataURL(file)
        } catch (err) {
            console.error(err)
        }
    }

    const densities = [
        { name: 'Compact', value: 'compact', description: 'Maximum info' },
        { name: 'Comfortable', value: 'normal', description: 'Standard view' },
        { name: 'Spacious', value: 'spacious', description: 'Relaxed view' },
    ]

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl glass-panel p-0 text-left align-middle shadow-2xl transition-all">
                                {view === 'main' ? (
                                    <>
                                        {/* Header */}
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                                            <Dialog.Title as="h3" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                Settings
                                            </Dialog.Title>
                                            <button
                                                onClick={onClose}
                                                className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {/* Appearance Section */}
                                            <section>
                                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    <Monitor className="h-3 w-3" /> Appearance
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => theme === 'dark' && toggleTheme()}
                                                        className={clsx(
                                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200",
                                                            theme === 'light'
                                                                ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-500 shadow-sm"
                                                                : "border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/30"
                                                        )}
                                                    >
                                                        <Sun className="h-4 w-4" />
                                                        <span className="font-bold text-xs">Light</span>
                                                    </button>
                                                    <button
                                                        onClick={() => theme === 'light' && toggleTheme()}
                                                        className={clsx(
                                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200",
                                                            theme === 'dark'
                                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500 shadow-sm"
                                                                : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/30"
                                                        )}
                                                    >
                                                        <Moon className="h-4 w-4" />
                                                        <span className="font-bold text-xs">Dark</span>
                                                    </button>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 dark:bg-slate-700/50" />

                                            {/* Design Style Section */}
                                            <section>
                                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    <Layout className="h-3 w-3" /> Workspace Style
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => setAppStyle('modern')}
                                                        className={clsx(
                                                            "flex flex-col items-center justify-center text-center gap-2 p-3 rounded-lg border transition-all duration-200",
                                                            appStyle === 'modern'
                                                                ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-500 shadow-sm"
                                                                : "border-slate-200 dark:border-slate-700 hover:border-cyan-200 dark:hover:border-cyan-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/30"
                                                        )}
                                                    >
                                                        <Activity className="h-4 w-4" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs">Modern</span>
                                                            <span className="text-[10px] opacity-70">Vibrant & Glassy</span>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setAppStyle('minimal')}
                                                        className={clsx(
                                                            "flex flex-col items-center justify-center text-center gap-2 p-3 rounded-lg border transition-all duration-200",
                                                            appStyle === 'minimal'
                                                                ? "border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-1 ring-slate-900 dark:ring-slate-100 shadow-sm"
                                                                : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/30"
                                                        )}
                                                    >
                                                        <Type className="h-4 w-4" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs">Minimal</span>
                                                            <span className="text-[10px] opacity-70">Pure & Focused</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 dark:bg-slate-700/50" />

                                            {/* Doctor Only Settings */}
                                            {profile?.role === 'doctor' && (
                                                <>
                                                    <section>
                                                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">
                                                            <Key className="h-3 w-3" /> Clinic Staff Access
                                                        </h4>
                                                        <div className="bg-white dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                                            <div className="flex flex-col gap-3">
                                                                <div>
                                                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">Clinic Code</h3>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                                                        Share this code with your receptionists. They will need it to sign up and link their account to your clinic queue.
                                                                    </p>
                                                                </div>

                                                                {clinicCode ? (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-center font-mono text-lg tracking-widest font-bold text-cyan-600 dark:text-cyan-400">
                                                                            {clinicCode}
                                                                        </div>
                                                                        <button
                                                                            onClick={copyCodeToClipboard}
                                                                            className="p-3 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors border border-cyan-200 dark:border-cyan-800"
                                                                            title="Copy Code"
                                                                        >
                                                                            {copiedCode ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={generateClinicCode}
                                                                        disabled={isGeneratingCode}
                                                                        className="w-full mt-1 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        {isGeneratingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                                                        Generate Unique Code
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </section>
                                                    <div className="h-px bg-slate-100 dark:bg-slate-700/50" />
                                                    <section>
                                                        <button
                                                            onClick={() => setView('prescription')}
                                                            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 rounded-md bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400">
                                                                    <FileText className="h-4 w-4" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Customize Prescription</h4>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Logo, Layout & Details</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-slate-400 group-hover:text-cyan-500 transition-colors text-sm">→</div>
                                                        </button>
                                                    </section>
                                                    <div className="h-px bg-slate-100 dark:bg-slate-700/50" />
                                                </>
                                            )}

                                            {/* Density Section */}
                                            <section>
                                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    <Layout className="h-3 w-3" /> Interface Density
                                                </h4>
                                                <RadioGroup value={density} onChange={setDensity}>
                                                    <div className="space-y-2">
                                                        {densities.map((item) => (
                                                            <RadioGroup.Option
                                                                key={item.name}
                                                                value={item.value}
                                                                className={({ active, checked }) =>
                                                                    clsx(
                                                                        "relative flex cursor-pointer rounded-lg px-3 py-2 border focus:outline-none transition-all duration-200",
                                                                        checked
                                                                            ? "bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 border-cyan-500 ring-1 ring-cyan-500 shadow-sm"
                                                                            : "bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700"
                                                                    )
                                                                }
                                                            >
                                                                {({ active, checked }) => (
                                                                    <div className="flex w-full items-center justify-between">
                                                                        <div className="flex items-center">
                                                                            <div className="text-sm">
                                                                                <RadioGroup.Label
                                                                                    as="p"
                                                                                    className={clsx("font-bold mb-0.5 text-xs", checked ? "text-cyan-900 dark:text-cyan-100" : "text-slate-900 dark:text-white")}
                                                                                >
                                                                                    {item.name}
                                                                                </RadioGroup.Label>
                                                                                <RadioGroup.Description
                                                                                    as="span"
                                                                                    className={clsx("inline text-[10px]", checked ? "text-cyan-700 dark:text-cyan-300" : "text-slate-500 dark:text-slate-400")}
                                                                                >
                                                                                    {item.description}
                                                                                </RadioGroup.Description>
                                                                            </div>
                                                                        </div>
                                                                        {checked && (
                                                                            <div className="shrink-0 text-cyan-600 dark:text-cyan-400">
                                                                                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </RadioGroup.Option>
                                                        ))}
                                                    </div>
                                                </RadioGroup>
                                            </section>

                                            <div className="h-px bg-slate-100 dark:bg-slate-700/50" />

                                            {/* Preferences Section */}
                                            <section>
                                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    <Bell className="h-3 w-3" /> Preferences
                                                </h4>
                                                <div className="bg-white dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Push Notifications</h3>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Alerts for appointments</p>
                                                    </div>
                                                    <Switch
                                                        checked={notificationsEnabled}
                                                        onChange={handleNotificationsToggle}
                                                        className={`${notificationsEnabled ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}
                                                        relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                                                    >
                                                        <span className="sr-only">Use setting</span>
                                                        <span
                                                            aria-hidden="true"
                                                            className={`${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}
                                                            pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                        />
                                                    </Switch>
                                                </div>
                                            </section>

                                            {/* Integrations Section (Doctors Only) */}
                                            {profile?.role === 'doctor' && (
                                                <>
                                                    <div className="h-px bg-slate-100 dark:bg-slate-700/50" />
                                                    <section>
                                                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                            <Calendar className="h-3 w-3" /> Integrations
                                                        </h4>
                                                        <div className="bg-white dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                                                                    Google Calendar
                                                                    {profile?.google_calendar_sync_enabled && (
                                                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pr-4">
                                                                    Sync appointments automatically.
                                                                </p>
                                                            </div>

                                                            {isConnectingGoogle ? (
                                                                <div className="ml-4 flex items-center justify-center p-1">
                                                                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                                                </div>
                                                            ) : (
                                                                <Switch
                                                                    checked={profile?.google_calendar_sync_enabled || false}
                                                                    onChange={handleGoogleCalendarToggle}
                                                                    className={`${profile?.google_calendar_sync_enabled ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}
                                                                    relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                                                                >
                                                                    <span className="sr-only">Sync Google Calendar</span>
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className={`${profile?.google_calendar_sync_enabled ? 'translate-x-4' : 'translate-x-0'}
                                                                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                                    />
                                                                </Switch>
                                                            )}
                                                        </div>
                                                    </section>
                                                </>
                                            )}
                                        </div>

                                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                            <button
                                                type="button"
                                                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                                                onClick={onClose}
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Prescription Customize View */}
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setView('main')
                                                        setHasChanges(false) // discarding changes if back pressed without save
                                                    }}
                                                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <span className="text-base text-slate-500 dark:text-slate-400">←</span>
                                                </button>
                                                <Dialog.Title as="h3" className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Customize Prescription
                                                </Dialog.Title>
                                            </div>
                                            <button
                                                onClick={onClose}
                                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {/* Logo Section */}
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Clinic Logo</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden relative group">
                                                        {prescriptionForm.clinic_logo_url ? (
                                                            <img src={prescriptionForm.clinic_logo_url} alt="Logo" className="h-full w-full object-contain" />
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleLogoUpload}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            <button className="w-full py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-colors pointer-events-none border-b-2">
                                                                Upload from Local
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            name="clinic_logo_url"
                                                            className="input-field w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                            placeholder="Or paste image URL..."
                                                            value={prescriptionForm.clinic_logo_url}
                                                            onChange={handlePrescriptionChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">CLINIC NAME</label>
                                                    <input
                                                        type="text"
                                                        name="clinic_name"
                                                        className="input-field w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                        placeholder="MedVita Clinic"
                                                        value={prescriptionForm.clinic_name}
                                                        onChange={handlePrescriptionChange}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">QUALIFICATION</label>
                                                        <input
                                                            type="text"
                                                            name="doctor_qualification"
                                                            className="input-field w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                            placeholder="MBBS, MD"
                                                            value={prescriptionForm.doctor_qualification}
                                                            onChange={handlePrescriptionChange}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">TIMINGS</label>
                                                        <input
                                                            type="text"
                                                            name="clinic_timings"
                                                            className="input-field w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                            placeholder="Mon-Sat: 9AM - 5PM"
                                                            value={prescriptionForm.clinic_timings}
                                                            onChange={handlePrescriptionChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ADDRESS</label>
                                                    <input
                                                        type="text"
                                                        name="clinic_address"
                                                        className="input-field w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                        placeholder="123 Health St, City"
                                                        value={prescriptionForm.clinic_address}
                                                        onChange={handlePrescriptionChange}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">FOOTER TEXT</label>
                                                    <input
                                                        type="text"
                                                        name="doctor_footer_text"
                                                        className="input-field w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                        placeholder="Thank you for your visit."
                                                        value={prescriptionForm.doctor_footer_text}
                                                        onChange={handlePrescriptionChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Save Action Bar */}
                                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setView('main')}
                                                className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!hasChanges || isSavingPrescription}
                                                className={clsx(
                                                    "px-4 py-1.5 rounded-lg flex items-center gap-2 font-bold text-xs shadow-md transition-all",
                                                    hasChanges
                                                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white hover:scale-105"
                                                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                                )}
                                                onClick={savePrescriptionSettings}
                                            >
                                                {isSavingPrescription ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-3 w-3" /> Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

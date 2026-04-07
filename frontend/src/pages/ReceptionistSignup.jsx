import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, User, CheckCircle2, AlertCircle, Key, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function ReceptionistSignup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [clinicCode, setClinicCode] = useState('')
    const [toast, setToast] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setToast(null);

        if (!clinicCode.trim() || clinicCode.length !== 6) {
            setToast({ type: 'error', message: 'Please enter a valid 6-character Clinic Access Code.' });
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setToast({ type: 'error', message: 'Password must be at least 8 characters long.' });
            setLoading(false);
            return;
        }

        try {
            const { data: doctorProfile, error: codeError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('clinic_code', clinicCode.trim().toUpperCase())
                .eq('role', 'doctor')
                .single();

            if (codeError || !doctorProfile) {
                setToast({ type: 'error', message: 'Invalid Clinic Code. Please verify the code with your doctor.' });
                setLoading(false);
                return;
            }

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'receptionist',
                        clinic_code: clinicCode.trim().toUpperCase(),
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data?.user) {
                if (data.session) {
                    setToast({ type: 'success', message: `✓ Linked to Dr. ${doctorProfile.full_name || 'your doctor'}! Redirecting...` });
                    setTimeout(() => navigate('/dashboard/reception'), 2000);
                } else {
                    setToast({ type: 'success', message: `Account created! Check your inbox at ${email} to confirm, then sign in.` });
                }
            } else {
                setToast({ type: 'error', message: 'Signup did not complete. Please try again or contact support.' });
            }
        } catch (error) {
            console.error('Staff signup error:', error);
            if (error.message?.includes('User already registered')) {
                setToast({ type: 'error', message: 'This email is already registered. Please sign in instead.' });
            } else if (error.message?.includes('Password should be')) {
                setToast({ type: 'error', message: 'Password is too weak. Please use at least 8 characters.' });
            } else if (error.message?.includes('rate limit') || error.message?.includes('over_email_send_rate_limit')) {
                setToast({ type: 'error', message: 'Too many signup attempts. Please wait a minute and try again.' });
            } else {
                setToast({ type: 'error', message: error.message || 'Staff Signup failed. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 overflow-y-auto overflow-x-hidden">

            {/* Background blobs — NO pink/purple/indigo */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 dark:opacity-30 animate-pulse duration-[15s]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-blue-400/15 dark:bg-blue-500/8 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 dark:opacity-25 animate-pulse duration-[18s]" />
            </div>

            <div className="w-full max-w-xl p-6 sm:p-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl sm:rounded-[40px] shadow-2xl border border-white/50 dark:border-slate-700/50 relative z-10 my-auto">

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={clsx(
                                'fixed top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] p-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] border backdrop-blur-md',
                                toast.type === 'success'
                                    ? 'bg-emerald-500 border-emerald-400 text-white'
                                    : 'bg-red-500 border-red-400 text-white'
                            )}
                        >
                            {toast.type === 'success' ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 shrink-0" />
                            )}
                            <p className="font-medium text-sm">{toast.message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="text-center mb-6 sm:mb-10 relative z-10">
                    {/* Icon — blue to cyan, no indigo */}
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 sm:mb-6 group shadow-xl shadow-blue-500/30 hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <Key className="h-8 w-8 sm:h-10 sm:w-10 text-white relative z-10" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight">Staff Access</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-medium px-2">Link your account to a clinic using the Doctor's Code</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

                    {/* Clinic Code — blue accent, no indigo */}
                    <div className="p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl">
                        <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">Clinic Access Code *</label>
                        <p className="text-[10px] sm:text-xs text-blue-600/80 dark:text-blue-400 mb-3">Ask your doctor for the unique 6-character integration code found in their settings.</p>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                                <Lock className="h-5 w-5 text-blue-300 dark:text-blue-500" />
                            </div>
                            <input
                                name="clinicCode"
                                type="text"
                                required
                                maxLength={6}
                                className="input-field pl-12 bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 font-mono text-lg tracking-widest uppercase"
                                placeholder="XXXXXX"
                                value={clinicCode}
                                onChange={(e) => setClinicCode(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Staff Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    name="fullName"
                                    type="text"
                                    required
                                    className="input-field pl-12"
                                    placeholder="e.g. John Assistant"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Email address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input-field pl-12"
                                    placeholder="e.g. staff@clinic.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                            {loading ? (
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                    Linking Account...
                                </span>
                            ) : (
                                <span className="relative z-10">Create Staff Registration</span>
                            )}
                        </button>
                    </div>

                    <div className="text-center pt-2 relative z-10">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors uppercase text-xs tracking-wider border-b border-blue-200 dark:border-blue-800 pb-0.5 ml-1">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

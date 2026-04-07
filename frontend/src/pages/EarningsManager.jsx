import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import StatCard from '../components/StatCard'
import { TrendingUp, DollarSign, Wallet, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function EarningsManager() {
    const { user, profile, loading: authLoading } = useAuth()
    const [stats, setStats] = useState({ earnings: 6220, trend: 16 })
    const [loading, setLoading] = useState(true)

    const fetchEarningsData = useCallback(async () => {
        if (!user?.id) return
        try {
            // NOTE: Currently using hardcoded value as per original dashboard
            // In a real app, this would fetch from a 'transactions' or 'earnings' table
            setStats({ earnings: 6220, trend: 16 })
            setLoading(false)
        } catch (error) {
            console.error('Error fetching earnings:', error)
            setLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        if (user) fetchEarningsData()
    }, [user, fetchEarningsData])

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading earnings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                        Earnings Overview
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Track your financial performance and growth.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Withdraw Funds
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <StatCard
                        title="Total Earnings"
                        value={`$${stats.earnings.toLocaleString()}`}
                        trendValue={stats.trend}
                        chartData={[500, 520, 540, 580, 600, 620, 640]}
                        className="h-full"
                    />
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />

                    <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Available for Payout</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">$4,250.00</h3>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Next Payout:</span>
                            <span className="font-bold text-slate-900 dark:text-white">Mar 1st, 2026</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                className="bg-emerald-500 h-full rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown (Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Transactions</h3>
                    <div className="space-y-4">
                        {[
                            { id: 1, patient: "John Doe", date: "2026-02-22", amount: 150, status: "completed" },
                            { id: 2, patient: "Alice Smith", date: "2026-02-21", amount: 120, status: "completed" },
                            { id: 3, patient: "Robert Brown", date: "2026-02-21", amount: 200, status: "pending" },
                        ].map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                                        {tx.patient.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{tx.patient}</p>
                                        <p className="text-xs text-slate-500">{tx.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">${tx.amount}</p>
                                    <span className={clsx(
                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                        tx.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>{tx.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                    <h3 className="text-lg font-bold mb-2">Revenue Insights</h3>
                    <p className="text-blue-100 text-sm mb-6">Your earnings increased by 16% compared to last month. Great job!</p>

                    <div className="space-y-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <p className="text-xs text-blue-100 mb-1">Average per Patient</p>
                            <p className="text-2xl font-black">$145.00</p>
                        </div>

                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <p className="text-xs text-blue-100 mb-1">Projected March Revenue</p>
                            <p className="text-2xl font-black">$7,500.00</p>
                            <div className="flex items-center gap-1 mt-1 text-emerald-300">
                                <ArrowUpRight className="w-4 h-4" />
                                <span className="text-xs font-bold">+12% from Feb</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

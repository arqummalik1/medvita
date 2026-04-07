import { Bell, Menu as MenuIcon, ChevronDown, Activity, Search, Settings, LogOut, X, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { Button } from './ui/Button';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabaseClient';
import {
    signInToGoogle,
    signOutFromGoogle,
    initializeGoogleAPI
} from '../lib/googleCalendar';
import SettingsModal from './SettingsModal';

export default function Header({ onMenuClick }) {
    const { user, profile, signOut, fetchProfile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (profile?.role === 'doctor') {
            initializeGoogleAPI().catch(console.error);
        }
    }, [profile]);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <>
            <header className="welcome-header">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        onClick={onMenuClick}
                    >
                        <MenuIcon className="h-6 w-6" />
                    </button>

                    {/* App Icon — Cyan to Emerald gradient */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-cyan-500/30 dark:shadow-cyan-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <Activity className="text-white w-5 h-5 md:w-6 md:h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-emerald-400/0 group-hover:from-cyan-400/30 group-hover:to-emerald-400/30 transition-all duration-500" />
                    </div>

                    {/* Welcome Text */}
                    <div className="hidden sm:block">
                        <h1 className="text-xl md:text-2xl font-normal text-slate-800 dark:text-white tracking-tight">
                            Welcome Back, <span className="font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">{profile?.full_name?.split(' ')[0] || 'User'}</span>!
                        </h1>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Here's what's happening today.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search Bar */}
                    <div className="hidden md:flex items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl px-3 py-2 w-64 lg:w-80 focus-within:ring-2 focus-within:ring-cyan-500/50 dark:focus-within:ring-cyan-400/50 border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-lg hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-600 group">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 mr-2 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Patients..."
                            className="bg-transparent border-none outline-none text-xs w-full placeholder-slate-400 text-slate-700 dark:text-white focus:placeholder-slate-300 dark:focus:placeholder-slate-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate(`/dashboard/patients?search=${encodeURIComponent(e.target.value)}`);
                                }
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>

                        {/* Notification bell — cyan dot, no pink */}
                        <button className="relative p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300 text-slate-600 dark:text-slate-300 hover:scale-110 hover:text-cyan-600 dark:hover:text-cyan-400 group">
                            <Bell className="h-5 w-5 transition-transform group-hover:animate-pulse" />
                            <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 border-2 border-white dark:border-slate-900 shadow-lg shadow-cyan-400/50 animate-pulse" />
                        </button>

                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center gap-2 outline-none group text-left">
                                {/* Avatar — cyan to blue */}
                                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-lg shadow-cyan-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-cyan-500/50 transition-all duration-300 border-2 border-white/20 dark:border-slate-700/50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                    <span className="relative z-10 text-sm md:text-base">{profile?.full_name?.charAt(0) || 'U'}</span>
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{profile?.full_name || 'User'}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider">{profile?.role === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'}</p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors group-hover:rotate-180 duration-300" />
                            </Menu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-slate-200/50 dark:divide-slate-700/50 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus:outline-none z-50 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => setIsSettingsOpen(true)}
                                                    className={`${active
                                                        ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 text-cyan-700 dark:text-cyan-400'
                                                        : 'text-slate-700 dark:text-slate-300'
                                                        } group flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105`}
                                                >
                                                    <Settings className="mr-3 h-4 w-4" />
                                                    Settings
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleLogout}
                                                    className={`${active
                                                        ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-600 dark:text-red-400'
                                                        : 'text-slate-700 dark:text-slate-300'
                                                        } group flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105`}
                                                >
                                                    <LogOut className="mr-3 h-4 w-4" />
                                                    Logout
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </header>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}

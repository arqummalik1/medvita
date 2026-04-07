import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
    Home,
    Users,
    Calendar,
    FileText,
    Clock,
    MessageSquare,
    LogOut,
    Settings,
    Activity,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';

export default function Sidebar({ onClose }) {
    const location = useLocation();
    const { profile, signOut } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', label: 'Home', href: '/dashboard', icon: Home, roles: ['patient', 'doctor'] },
        { name: 'Reception Desk', label: 'Reception', href: '/dashboard/reception', icon: Activity, roles: ['receptionist'] },
        { name: 'Appointments', label: 'Schedule', href: '/dashboard/appointments', icon: Calendar, roles: ['patient', 'doctor'] },
        { name: 'Patients', label: 'Patients', href: '/dashboard/patients', icon: Users, roles: ['doctor'] },
        { name: 'Availability', label: 'Availability', href: '/dashboard/availability', icon: Clock, roles: ['doctor'] },
        { name: 'Earnings', label: 'Earnings', href: '/dashboard/earnings', icon: TrendingUp, roles: ['doctor'] },
        { name: 'Prescriptions', label: 'Rx', href: '/dashboard/prescriptions', icon: FileText, roles: ['patient', 'doctor'] },
        { name: 'AI Chat', label: 'AI Chat', href: '/chatbot', icon: MessageSquare, roles: ['patient', 'doctor'] },
    ];

    const navigation = navItems.filter(item => item.roles.includes(profile?.role));

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.href ||
            (item.href === '/dashboard' && location.pathname === '/dashboard');

        return (
            <Link
                to={item.href}
                title={item.name}
                onClick={onClose}
                className={clsx(
                    'sidebar-nav-item group',
                    isActive && 'active'
                )}
            >
                {/* Active left-bar indicator */}
                {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-r-full shadow-sm shadow-cyan-400/60" />
                )}

                <item.icon
                    className={clsx(
                        'w-5 h-5 transition-all duration-300 relative z-10 shrink-0',
                        isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'
                    )}
                />
                <span className="sidebar-nav-label relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <aside className="sidebar overflow-y-auto no-scrollbar h-full py-4 flex flex-col">
            <nav className="flex flex-col gap-1 items-center w-full px-2 flex-1">
                {navigation.map((item) => (
                    <NavItem key={item.name} item={item} />
                ))}

                <div className="h-px w-10 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-3" />

                {/* Settings button */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="sidebar-nav-item group"
                    title="Settings"
                >
                    <Settings className="w-5 h-5 relative z-10 group-hover:rotate-45 transition-transform duration-500 shrink-0" />
                    <span className="sidebar-nav-label relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                        Settings
                    </span>
                </button>

                {/* Spacer to push logout to bottom */}
                <div className="flex-1" />

                {/* Logout button */}
                <button
                    onClick={async () => {
                        await signOut();
                        onClose();
                    }}
                    className="sidebar-nav-item group hover:!bg-red-50 dark:hover:!bg-red-900/20 hover:!text-red-500 dark:hover:!text-red-400 mb-2"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                    <span className="sidebar-nav-label relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                        Logout
                    </span>
                </button>
            </nav>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </aside>
    );
}

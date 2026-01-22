import { Fragment, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Dialog, Transition } from '@headlessui/react'
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Menu, 
  X, 
  LogOut,
  Activity,
  ChevronRight,
  Settings,
  Bell,
  Clock
} from 'lucide-react'
import clsx from 'clsx'
import ThemeToggle from './ThemeToggle'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navigation = profile?.role === 'doctor' 
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Patients', href: '/dashboard/patients', icon: Users },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
        { name: 'Availability', href: '/dashboard/availability', icon: Clock },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
        { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: FileText },
      ]

  return (
    <div className="min-h-screen transition-colors duration-500">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-50">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl border-r border-white/20">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center justify-between px-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 tracking-tight">MedVita</span>
                    </div>
                  </div>
                  <nav className="px-4 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</div>
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={clsx(
                          location.pathname === item.href
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800/30'
                            : 'text-slate-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/50 hover:text-slate-900 dark:hover:text-white',
                          'group flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200'
                        )}
                      >
                        <item.icon
                          className={clsx(
                            location.pathname === item.href ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-5 w-5 transition-colors'
                          )}
                        />
                        {item.name}
                        {location.pathname === item.href && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="border-t border-slate-100 dark:border-gray-800 p-4 bg-gradient-to-b from-transparent to-white/40 dark:to-black/20">
                  <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                      <div className="h-full w-full rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.full_name}</p>
                      <button onClick={handleSignOut} className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors">Sign out</button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modern Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-gray-800/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center px-6 mb-10">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 tracking-tight">MedVita</span>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</div>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800/30'
                        : 'text-slate-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/50 hover:text-slate-900 dark:hover:text-white',
                      'group flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 ease-in-out'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-gray-300',
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                      )}
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-gray-800/50 bg-gradient-to-b from-transparent to-white/40 dark:to-black/20">
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition-transform hover:scale-[1.02] cursor-pointer ring-1 ring-slate-200/50 dark:ring-white/5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                <div className="h-full w-full rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs font-medium text-slate-500 truncate">
                  {profile?.role === 'doctor' ? 'Doctor Account' : 'Patient Account'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1 min-h-screen">
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border-b border-slate-200/20 dark:border-white/5 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden -ml-2 p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:truncate">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-900"></span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

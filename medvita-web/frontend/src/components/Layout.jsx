import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container relative min-h-screen">
      <div className="main-content relative w-full">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out 
          md:relative md:translate-x-0 md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-transparent">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="dashboard-content flex-1 overflow-y-auto p-6 md:p-8 animate-enter">
            {children}
          </div>
        </main>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

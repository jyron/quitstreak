import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, Trophy, Settings } from 'lucide-react'

const tabs = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/check-in', icon: ClipboardCheck, label: 'Check-in' },
  { to: '/app/milestones', icon: Trophy, label: 'Milestones' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] px-2 pt-1.5 pb-1 flex justify-around"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-4 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
                )}
                <Icon size={24} strokeWidth={isActive ? 2.2 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

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
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-around" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

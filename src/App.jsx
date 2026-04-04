import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Milestones from './pages/Milestones'
import Settings from './pages/Settings'
import PartnerSetup from './pages/PartnerSetup'
import PartnerDashboard from './pages/PartnerDashboard'
import Onboarding from './pages/Onboarding'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/partner/:shareCode" element={<PartnerDashboard />} />

      <Route path="/app/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="check-in" element={<CheckIn />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="settings" element={<Settings />} />
        <Route path="partner-setup" element={<PartnerSetup />} />
      </Route>
    </Routes>
  )
}

/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Login from './pages/Login'
import GroupData from './pages/GroupData'
import Attendance from './pages/Attendance'
import Reports from './pages/Reports'
import { ReportsSyncWrapper } from './components/reports/ReportsSyncWrapper'
import HealthMetrics from './pages/HealthMetrics'
import Compilation from './pages/Compilation'
import Publishers from './pages/Publishers'
import PublisherProfile from './pages/PublisherProfile'
import ReportsHistory from './pages/ReportsHistory'
import UsersAdmin from './pages/UsersAdmin'
import DeliberativeReport from './pages/DeliberativeReport'
import Tutorial from './pages/Tutorial'
import Settings from './pages/Settings'
import { Skeleton } from '@/components/ui/skeleton'

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-8 w-[200px] mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/group-data" element={<GroupData />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route
              path="/reports"
              element={
                <ReportsSyncWrapper>
                  <Reports />
                </ReportsSyncWrapper>
              }
            />
            <Route path="/metrics" element={<HealthMetrics />} />
            <Route path="/compilation" element={<Compilation />} />
            <Route path="/publishers" element={<Publishers />} />
            <Route path="/publishers/:id" element={<PublisherProfile />} />
            <Route path="/reports-history" element={<ReportsHistory />} />
            <Route path="/deliberative-report" element={<DeliberativeReport />} />
            <Route path="/users" element={<UsersAdmin />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

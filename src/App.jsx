import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Projects from './pages/Projects'
import Movements from './pages/Movements'
import Reports from './pages/Reports'
import GeneralReports from './pages/GeneralReports'
import DeliveryNotes from './pages/DeliveryNotes'
import Charts from './pages/Charts'
import SupplierContractorHub from './pages/SupplierContractorHub'
import Suppliers from './pages/Suppliers'
import Contractors from './pages/Contractors'
import AuditLog from './pages/AuditLog'
import Layout from './components/Layout'

// Protected Route Component using Auth Context
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/movements" element={<Movements />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/general" element={<GeneralReports />} />
                    <Route path="/reports/delivery-notes" element={<DeliveryNotes />} />
                    <Route path="/charts" element={<Charts />} />
                    <Route path="/suppliers-contractors" element={<SupplierContractorHub />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/contractors" element={<Contractors />} />
                    <Route path="/audit" element={<AuditLog />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

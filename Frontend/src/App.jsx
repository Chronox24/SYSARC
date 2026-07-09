import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"

import Navbar from "./components/Navbar"
import LoginPage from "./pages/LoginPage"
import RegistrationPage from "./pages/RegistrationPage"
import DashboardPage from "./pages/DashboardPage"
import ProfilePage from "./pages/ProfilePage"
import AboutUs from "./pages/AboutUs"
import RequestFormPage from "./pages/RequestFormPage"
import AdminLoginPage from "./pages/AdminLoginPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"
import ErrorBoundary from "./components/ErrorBoundary"

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Navbar />}
      
      <Routes>
        <Route path="/" element={<AboutUs />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/mission" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/request" element={<RequestFormPage />} />
        <Route path="/admin" element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedAdminRoute>
              <ErrorBoundary>
                <AdminDashboardPage />
              </ErrorBoundary>
            </ProtectedAdminRoute>
          } 
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App




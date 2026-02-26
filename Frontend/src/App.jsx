import { BrowserRouter, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar"
import LoginPage from "./pages/LoginPage"
import RegistrationPage from "./pages/RegistrationPage"
import DashboardPage from "./pages/DashboardPage"
import ProfilePage from "./pages/ProfilePage"
import AboutUs from "./pages/AboutUs"
import MissionVision from "./pages/MissionVision"
import RequestFormPage from "./pages/RequestFormPage"
import AdminLoginPage from "./pages/AdminLoginPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import HelpButton from "./components/HelpButton"

function App() {
  return (
    <BrowserRouter>
      <Navbar />   
      <HelpButton />
      
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/mission" element={<MissionVision />} />
        <Route path="/request" element={<RequestFormPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App




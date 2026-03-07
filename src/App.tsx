import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import Signup from '@/pages/auth/Signup';
import Onboarding from '@/pages/onboarding/Onboarding';
import Interests from '@/pages/onboarding/Interests';
import WorkloadPreferences from '@/pages/onboarding/WorkloadPreferences';
import Dashboard from '@/pages/dashboard/Dashboard';
import CourseCatalog from '@/pages/catalog/CourseCatalog';
import DepartmentSelect from '@/pages/catalog/DepartmentSelect';
import DepartmentView from '@/pages/catalog/DepartmentView';
import SchedulePlanner from '@/pages/schedule/SchedulePlanner';
import StudentProfile from '@/pages/profile/StudentProfile';
import GraduationCheck from '@/pages/graduation/GraduationCheck';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          {/* Auth */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />

          {/* Course catalog (protected) */}
          <Route path="/catalog" element={<ProtectedRoute><CourseCatalog /></ProtectedRoute>} />

          {/* Public catalog */}
          <Route path="/explore" element={<DepartmentSelect />} />
          <Route path="/department/:id" element={<DepartmentView />} />

          {/* Onboarding (protected) */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/onboarding/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
          <Route path="/onboarding/workload" element={<ProtectedRoute><WorkloadPreferences /></ProtectedRoute>} />

          {/* Schedule (protected) */}
          <Route path="/schedule" element={<ProtectedRoute><SchedulePlanner /></ProtectedRoute>} />

          {/* Profile (protected) */}
          <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />

          {/* Graduation Check (protected) */}
          <Route path="/graduation" element={<ProtectedRoute><GraduationCheck /></ProtectedRoute>} />

          {/* Dashboard (protected) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/src/pages/auth/Login';
import ForgotPassword from '@/src/pages/auth/ForgotPassword';
import ResetPassword from '@/src/pages/auth/ResetPassword';
import Signup from '@/src/pages/auth/Signup';
import Onboarding from '@/src/pages/onboarding/Onboarding';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </Router>
  );
}

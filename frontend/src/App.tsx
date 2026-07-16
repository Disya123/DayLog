import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { CalendarsPage } from '@/pages/CalendarsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { SharePage } from '@/pages/SharePage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:token" element={<SharePage />} />

      <Route
        path="/calendars"
        element={
          <ProtectedRoute>
            <CalendarsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendars/:id"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/calendars" replace />} />
      <Route path="*" element={<Navigate to="/calendars" replace />} />
    </Routes>
  );
}

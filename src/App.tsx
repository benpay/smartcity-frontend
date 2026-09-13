import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SensorsPage from './pages/SensorsPage';
import SensorDetailPage from './pages/SensorDetailPage';
import IngestionsPage from './pages/IngestionsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </div>
  );

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sensors" element={<PrivateRoute><SensorsPage /></PrivateRoute>} />
      <Route path="/sensors/:id" element={<PrivateRoute><SensorDetailPage /></PrivateRoute>} />
      <Route path="/ingestions" element={<PrivateRoute><IngestionsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/sensors" replace />} />
    </Routes>
  );
}
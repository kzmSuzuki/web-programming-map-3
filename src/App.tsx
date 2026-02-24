import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/common/AdminRoute';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RootPage } from './pages/RootPage';
import { StudentPage } from './pages/StudentPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <StudentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

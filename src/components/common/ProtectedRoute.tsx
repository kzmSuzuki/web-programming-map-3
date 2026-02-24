import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="centered">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

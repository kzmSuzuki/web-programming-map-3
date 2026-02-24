import { Navigate } from 'react-router-dom';
import { LoginCard } from '../components/auth/LoginCard';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="centered">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/student" replace />;
  }

  return <LoginCard />;
};

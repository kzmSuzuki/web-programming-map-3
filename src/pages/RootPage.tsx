import { LoginCard } from '../components/auth/LoginCard';
import { useAuth } from '../hooks/useAuth';
import { StudentPage } from './StudentPage';

export const RootPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="centered">Loading...</div>;
  }

  if (!user) {
    return <LoginCard />;
  }

  return <StudentPage />;
};

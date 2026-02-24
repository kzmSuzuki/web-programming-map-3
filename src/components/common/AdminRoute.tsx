import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminEmail } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

export const AdminRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user?.email) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      const result = await isAdminEmail(user.email);
      setAllowed(result);
      setChecking(false);
    };

    void run();
  }, [user?.email]);

  if (loading || checking) {
    return <div className="centered">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowed) {
    return <Navigate to="/student" replace />;
  }

  return children;
};

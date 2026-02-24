import { useEffect, useState } from 'react';
import {
  subscribeAllProgress,
  subscribeUserProgressWithError,
  type ProgressDoc,
} from '../firebase/firestore';
import type { UserProgress } from '../types';

export const useUserProgress = (email?: string | null) => {
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    const unsub = subscribeUserProgressWithError(
      email,
      (nextProgress) => {
        setProgress(nextProgress);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [email]);

  return { progress, loading, error };
};

export const useAllProgress = () => {
  const [progressDocs, setProgressDocs] = useState<ProgressDoc[]>([]);

  useEffect(() => {
    const unsub = subscribeAllProgress(setProgressDocs);
    return () => unsub();
  }, []);

  return { progressDocs };
};

import { useEffect, useState } from 'react';
import { subscribeNodesWithError } from '../firebase/firestore';
import type { SkillNode } from '../types';

export const useNodes = () => {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeNodesWithError(
      (nextNodes) => {
        setNodes(nextNodes);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { nodes, loading, error };
};

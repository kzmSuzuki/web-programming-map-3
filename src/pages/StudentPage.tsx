import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleStar, ExternalLink, LockKeyhole, X, LockKeyholeOpen } from 'lucide-react';
import type { JSX } from 'react';
import { Header } from '../components/common/Header';
import { GraphView } from '../components/graph/GraphView';
import { ICON_COLOR_TOKENS, ICON_TOKENS } from '../constants/uiTokens';
import { ensureRootActive } from '../firebase/firestore';
import { useAllProgress, useUserProgress } from '../hooks/useProgress';
import { useNodes } from '../hooks/useNodes';
import { useAuth } from '../hooks/useAuth';
import type { NodeState } from '../types';

export const StudentPage = () => {
  const { user } = useAuth();
  const { nodes, loading: nodeLoading, error: nodeError } = useNodes();
  const { progress, loading: progressLoading, error: progressError } = useUserProgress(user?.email);
  const { progressDocs } = useAllProgress(!!user);
  const [hoveredNode, setHoveredNode] = useState<{
    id: string;
    title: string;
    state: NodeState;
    summary: string;
    notionUrl: string;
    x: number;
    y: number;
  } | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [pendingNode, setPendingNode] = useState<typeof hoveredNode>(null);

  const closeModal = useCallback(() => {
    if (!hoveredNode || isModalClosing) return;
    setPendingNode(null);
    setIsModalClosing(true);
  }, [hoveredNode, isModalClosing]);

  const handleNodeHover = useCallback(
    (details: typeof hoveredNode) => {
      if (details) {
        if (hoveredNode?.id === details.id) return;
        if (hoveredNode && isModalClosing) {
          setPendingNode(details);
          return;
        }
        if (hoveredNode) {
          setPendingNode(details);
          setIsModalClosing(true);
        } else {
          setHoveredNode(details);
        }
      } else {
        closeModal();
      }
    },
    [closeModal, hoveredNode, isModalClosing],
  );

  useEffect(() => {
    if (!isModalClosing || !hoveredNode) return;
    const timer = setTimeout(() => {
      setHoveredNode(pendingNode);
      setPendingNode(null);
      setIsModalClosing(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [isModalClosing, hoveredNode, pendingNode]);

  useEffect(() => {
    if (!user?.email || nodes.length === 0) {
      return;
    }
    const rootIds = nodes.filter((node) => node.predecessorId === null).map((n) => n.id);
    void ensureRootActive(user.email, rootIds);
  }, [nodes, user?.email]);

  const crowdArrivalCount = useMemo(() => {
    if (!user?.email) {
      return {} as Record<string, number>;
    }

    const latestByUser = new Map<string, { nodeId: string; at: number }>();

    progressDocs.forEach((doc) => {
      if (doc.email === user.email || doc.state !== 'cleared' || !doc.clearedAt) {
        return;
      }
      const at = doc.clearedAt.toMillis();
      const curr = latestByUser.get(doc.email);
      if (!curr || curr.at < at) {
        latestByUser.set(doc.email, { nodeId: doc.nodeId, at });
      }
    });

    const counts: Record<string, number> = {};
    latestByUser.forEach(({ nodeId }) => {
      counts[nodeId] = (counts[nodeId] ?? 0) + 1;
    });
    return counts;
  }, [progressDocs, user?.email]);

  const openNode = (state: NodeState, notionUrl: string) => {
    if (state === 'initial') {
      return;
    }
    const normalizedUrl = /^https?:\/\//i.test(notionUrl) ? notionUrl : `https://${notionUrl}`;
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  

  const stateView: Record<NodeState, { icon: JSX.Element; label: string }> = {
    initial: {
      icon: (
        <LockKeyhole
          size={ICON_TOKENS.modalStateSize}
          strokeWidth={ICON_TOKENS.modalStateStroke}
          color={ICON_COLOR_TOKENS.locked}
        />
      ),
      label: 'Locked',
    },
    active: {
      icon: (
        <LockKeyholeOpen
          size={ICON_TOKENS.modalStateSize}
          strokeWidth={ICON_TOKENS.modalStateStroke}
          color={ICON_COLOR_TOKENS.active}
        />
      ),
      label: 'Active',
    },
    cleared: {
      icon: (
        <CircleStar
          size={ICON_TOKENS.modalStateSize}
          strokeWidth={ICON_TOKENS.modalClearedStroke}
          color={ICON_COLOR_TOKENS.cleared}
        />
      ),
      label: 'Cleared',
    },
  };

  const modalPos = useMemo(() => {
    if (!hoveredNode) {
      return null;
    }
    const width = 360;
    const height = 290;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(hoveredNode.x + 16, margin), vw - width - margin);
    const top = Math.min(Math.max(hoveredNode.y + 16, margin), vh - height - margin);
    return { left, top };
  }, [hoveredNode]);

  if (nodeLoading || progressLoading) {
    return <div className="centered">Loading...</div>;
  }

  if (nodeError || progressError) {
    return (
      <div className="centered">
        データ読み込みに失敗しました: {nodeError ?? progressError}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header email={user?.email} />
      <GraphView nodes={nodes} progress={progress} crowdArrivalCount={crowdArrivalCount} onNodeHover={handleNodeHover} />
      {hoveredNode && modalPos ? (
        <aside
          className={`node-detail-modal ${isModalClosing ? 'node-detail-modal-closing' : ''}`}
          style={modalPos}
          role="dialog"
          aria-label="ノード詳細"
        >
          <button type="button" className="node-modal-close" aria-label="閉じる" onClick={closeModal}>
            <X size={ICON_TOKENS.modalCloseSize} strokeWidth={ICON_TOKENS.modalCloseStroke} color={ICON_COLOR_TOKENS.modalClose} />
          </button>
          <h3>
            <span className="node-detail-id">{hoveredNode.id}</span>
            {hoveredNode.title} <span className="state-inline-icon">{stateView[hoveredNode.state].icon}</span>
          </h3>
          <div className="node-summary">{hoveredNode.summary || '概要文は未設定です。'}</div>
          <button
            type="button"
            className="modal-external-btn"
            disabled={hoveredNode.state === 'initial'}
            onClick={() => openNode(hoveredNode.state, hoveredNode.notionUrl)}
          >
            <ExternalLink size={ICON_TOKENS.modalExternalSize} strokeWidth={ICON_TOKENS.modalExternalStroke} color={'#2f3542'} />
            <span className="modal-external-text"> Explore now !!</span>
          </button>
        </aside>
      ) : null}
    </div>
  );
};


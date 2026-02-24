import { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, LockKeyhole, X, LockKeyholeOpen } from 'lucide-react';
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
  const { progressDocs } = useAllProgress();
  const [hoveredNode, setHoveredNode] = useState<{
    id: string;
    title: string;
    state: NodeState;
    summary: string;
    notionUrl: string;
    x: number;
    y: number;
  } | null>(null);

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
        <Check
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
      <GraphView nodes={nodes} progress={progress} crowdArrivalCount={crowdArrivalCount} onNodeHover={setHoveredNode} />
      {hoveredNode && modalPos ? (
        <aside className="node-detail-modal" style={modalPos} role="dialog" aria-label="ノード詳細">
          <button type="button" className="node-modal-close" aria-label="閉じる" onClick={() => setHoveredNode(null)}>
            <X size={ICON_TOKENS.modalCloseSize} strokeWidth={ICON_TOKENS.modalCloseStroke} />
          </button>
          <h3>Node Details</h3>
          <dl>
            <dt>番号</dt>
            <dd>{hoveredNode.id}</dd>
            <dt>タイトル</dt>
            <dd>{hoveredNode.title}</dd>
            <dt>状態</dt>
            <dd>
              <span className="state-inline-icon">{stateView[hoveredNode.state].icon}</span>
              {stateView[hoveredNode.state].label}
            </dd>
            <dt>概要文</dt>
            <dd className="node-summary">{hoveredNode.summary || '概要文は未設定です。'}</dd>
          </dl>
          <button
            type="button"
            disabled={hoveredNode.state === 'initial'}
            onClick={() => openNode(hoveredNode.state, hoveredNode.notionUrl)}
          >
            <ExternalLink size={ICON_TOKENS.modalExternalSize} strokeWidth={ICON_TOKENS.modalExternalStroke} />
            別タブで開く
          </button>
        </aside>
      ) : null}
    </div>
  );
};


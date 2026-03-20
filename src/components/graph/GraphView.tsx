import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
import { deriveNodeState } from '../../utils/deriveNodeState';
import { applyDagreLayout } from '../../utils/layout';
import type { NodeState, SkillNode, UserProgress } from '../../types';

const nodeTypes = {
  skillNode: CustomNode,
};

type Props = {
  nodes: SkillNode[];
  progress: Record<string, UserProgress>;
  crowdArrivalCount: Record<string, number>;
  onNodeHover: (
    details: {
      id: string;
      title: string;
      state: NodeState;
      summary: string;
      notionUrl: string;
      x: number;
      y: number;
    } | null,
  ) => void;
};

const FIT_VIEW_OPTS = { padding: 0.45, minZoom: 0.2 } as const;

type FlowInnerProps = {
  layouted: Node[];
  flowEdges: Edge[];
  nodeIdsKey: string;
  onNodeHover: Props['onNodeHover'];
};

const GraphFlowInner = ({ layouted, flowEdges, nodeIdsKey, onNodeHover }: FlowInnerProps) => {
  const { fitView } = useReactFlow();
  const fittedForKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!nodeIdsKey || layouted.length === 0) {
      fittedForKeyRef.current = null;
      return;
    }
    if (fittedForKeyRef.current === nodeIdsKey) return;
    fittedForKeyRef.current = nodeIdsKey;
    const id = requestAnimationFrame(() => {
      void fitView(FIT_VIEW_OPTS);
    });
    return () => cancelAnimationFrame(id);
  }, [nodeIdsKey, layouted.length, fitView]);

  return (
    <ReactFlow
      fitView={false}
      nodes={layouted}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={{
        zIndex: 1,
      }}
      fitViewOptions={FIT_VIEW_OPTS}
      onNodeMouseEnter={(event, node) => {
        const data = node.data as {
          id?: string;
          label?: string;
          state?: NodeState;
          summary?: string;
          notionUrl?: string;
        };
        if (!data.id || !data.label || !data.state || !data.notionUrl) {
          return;
        }
        onNodeHover({
          id: data.id,
          title: data.label,
          state: data.state,
          summary: data.summary ?? '',
          notionUrl: data.notionUrl,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPaneClick={() => onNodeHover(null)}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
    />
  );
};

export const GraphView = ({ nodes, progress, crowdArrivalCount, onNodeHover }: Props) => {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const nodeIdsKey = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const zoomHintKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (zoomHintKeyRef.current === nodeIdsKey) return;
    zoomHintKeyRef.current = nodeIdsKey;
    setShowZoomHint(true);
    const t = window.setTimeout(() => setShowZoomHint(false), 3200);
    return () => {
      clearTimeout(t);
      zoomHintKeyRef.current = null;
    };
  }, [nodeIdsKey, nodes.length]);

  const flowNodes: Node[] = nodes.map((node) => {
    const state = deriveNodeState(node, progress, nodeById);
    return {
      id: node.id,
      type: 'skillNode',
      position: { x: 0, y: 0 },
      data: {
        id: node.id,
        label: node.label,
        level: node.level,
        state,
        notionUrl: node.notionUrl,
        summary: node.summary ?? '',
        crowdCount: crowdArrivalCount[node.id] ?? 0,
      },
    };
  });

  const flowEdges: Edge[] = nodes
    .filter((node) => node.predecessorId)
    .map((node) => ({
      id: `${node.predecessorId}->${node.id}`,
      type: 'smoothstep',
      source: node.predecessorId as string,
      target: node.id,
      style: {
        stroke: '#aeb6c6',
        strokeWidth: 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#aeb6c6',
      },
    }));

  const layouted = applyDagreLayout(flowNodes, flowEdges);

  return (
    <div className="graph-wrap">
      {showZoomHint && (
        <div className="zoom-hint">
          <div className="zoom-hint-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
              <line x1="24" y1="10" x2="24" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <polyline points="20,14 24,10 28,14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="24" y1="30" x2="24" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <polyline points="20,34 24,38 28,34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="zoom-hint-label">Scroll to zoom</span>
        </div>
      )}
      <ReactFlowProvider>
        <GraphFlowInner layouted={layouted} flowEdges={flowEdges} nodeIdsKey={nodeIdsKey} onNodeHover={onNodeHover} />
      </ReactFlowProvider>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
import { applyDagreLayout } from '../../utils/layout';
import type { NodeState, SkillNode, UserProgress } from '../../types';

const ANIMATION_DELAY_MS = 70;

const topologicalOrder = (nodes: SkillNode[]): Map<string, number> => {
  const children = new Map<string, SkillNode[]>();
  for (const node of nodes) {
    if (node.predecessorId) {
      const list = children.get(node.predecessorId) ?? [];
      list.push(node);
      children.set(node.predecessorId, list);
    }
  }
  const order = new Map<string, number>();
  let idx = 0;
  const roots = nodes.filter((n) => n.predecessorId === null);
  const queue = [...roots];
  let i = 0;
  while (i < queue.length) {
    const node = queue[i++];
    order.set(node.id, idx++);
    for (const child of children.get(node.id) ?? []) {
      queue.push(child);
    }
  }
  for (const node of nodes) {
    if (!order.has(node.id)) order.set(node.id, idx++);
  }
  return order;
};

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

const deriveState = (
  node: SkillNode,
  progressByNodeId: Record<string, UserProgress>,
  nodeById: Map<string, SkillNode>,
): NodeState => {
  const own = progressByNodeId[node.id]?.state;
  if (own) {
    return own;
  }

  if (node.predecessorId === null) {
    return 'active';
  }

  const predecessor = nodeById.get(node.predecessorId);
  if (!predecessor) {
    return 'initial';
  }

  return progressByNodeId[predecessor.id]?.state === 'cleared' ? 'active' : 'initial';
};

export const GraphView = ({ nodes, progress, crowdArrivalCount, onNodeHover }: Props) => {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const animOrder = useMemo(() => topologicalOrder(nodes), [nodes]);
  const orderedNodes = useMemo(
    () => [...nodes].sort((a, b) => (animOrder.get(a.id) ?? 0) - (animOrder.get(b.id) ?? 0)),
    [animOrder, nodes],
  );
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (orderedNodes.length === 0) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= orderedNodes.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, ANIMATION_DELAY_MS);
    return () => clearInterval(timer);
  }, [orderedNodes]);

  const visibleNodeIdSet = new Set(
    orderedNodes.slice(0, visibleCount).map((node) => node.id),
  );

  const flowNodes: Node[] = nodes.map((node) => {
    const state = deriveState(node, progress, nodeById);
    const revealed = visibleNodeIdSet.has(node.id);
    return {
      id: node.id,
      type: 'skillNode',
      position: { x: 0, y: 0 },
      style: {
        opacity: revealed ? 1 : 0,
        transition: 'opacity 0.32s ease-out',
      },
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

  const allFlowEdges: Edge[] = nodes
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

  const flowEdges: Edge[] = allFlowEdges.filter(
    (edge) => visibleNodeIdSet.has(edge.source) && visibleNodeIdSet.has(edge.target),
  );

  const layouted = applyDagreLayout(flowNodes, allFlowEdges);

  return (
    <div className="graph-wrap">
      <ReactFlow
        fitView
        nodes={layouted}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          zIndex: 1,
        }}
        fitViewOptions={{
          padding: 0.45,
          minZoom: 0.2,
        }}
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
    </div>
  );
};

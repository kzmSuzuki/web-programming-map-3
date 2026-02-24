import { MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
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

  const flowNodes: Node[] = nodes.map((node) => {
    const state = deriveState(node, progress, nodeById);
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

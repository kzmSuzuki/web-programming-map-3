import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CircleStar, LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import type { JSX } from 'react';
import { ICON_COLOR_TOKENS } from '../../constants/uiTokens';
import type { NodeLevel, NodeState } from '../../types';

type CustomNodeData = {
  id: string;
  label: string;
  level: NodeLevel;
  state: NodeState;
  crowdCount: number;
  summary?: string;
};

const stateMeta: Record<NodeState, { icon: JSX.Element; label: string }> = {
  initial: { icon: <LockKeyhole size={24} strokeWidth={1.8} color="#E25A5A"/>, label: 'Locked' },
  active: { icon: <LockKeyholeOpen size={24} strokeWidth={1.8} color="#2FA47A"/>, label: 'Active' },
  cleared: { icon: <CircleStar size={24} strokeWidth={1.8} color={ICON_COLOR_TOKENS.cleared} />, label: 'Cleared' },
};

export const CustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className={`node-orb node-${d.state}`}>
        <span className={`node-level level-${d.level}`}>{d.level === 'basic' ? 'Basic' : 'Advanced'}</span>
        <span className="node-id">{d.id}</span>
        <h4 className="node-title">{d.label}</h4>
        <span >
          {stateMeta[d.state].icon}
        </span>
        <small className="node-crowd">{d.crowdCount > 0 ? `${d.crowdCount} reached` : 'No arrivals yet'}</small>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

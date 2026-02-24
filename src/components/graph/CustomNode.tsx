import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Check, LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import type { JSX } from 'react';
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
  cleared: { icon: <Check size={14} strokeWidth={2} />, label: 'Cleared' },
};

export const CustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className={`node-orb node-${d.state}`}>
        <span className={`node-level level-${d.level}`}>{d.level === 'basic' ? 'Basic' : 'Advanced'}</span>
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

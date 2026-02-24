import type { Timestamp } from 'firebase/firestore';

export type NodeLevel = 'basic' | 'advanced';
export type NodeState = 'initial' | 'active' | 'cleared';

export interface SkillNode {
  id: string;
  label: string;
  notionUrl: string;
  predecessorId: string | null;
  level: NodeLevel;
  summary?: string;
}

export interface UserProgress {
  nodeId: string;
  state: NodeState;
  clearedAt: Timestamp | null;
}

export interface AdminConfig {
  emails: string[];
}

export interface StudentLatestArrival {
  email: string;
  nodeId: string;
  clearedAtMs: number;
}

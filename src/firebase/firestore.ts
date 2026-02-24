import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './app';
import type { AdminConfig, NodeState, SkillNode, UserProgress } from '../types';

const toSkillNode = (id: string, data: Record<string, unknown>): SkillNode => ({
  id,
  label: String(data.label ?? ''),
  notionUrl: String(data.notionUrl ?? ''),
  predecessorId: data.predecessorId ? String(data.predecessorId) : null,
  level: data.level === 'advanced' ? 'advanced' : 'basic',
  summary: data.summary ? String(data.summary) : '',
});

const toProgress = (nodeId: string, data: Record<string, unknown>): UserProgress => ({
  nodeId,
  state: (data.state as NodeState) ?? 'initial',
  clearedAt:
    data.clearedAt instanceof Timestamp
      ? data.clearedAt
      : typeof data.clearedAt === 'string' && data.clearedAt
        ? Timestamp.fromDate(new Date(data.clearedAt))
        : null,
});

export const subscribeNodes = (onData: (nodes: SkillNode[]) => void): (() => void) => {
  const nodesRef = collection(db, 'nodes');
  return onSnapshot(nodesRef, (snap) => {
    const nodes = snap.docs.map((docSnap) => toSkillNode(docSnap.id, docSnap.data()));
    nodes.sort((a, b) => a.id.localeCompare(b.id));
    onData(nodes);
  });
};

export const subscribeNodesWithError = (
  onData: (nodes: SkillNode[]) => void,
  onError: (message: string) => void,
): (() => void) => {
  const nodesRef = collection(db, 'nodes');
  return onSnapshot(
    nodesRef,
    (snap) => {
      const nodes = snap.docs.map((docSnap) => toSkillNode(docSnap.id, docSnap.data()));
      nodes.sort((a, b) => a.id.localeCompare(b.id));
      onData(nodes);
    },
    (error) => {
      onError(error.message);
    },
  );
};

export const subscribeUserProgress = (
  email: string,
  onData: (progress: Record<string, UserProgress>) => void,
): (() => void) => {
  const progressRef = collection(db, 'users', email, 'progress');
  return onSnapshot(progressRef, (snap) => {
    const result: Record<string, UserProgress> = {};
    snap.docs.forEach((docSnap) => {
      result[docSnap.id] = toProgress(docSnap.id, docSnap.data());
    });
    onData(result);
  });
};

export const subscribeUserProgressWithError = (
  email: string,
  onData: (progress: Record<string, UserProgress>) => void,
  onError: (message: string) => void,
): (() => void) => {
  const progressRef = collection(db, 'users', email, 'progress');
  return onSnapshot(
    progressRef,
    (snap) => {
      const result: Record<string, UserProgress> = {};
      snap.docs.forEach((docSnap) => {
        result[docSnap.id] = toProgress(docSnap.id, docSnap.data());
      });
      onData(result);
    },
    (error) => {
      onError(error.message);
    },
  );
};

export type ProgressDoc = {
  email: string;
  nodeId: string;
  state: NodeState;
  clearedAt: Timestamp | null;
};

export const subscribeAllProgress = (onData: (progressDocs: ProgressDoc[]) => void): (() => void) => {
  const progressGroup = query(collectionGroup(db, 'progress'));
  return onSnapshot(progressGroup, (snap) => {
    const result: ProgressDoc[] = snap.docs.map((docSnap) => {
      const [_, email, __, nodeId] = docSnap.ref.path.split('/');
      const p = toProgress(nodeId, docSnap.data());
      return {
        email,
        nodeId,
        state: p.state,
        clearedAt: p.clearedAt,
      };
    });
    onData(result);
  });
};

export const getAdminConfig = async (): Promise<AdminConfig> => {
  const configRef = doc(db, 'config', 'admins');
  const snap = await getDoc(configRef);
  if (!snap.exists()) {
    return { emails: [] };
  }
  const data = snap.data() as Partial<AdminConfig>;
  return {
    emails: data.emails ?? [],
  };
};

export const isAdminEmail = async (email: string): Promise<boolean> => {
  const config = await getAdminConfig();
  return config.emails.includes(email);
};

export const createNode = async (node: SkillNode): Promise<void> => {
  await setDoc(doc(db, 'nodes', node.id), node);
};

export const updateNode = async (nodeId: string, updates: Partial<SkillNode>): Promise<void> => {
  await updateDoc(doc(db, 'nodes', nodeId), updates);
};

export const removeNode = async (nodeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'nodes', nodeId));
};

export const listStudents = async (): Promise<string[]> => {
  const snap = await getDocs(collectionGroup(db, 'progress'));
  const emails = new Set<string>();
  snap.docs.forEach((docSnap) => {
    const segments = docSnap.ref.path.split('/');
    if (segments.length >= 4) {
      emails.add(segments[1]);
    }
  });
  return [...emails].sort((a, b) => a.localeCompare(b));
};

export const getStudentProgress = async (email: string): Promise<Record<string, UserProgress>> => {
  const snap = await getDocs(collection(db, 'users', email, 'progress'));
  const result: Record<string, UserProgress> = {};
  snap.docs.forEach((docSnap) => {
    result[docSnap.id] = toProgress(docSnap.id, docSnap.data());
  });
  return result;
};

export const setStudentNodeState = async (email: string, nodeId: string, state: NodeState): Promise<void> => {
  await setDoc(
    doc(db, 'users', email, 'progress', nodeId),
    {
      state,
      clearedAt: state === 'cleared' ? Timestamp.now() : null,
    },
    { merge: true },
  );
};

export const ensureRootActive = async (email: string, rootNodeIds: string[]): Promise<void> => {
  const ops = rootNodeIds.map(async (nodeId) => {
    const ref = doc(db, 'users', email, 'progress', nodeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { state: 'active', clearedAt: null });
    }
  });
  await Promise.all(ops);
};

export const activateSuccessorsIfCleared = async (
  email: string,
  clearedNodeId: string,
  allNodes: SkillNode[],
): Promise<void> => {
  const successors = allNodes.filter((n) => n.predecessorId === clearedNodeId);
  await Promise.all(
    successors.map(async (node) => {
      const ref = doc(db, 'users', email, 'progress', node.id);
      const snap = await getDoc(ref);
      if (!snap.exists() || (snap.data().state as NodeState) === 'initial') {
        await setDoc(ref, { state: 'active', clearedAt: null }, { merge: true });
      }
    }),
  );
};

export const querySuccessors = async (predecessorId: string): Promise<SkillNode[]> => {
  const nodesRef = collection(db, 'nodes');
  const q = query(nodesRef, where('predecessorId', '==', predecessorId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toSkillNode(d.id, d.data()));
};

import type { NodeState, SkillNode, UserProgress } from '../types';

/** 進捗ドキュメントとグラフ構造から、画面上のノード状態（グラフと同じルール）を求める */
export const deriveNodeState = (
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

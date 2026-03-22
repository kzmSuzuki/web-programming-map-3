import { useEffect, useState } from 'react';
import { subscribeAllProgress, type ProgressDoc } from '../../firebase/firestore';
import type { NodeState, SkillNode } from '../../types';

const STATE_LABEL: Record<NodeState, string> = {
  initial: '未',
  active: '進',
  cleared: '済',
};

const STATE_CLASS: Record<NodeState, string> = {
  initial: 'state-badge-initial',
  active: 'state-badge-active',
  cleared: 'state-badge-cleared',
};

export const AllUsersProgressTable = ({ nodes }: { nodes: SkillNode[] }) => {
  const [progressDocs, setProgressDocs] = useState<ProgressDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAllProgress((docs) => {
      setProgressDocs(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <section className="card admin-card">
        <h3>全ユーザー進捗一覧</h3>
        <p className="admin-hint">読み込み中...</p>
      </section>
    );
  }

  const emails = [...new Set(progressDocs.map((d) => d.email))].sort((a, b) =>
    a.localeCompare(b),
  );

  const progressMap = new Map<string, Map<string, NodeState>>();
  progressDocs.forEach((d) => {
    if (!progressMap.has(d.email)) progressMap.set(d.email, new Map());
    progressMap.get(d.email)!.set(d.nodeId, d.state);
  });

  const getState = (email: string, nodeId: string): NodeState =>
    progressMap.get(email)?.get(nodeId) ?? 'initial';

  const handleExportCsv = () => {
    const basicNodes = nodes.filter((n) => n.level === 'basic');
    const advancedNodes = nodes.filter((n) => n.level === 'advanced');
    const header = [
      'ユーザー',
      'Basicクリア数',
      'Advancedクリア数',
      ...basicNodes.map((n) => `[Basic]${n.id}(${n.label})`),
      ...advancedNodes.map((n) => `[Advanced]${n.id}(${n.label})`),
    ].join(',');
    const rows = emails.map((email) => {
      const basicCleared = basicNodes.filter((n) => getState(email, n.id) === 'cleared').length;
      const advancedCleared = advancedNodes.filter((n) => getState(email, n.id) === 'cleared').length;
      const basicCols = basicNodes.map((n) => getState(email, n.id));
      const advancedCols = advancedNodes.map((n) => getState(email, n.id));
      return [email, `${basicCleared}/${basicNodes.length}`, `${advancedCleared}/${advancedNodes.length}`, ...basicCols, ...advancedCols].join(',');
    });
    const bom = '\uFEFF';
    const csv = bom + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (emails.length === 0) {
    return (
      <section className="card admin-card">
        <h3>全ユーザー進捗一覧</h3>
        <p className="admin-hint">進捗データがまだありません。</p>
      </section>
    );
  }

  const basicNodes = nodes.filter((n) => n.level === 'basic');
  const advancedNodes = nodes.filter((n) => n.level === 'advanced');

  const clearedCount = (email: string, targetNodes: SkillNode[]) =>
    targetNodes.filter((n) => getState(email, n.id) === 'cleared').length;

  return (
    <section className="card admin-card">
      <div className="progress-matrix-header">
        <div>
          <h3 style={{ margin: 0 }}>全ユーザー進捗一覧</h3>
          <p className="admin-hint" style={{ margin: '4px 0 0' }}>
            {emails.length} 名 / Basic {basicNodes.length} ノード / Advanced {advancedNodes.length} ノード
          </p>
        </div>
        <div className="progress-matrix-legend">
          <span className="state-badge state-badge-initial">未 = 未開放</span>
          <span className="state-badge state-badge-active">進 = 進行中</span>
          <span className="state-badge state-badge-cleared">済 = クリア</span>
          <button type="button" onClick={handleExportCsv} className="csv-export-btn">
            CSV出力
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="progress-matrix">
          <thead>
            <tr>
              <th className="progress-matrix-email-col" rowSpan={2}>ユーザー</th>
              <th className="progress-matrix-cleared-col" colSpan={2}>クリア数</th>
              {basicNodes.length > 0 && (
                <th
                  className="progress-matrix-level-header progress-matrix-level-basic"
                  colSpan={basicNodes.length}
                >
                  Basic
                </th>
              )}
              {advancedNodes.length > 0 && (
                <th
                  className="progress-matrix-level-header progress-matrix-level-advanced"
                  colSpan={advancedNodes.length}
                >
                  Advanced
                </th>
              )}
            </tr>
            <tr>
              <th className="progress-matrix-cleared-col progress-matrix-level-basic-sub">Basic</th>
              <th className="progress-matrix-cleared-col progress-matrix-level-advanced-sub">Advanced</th>
              {basicNodes.map((node) => (
                <th key={node.id} title={node.label} className="progress-matrix-node-col progress-matrix-level-basic-sub">
                  <div className="progress-matrix-node-header">
                    <span className="progress-matrix-node-id">{node.id}</span>
                    <span className="progress-matrix-node-label">{node.label}</span>
                  </div>
                </th>
              ))}
              {advancedNodes.map((node) => (
                <th key={node.id} title={node.label} className="progress-matrix-node-col progress-matrix-level-advanced-sub">
                  <div className="progress-matrix-node-header">
                    <span className="progress-matrix-node-id">{node.id}</span>
                    <span className="progress-matrix-node-label">{node.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr key={email}>
                <td className="progress-matrix-email">{email}</td>
                <td className="progress-matrix-cleared-count progress-matrix-level-basic-sub">
                  {clearedCount(email, basicNodes)} / {basicNodes.length}
                </td>
                <td className="progress-matrix-cleared-count progress-matrix-level-advanced-sub">
                  {clearedCount(email, advancedNodes)} / {advancedNodes.length}
                </td>
                {basicNodes.map((node) => {
                  const state = getState(email, node.id);
                  return (
                    <td key={node.id} className="progress-matrix-cell">
                      <span className={`state-badge ${STATE_CLASS[state]}`}>
                        {STATE_LABEL[state]}
                      </span>
                    </td>
                  );
                })}
                {advancedNodes.map((node) => {
                  const state = getState(email, node.id);
                  return (
                    <td key={node.id} className="progress-matrix-cell">
                      <span className={`state-badge ${STATE_CLASS[state]}`}>
                        {STATE_LABEL[state]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

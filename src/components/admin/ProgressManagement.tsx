import { useEffect, useState } from 'react';
import { getStudentProgress, listStudents, setStudentNodeState } from '../../firebase/firestore';
import type { NodeState, SkillNode, UserProgress } from '../../types';

const stateOptions: NodeState[] = ['initial', 'active', 'cleared'];

export const ProgressManagement = ({ nodes }: { nodes: SkillNode[] }) => {
  const [students, setStudents] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});

  useEffect(() => {
    const run = async () => {
      const data = await listStudents();
      setStudents(data);
      if (data.length > 0) {
        setSelectedEmail(data[0]);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedEmail) {
        setProgress({});
        return;
      }
      const data = await getStudentProgress(selectedEmail);
      setProgress(data);
    };
    void run();
  }, [selectedEmail]);

  const resolveState = (nodeId: string): NodeState => progress[nodeId]?.state ?? 'initial';

  return (
    <section className="card admin-card">
      <h3>学生進捗管理</h3>
      <div className="admin-form-row">
        <label>
          受講生のメールアドレス
          <input
            type="email"
            placeholder="例: student@example.com"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
          />
        </label>
        {students.length > 0 && (
          <label>
            または一覧から選択
            <select value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
              <option value="">-- 選択 --</option>
              {students.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
              {selectedEmail && !students.includes(selectedEmail) && (
                <option value={selectedEmail}>{selectedEmail}</option>
              )}
            </select>
          </label>
        )}
      </div>

      {!selectedEmail ? (
        <p className="admin-hint">メールアドレスを入力するか、一覧から選択してください。</p>
      ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Node</th>
              <th>現在状態</th>
              <th>変更</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id}>
                <td>{node.id}</td>
                <td>{resolveState(node.id)}</td>
                <td>
                  <select
                    value={resolveState(node.id)}
                    onChange={(e) => {
                      const nextState = e.target.value as NodeState;
                      if (!selectedEmail) {
                        return;
                      }
                      void setStudentNodeState(selectedEmail, node.id, nextState).then(() => {
                        setProgress((prev) => ({
                          ...prev,
                          [node.id]: {
                            nodeId: node.id,
                            state: nextState,
                            clearedAt: nextState === 'cleared' ? (progress[node.id]?.clearedAt ?? null) : null,
                          },
                        }));
                      });
                    }}
                  >
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
};

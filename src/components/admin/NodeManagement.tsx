import { useMemo, useState } from 'react';
import { createNode, removeNode, updateNode } from '../../firebase/firestore';
import type { NodeLevel, SkillNode } from '../../types';

type FormState = {
  id: string;
  label: string;
  notionUrl: string;
  predecessorId: string;
  level: NodeLevel;
  summary: string;
};

const initialForm: FormState = {
  id: '',
  label: '',
  notionUrl: '',
  predecessorId: '',
  level: 'basic',
  summary: '',
};

export const NodeManagement = ({ nodes }: { nodes: SkillNode[] }) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id.localeCompare(b.id)), [nodes]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.id.trim() || !form.label.trim() || !form.notionUrl.trim()) {
      return;
    }

    const payload: SkillNode = {
      id: form.id.trim(),
      label: form.label.trim(),
      notionUrl: form.notionUrl.trim(),
      predecessorId: form.predecessorId.trim() || null,
      level: form.level,
      summary: form.summary.trim(),
    };

    if (editId) {
      await updateNode(editId, payload);
    } else {
      await createNode(payload);
    }

    setForm(initialForm);
    setEditId(null);
  };

  return (
    <section className="card admin-card">
      <h3>ノード管理</h3>
      <form className="admin-form" onSubmit={(e) => void submit(e)}>
        <input
          placeholder="node_id"
          value={form.id}
          disabled={Boolean(editId)}
          onChange={(e) => setForm((v) => ({ ...v, id: e.target.value }))}
        />
        <input placeholder="ラベル" value={form.label} onChange={(e) => setForm((v) => ({ ...v, label: e.target.value }))} />
        <input
          placeholder="Notion URL"
          value={form.notionUrl}
          onChange={(e) => setForm((v) => ({ ...v, notionUrl: e.target.value }))}
        />
        <input
          placeholder="概要文"
          value={form.summary}
          onChange={(e) => setForm((v) => ({ ...v, summary: e.target.value }))}
        />
        <select
          value={form.predecessorId}
          onChange={(e) => setForm((v) => ({ ...v, predecessorId: e.target.value }))}
        >
          <option value="">前提なし（ルート）</option>
          {sortedNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.id}
            </option>
          ))}
        </select>
        <select value={form.level} onChange={(e) => setForm((v) => ({ ...v, level: e.target.value as NodeLevel }))}>
          <option value="basic">Basic</option>
          <option value="advanced">Advanced</option>
        </select>
        <div className="row">
          <button type="submit">{editId ? '更新' : '作成'}</button>
          {editId ? (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm(initialForm);
              }}
            >
              編集キャンセル
            </button>
          ) : null}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Level</th>
              <th>Predecessor</th>
              <th>Summary</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.map((node) => (
              <tr key={node.id}>
                <td>{node.id}</td>
                <td>{node.label}</td>
                <td>{node.level}</td>
                <td>{node.predecessorId ?? '-'}</td>
                <td>{node.summary || '-'}</td>
                <td className="row">
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(node.id);
                      setForm({
                        id: node.id,
                        label: node.label,
                        notionUrl: node.notionUrl,
                        predecessorId: node.predecessorId ?? '',
                        level: node.level,
                        summary: node.summary ?? '',
                      });
                    }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`${node.id} を削除しますか？`)) {
                        void removeNode(node.id);
                      }
                    }}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

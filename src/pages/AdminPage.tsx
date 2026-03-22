import { useState } from 'react';
import { Header } from '../components/common/Header';
import { NodeManagement } from '../components/admin/NodeManagement';
import { ProgressManagement } from '../components/admin/ProgressManagement';
import { AllUsersProgressTable } from '../components/admin/AllUsersProgressTable';
import { useAuth } from '../hooks/useAuth';
import { useNodes } from '../hooks/useNodes';

type Tab = 'nodes' | 'progress' | 'overview';

export const AdminPage = () => {
  const { user } = useAuth();
  const { nodes, loading, error } = useNodes();
  const [tab, setTab] = useState<Tab>('nodes');

  if (loading) {
    return <div className="centered">Loading...</div>;
  }

  if (error) {
    return <div className="centered">ノード読み込みに失敗しました: {error}</div>;
  }

  return (
    <div className="app-shell">
      <Header email={user?.email} />
      <main className="admin-main">
        <div className="row">
          <button type="button" onClick={() => setTab('nodes')} className={tab === 'nodes' ? 'active-tab' : ''}>
            ノード管理
          </button>
          <button type="button" onClick={() => setTab('progress')} className={tab === 'progress' ? 'active-tab' : ''}>
            進捗管理
          </button>
          <button type="button" onClick={() => setTab('overview')} className={tab === 'overview' ? 'active-tab' : ''}>
            全体進捗一覧
          </button>
        </div>

        {tab === 'nodes' && <NodeManagement nodes={nodes} />}
        {tab === 'progress' && <ProgressManagement nodes={nodes} />}
        {tab === 'overview' && <AllUsersProgressTable nodes={nodes} />}
      </main>
    </div>
  );
};

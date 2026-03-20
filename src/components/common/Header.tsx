import { signOutUser } from '../../firebase/auth';

type HeaderProps = {
  email?: string | null;
  /** 読み込み中は null。BASIC ノードのクリア数／総数（グラフと同じ状態判定） */
  basicProgress?: { cleared: number; total: number } | null;
};

export const Header = ({ email, basicProgress }: HeaderProps) => {
  return (
    <header className="app-header">
      <div className="header-title">
        <h1>Web Programming Skill Map</h1>
        <span>Chapter 1 : Frontend</span>
        {basicProgress !== null && basicProgress !== undefined ? (
          <span
            className="header-basic-progress"
            title="BASIC のクリア数 / BASIC ノード数"
            aria-label={`BASIC クリア ${basicProgress.cleared}、全 ${basicProgress.total} ノード`}
          >
            <span className="header-basic-label">BASIC</span>
            <span className="header-basic-count" aria-hidden>
              {basicProgress.cleared}／{basicProgress.total}
            </span>
          </span>
        ) : null}
      </div>
      <div className="header-actions">
        <span>{email}</span>
        <button type="button" onClick={signOutUser}>
          Logout
        </button>
      </div>
    </header>
  );
};

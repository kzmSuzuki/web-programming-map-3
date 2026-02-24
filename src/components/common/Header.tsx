import { signOutUser } from '../../firebase/auth';

type HeaderProps = {
  email?: string | null;
};

export const Header = ({ email }: HeaderProps) => {
  return (
    <header className="app-header">
      <h1>Web Programming Skill Map</h1>
      <div className="header-actions">
        <span>{email}</span>
        <button type="button" onClick={signOutUser}>
          ログアウト
        </button>
      </div>
    </header>
  );
};

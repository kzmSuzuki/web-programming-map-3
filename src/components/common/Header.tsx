import { signOutUser } from '../../firebase/auth';

type HeaderProps = {
  email?: string | null;
};

export const Header = ({ email }: HeaderProps) => {
  return (
    <header className="app-header">
      <div className="header-title">
        <h1>Web Programming Skill Map</h1>
        <span>Chapter 1 : Frontend</span>
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

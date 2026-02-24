import { signInWithGoogle } from '../../firebase/auth';

export const LoginCard = () => {
  return (
    <main className="centered login-bg">
      <section className="card login-card">
        <h2>ログイン</h2>
        <p>Googleアカウントでログインしてください。</p>
        <button type="button" onClick={() => void signInWithGoogle()}>
          Googleでログイン
        </button>
      </section>
    </main>
  );
};

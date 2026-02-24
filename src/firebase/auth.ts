import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './app';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<void> => {
  await signInWithPopup(auth, provider);
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

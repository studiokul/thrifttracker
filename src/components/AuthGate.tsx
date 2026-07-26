'use client';

import { useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import app, { db } from '@/lib/firebase';

const AUTH_REQUIRED =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_REQUIRED === 'true';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<
    'loading' | 'signed-out' | 'allowed' | 'denied' | 'error'
  >(AUTH_REQUIRED ? 'loading' : 'allowed');
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!AUTH_REQUIRED || !app || !db) return;
    const auth = getAuth(app);
    const firestore = db;
    void setPersistence(auth, browserLocalPersistence);
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setState('signed-out');
        return;
      }
      try {
        const membership = await getDoc(
          doc(firestore, 'members', nextUser.uid)
        );
        setState(membership.exists() ? 'allowed' : 'denied');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Access check failed');
        setState('error');
      }
    });
  }, []);

  if (!AUTH_REQUIRED || state === 'allowed') return children;

  const handleSignIn = async () => {
    if (!app) return;
    setState('loading');
    setMessage('');
    try {
      await signInWithPopup(getAuth(app), new GoogleAuthProvider());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed');
      setState('signed-out');
    }
  };

  const handleSignOut = async () => {
    if (!app) return;
    await signOut(getAuth(app));
  };

  return (
    <main className="auth-gate">
      <div className="auth-card">
        <p className="eyebrow">THRIFT TRACKER</p>
        <h1>{state === 'loading' ? 'Checking access…' : 'Private tracker'}</h1>
        {state === 'signed-out' && (
          <>
            <p>Sign in with an approved Google account to continue.</p>
            <button type="button" onClick={handleSignIn}>
              Sign in with Google
            </button>
          </>
        )}
        {state === 'denied' && (
          <>
            <p>
              {user?.email || 'This account'} is signed in but is not on the
              member list.
            </p>
            <button type="button" onClick={handleSignOut}>
              Use another account
            </button>
          </>
        )}
        {state === 'error' && (
          <>
            <p>{message || 'The membership check failed.'}</p>
            <button type="button" onClick={handleSignOut}>
              Try another account
            </button>
          </>
        )}
      </div>
    </main>
  );
}

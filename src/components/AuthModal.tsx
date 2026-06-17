'use client';

import { Globe, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import { getBrowserClient } from '@/lib/supabase-browser';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AuthFormFields({
  mode,
  email,
  password,
  name,
  setEmail,
  setPassword,
  setName,
}: {
  mode: 'login' | 'register';
  email: string;
  password: string;
  name: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setName: (v: string) => void;
}) {
  return (
    <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {mode === 'register' && (
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
    </div>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'discord' | 'github') => {
    setIsLoading(true);
    const { error } = await getBrowserClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const { error } = await getBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
    }
    setIsLoading(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaLabel="Authentication">
      <div className={styles.header}>
        <h2>🚀 Welcome to GameDeals</h2>
        <p>Sign in to track price drops and sync your wishlist across all devices.</p>
      </div>
      <div className={styles.socialButtons}>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.google}`}
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
        >
          <Globe size={20} />
          <span>Continue with Google</span>
        </button>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.discord}`}
          onClick={() => handleSocialLogin('discord')}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-label="GitHub">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Continue with Discord</span>
        </button>
      </div>
      <div className={styles.divider}>
        <span>or use magic link</span>
      </div>
      <form className={styles.form} onSubmit={handleMagicLink}>
        <AuthFormFields
          mode="login"
          email={email}
          password={password}
          name={name}
          setEmail={setEmail}
          setPassword={setPassword}
          setName={setName}
        />
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
        )}
        <button type="submit" className={styles.loginButton} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
      <div className={styles.demoNote}>
        <ShieldCheck size={14} style={{ marginBottom: 4, color: 'hsl(var(--primary))' }} />
        <strong>Privacy Priority:</strong> We only store your wishlist and alert data. No passwords
        required.
      </div>
    </BaseModal>
  );
}

'use client';

import { GithubIcon, Globe, ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
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

  const handleMagicLink = async (e: FormEvent<HTMLFormElement>) => {
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
          <GithubIcon size={20} />
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

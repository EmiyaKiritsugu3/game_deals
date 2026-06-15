'use client';

import { Github, Globe, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'discord' | 'github') => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
          <Github size={20} />
          <span>Continue with Discord</span>
        </button>
      </div>

      <div className={styles.divider}>
        <span>or use magic link</span>
      </div>

      <form className={styles.form} onSubmit={handleMagicLink}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Mail
              size={16}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                color: 'hsl(var(--muted-foreground))',
              }}
            />
          </div>
        </div>

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

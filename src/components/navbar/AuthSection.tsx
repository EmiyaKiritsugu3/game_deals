'use client';
import { User } from 'lucide-react';
import styles from '../Navbar.module.css';

export function AuthSection({ onLoginClickAction }: Readonly<{ onLoginClickAction: () => void }>) {
  return (
    <button type="button" className={styles.loginBtn} onClick={onLoginClickAction}>
      <User size={18} />
      <span>Login</span>
    </button>
  );
}

import Link from 'next/link';
import styles from '../error/page.module.css';

export default function AuthCodeErrorPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Invalid Sign-in Link</h1>
        <p className={styles.message}>
          The sign-in link is invalid or has expired. Please try signing in again.
        </p>
        <Link href="/" className={styles.homeLink}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}

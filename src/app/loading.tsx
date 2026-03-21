import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className="container">
        <div className={styles.loader}>
          <div className={styles.spinner} />
          <p>Scanning for discounts...</p>
        </div>
      </div>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { Deal, getHighResImage } from '@/services/api';
import styles from './Freebies.module.css';

interface FreebiesProps {
    deals: Deal[];
}

export default function Freebies({ deals }: FreebiesProps) {
    if (!deals || deals.length === 0) return null;

    return (
        <section className={styles.freebiesSection}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h2>🎁 JOGOS GRÁTIS! (100% OFF)</h2>
                    <span className={styles.pulseBadge}>Resgate Agora</span>
                </div>
            </div>

            <div className={styles.carousel}>
                {deals.slice(0, 6).map((deal) => {
                    return (
                        <Link href={`/game/${deal.gameID}`} key={deal.dealID} className={styles.freebieCard}>
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={getHighResImage(deal.thumb)}
                                    alt={deal.title}
                                    fill
                                    className={styles.image}
                                    sizes="220px"
                                />
                                <div className={styles.freeBadge}>GRÁTIS</div>
                            </div>

                            <div className={styles.cardInfo}>
                                <h3 className={styles.title}>{deal.title}</h3>
                                <div className={styles.voucherContainer}>
                                    <div className={styles.voucher}>
                                        <div className={styles.voucherLeft}>CUPOM</div>
                                        <div className={styles.voucherSeparator}></div>
                                        <div className={styles.voucherRight}>-100%</div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    );
}

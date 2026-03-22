import Image from 'next/image';
import Link from 'next/link';
import { Deal, getHighResImage } from '@/services/api';

interface FreebiesProps {
    deals: Deal[];
}

export default function Freebies({ deals }: FreebiesProps) {
    if (!deals || deals.length === 0) return null;

    return (
        <section className="mb-12 rounded-xl bg-gradient-to-r from-[#1c1212] via-[#2a1616] to-[#1c1212] p-6 shadow-[inset_0_0_0_1px_rgba(255,100,100,0.1),0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-[#ff4d4d] drop-shadow-[0_0_10px_rgba(255,77,77,0.5)] md:text-2xl">🎁 JOGOS GRÁTIS! (100% OFF)</h2>
                    <span className="hidden animate-pulse rounded-full bg-[#ff4d4d] px-3 py-1 text-xs font-bold uppercase tracking-widest text-black sm:inline-block">Resgate Agora</span>
                </div>
            </div>

            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 scrollbar-hide md:grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:overflow-visible md:pb-0">
                {deals.slice(0, 6).map((deal) => {
                    return (
                        <Link href={`/game/${deal.gameID}`} key={deal.dealID} className="group relative flex w-[220px] shrink-0 snap-center flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-all hover:-translate-y-2 hover:border-[#ff4d4d]/50 hover:shadow-[0_15px_30px_-5px_rgba(255,77,77,0.3)] md:w-auto">
                            <div className="relative aspect-[460/215] w-full overflow-hidden bg-black/60">
                                <Image
                                    src={getHighResImage(deal.thumb)}
                                    alt={deal.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="220px"
                                />
                                <div className="absolute right-0 top-0 rounded-bl-lg bg-[#ff4d4d] px-3 py-1 text-sm font-black tracking-widest text-white shadow-md">GRÁTIS</div>
                            </div>

                            <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                                <h3 className="line-clamp-2 text-sm font-bold text-white transition-colors group-hover:text-[#ff4d4d]" title={deal.title}>{deal.title}</h3>
                                <div>
                                    <div className="flex h-8 items-center justify-center overflow-hidden rounded bg-[#2a1616] shadow-inner">
                                        <div className="flex h-full flex-1 items-center justify-center bg-[#ff4d4d]/10 text-[10px] font-bold text-[#ff4d4d]">CUPOM</div>
                                        <div className="relative h-full w-[2px] bg-black before:absolute before:-left-1 before:-top-1 before:h-2 before:w-2 before:rounded-full before:bg-black after:absolute after:-bottom-1 after:-left-1 after:h-2 after:w-2 after:rounded-full after:bg-black"></div>
                                        <div className="flex h-full flex-1 items-center justify-center bg-[#ff4d4d]/20 text-xs font-black text-[#ff4d4d]">-100%</div>
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

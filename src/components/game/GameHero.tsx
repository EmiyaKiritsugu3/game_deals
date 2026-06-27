import Image from 'next/image';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';

interface GameHeroProps {
  readonly gameId: string;
  readonly gameTitle: string;
  readonly thumb: string;
  readonly bestCurrentPrice: number;
  readonly priority?: boolean;
  readonly size?: 'full' | 'compact';
}

export default function GameHero({
  gameId,
  gameTitle,
  thumb,
  bestCurrentPrice,
  priority = false,
  size = 'full',
}: GameHeroProps) {
  const sizeClass = size === 'compact' ? 'h-[250px]' : 'h-[350px]';

  return (
    <div className={`relative w-full overflow-hidden rounded-lg ${sizeClass}`}>
      <Image
        src={thumb}
        alt={gameTitle}
        fill
        className="object-cover z-[1]"
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-[2]" />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-[3] flex items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground [text-shadow:0_2px_10px_rgba(0,0,0,0.8)] m-0 max-w-[85%]">
          {gameTitle}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          <PriceAlertTrigger
            gameID={gameId}
            gameTitle={gameTitle}
            currentPrice={bestCurrentPrice}
          />
          <HeartButton gameID={gameId} />
        </div>
      </div>
    </div>
  );
}

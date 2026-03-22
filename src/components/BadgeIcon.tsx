import { cn } from '@/lib/utils';

interface BadgeIconProps {
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  size?: number;
  name: string;
  className?: string;
}

const rarityVariants = {
  Common: "border-gray-500/30 text-gray-400 bg-white/5",
  Rare: "border-blue-400/50 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)] bg-blue-500/10",
  Epic: "border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.3)] bg-purple-500/10",
  Legendary: "border-yellow-400/50 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] bg-yellow-500/10",
};

/**
 * Display a premium achievement badge with rarity-based styling.
 */
export default function BadgeIcon({ rarity, size = 48, name, className }: BadgeIconProps) {
  return (
    <div 
        className={cn(
            "group relative flex flex-col items-center justify-center rounded-xl border p-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
            rarityVariants[rarity],
            className
        )}
        style={{ width: size, height: size }}
        title={`${name} (${rarity})`}
    >
      <div className="flex h-3/5 w-3/5 items-center justify-center">
        {/* Placeholder SVG icon based on rarity or type */}
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full drop-shadow-md">
            {rarity === 'Legendary' ? (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            ) : (
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            )}
        </svg>
      </div>
      <div className="absolute -bottom-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-xs font-semibold whitespace-nowrap">
          {name}
      </div>
    </div>
  );
}

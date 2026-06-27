import { ArrowRight } from 'lucide-react';

export interface AlertFormFieldsProps {
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly isKeyshopAllowed: boolean;
  readonly onTargetPriceChange: (price: number) => void;
  readonly onKeyshopAllowedChange: (allowed: boolean) => void;
}

export default function AlertFormFields({
  currentPrice,
  targetPrice,
  isKeyshopAllowed,
  onTargetPriceChange,
  onKeyshopAllowedChange,
}: AlertFormFieldsProps) {
  return (
    <>
      <div className="bg-muted/50 py-6 px-5 rounded-xl flex items-center justify-around mb-8 border border-border/50">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Current</span>
          <span className="text-xl font-extrabold">${currentPrice.toFixed(2)}</span>
        </div>
        <ArrowRight size={20} className="text-muted-foreground/50" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Target</span>
          <span className="text-xl font-extrabold" style={{ color: 'hsl(var(--primary))' }}>
            ${targetPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3" htmlFor="price-range">
          Alert me when price is below:
        </label>
        <input
          id="price-range"
          type="range"
          min={0}
          max={currentPrice * 1.2}
          step={0.01}
          value={targetPrice}
          onChange={(e) => onTargetPriceChange(Number.parseFloat(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-sm appearance-none outline-none mb-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_40%,transparent)] [&::-webkit-slider-thumb]:active:scale-110"
        />
        <div className="flex items-center bg-background border border-border rounded-lg px-4 py-2">
          <span className="text-muted-foreground font-semibold mr-2">$</span>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => onTargetPriceChange(Number.parseFloat(e.target.value))}
            className="bg-transparent border-none text-foreground text-2xl font-extrabold w-full outline-none"
            step={0.01}
            data-testid="target-price-input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="sr-only"
            checked={isKeyshopAllowed}
            onChange={() => onKeyshopAllowedChange(!isKeyshopAllowed)}
          />
          <div
            className={`w-[18px] h-[18px] rounded border-2 border-border flex items-center justify-center transition-all ${isKeyshopAllowed ? 'bg-primary border-primary' : ''}`}
          >
            {isKeyshopAllowed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Checked"
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
            )}
          </div>
          <div>
            <span className="text-sm font-medium">Include Keyshops (Market Gray)</span>
            <span className="block text-xs text-muted-foreground">
              May result in lower prices but higher risk.
            </span>
          </div>
        </label>
      </div>
    </>
  );
}

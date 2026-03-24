'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface PriceDataPoint {
    date: number; // Unix timestamp or equivalent
    price: number;
}

interface ChartsProps {
    data: PriceDataPoint[];
}

// Custom Tooltip strictly adhering to our Glassmorphism formula
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Safely parse the date assuming it might be a timestamp
        const dateStr = new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        return (
            <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] outline-none">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{dateStr}</p>
                <p className="text-3xl font-black text-primary drop-shadow-[0_0_12px_var(--color-primary)]">
                    ${payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Charts({ data }: ChartsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                    No historical data available
                </span>
            </div>
        );
    }

    return (
        <div className="h-full w-full min-h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        {/* The OLED Pure Holographic Fade */}
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <XAxis
                        dataKey="date"
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short' })}
                        stroke="var(--color-border)"
                        tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />

                    <YAxis
                        stroke="var(--color-border)"
                        tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />

                    <Tooltip
                        content={CustomTooltip}
                        cursor={{ stroke: 'var(--color-border)', strokeWidth: 2, strokeDasharray: '4 4' }}
                    />

                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-primary)"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--color-background)', strokeWidth: 3, style: { filter: 'drop-shadow(0px 0px 8px var(--color-primary))' } }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

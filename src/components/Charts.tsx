"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StorePrice {
    storeName: string;
    price: string;
}

export function StoreCompareChart({ data }: { data: StorePrice[] }) {
    // Convert string prices to numbers for charting
    const chartData = data.map(d => ({
        name: d.storeName,
        price: parseFloat(d.price)
    }));

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-card/50 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">Current Prices by Store</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))'
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => {
                                const numValue = Number(value);
                                return [`$${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`, 'Price'];
                            }}
                        />
                        <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

import { generatePriceHistory } from '@/utils/pricing';
import { PriceHistoryPoint } from '@/types/game';
import { LineChart, Line } from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PriceHistoryChart({ currentPrice, lowestPrice, lowestDate: _lowestDate, retailPrice = '9.99', gameTitle = 'Default' }: { currentPrice: string, lowestPrice: string, lowestDate: number, retailPrice?: string, gameTitle?: string }) {
    const historyData: PriceHistoryPoint[] = generatePriceHistory(parseFloat(retailPrice), parseFloat(currentPrice), parseFloat(lowestPrice), gameTitle);

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-card/50 p-6 shadow-lg backdrop-blur-sm">
            <div>
                <h3 className="text-lg font-bold text-white">Current Price History (6 Months)</h3>
                <p className="text-sm font-medium text-muted-foreground">Algorithmic market simulation based on official data drops.</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))'
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => {
                                const numValue = Number(value);
                                return [`$${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`, 'Price'];
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--card))', stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import { Lightbulb } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { RidePlatform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

export default function MonthlyReportPage() {
    const { incomes, loading } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');
    
    // AI feature would be here. Simulating a response for now.
    const aiInsight = "Your income for June was unusually high compared to May. Keep up the great work!";

    if (loading) {
        return <ReportSkeleton />;
    }
    
    const filteredIncomes = incomes.filter(income => {
        return platform === 'all' || income.platform === platform;
    });

    const now = new Date();
    const monthlyData = Array.from({ length: 12 }).map((_, i) => {
        const monthOffset = 11 - i;
        const endMonthDate = subMonths(now, monthOffset);
        
        const periodEnd = setDate(addMonths(endMonthDate, 1), 20);
        const periodStart = setDate(endMonthDate, 21);

        const monthIncomes = filteredIncomes.filter(inc => {
            const incomeDate = new Date(inc.date);
            return incomeDate >= periodStart && incomeDate <= periodEnd;
        });

        const total = monthIncomes.reduce((sum, i) => sum + calculateNet(i.amount, i), 0);
        return {
            name: format(periodStart, 'MMM yy'),
            total: total
        };
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Monthly Report</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Last 12 Months Net Income</CardTitle>
                    <CardDescription>Your net income trends over the past year (21st to 20th of each month).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-start">
                         <Select value={platform} onValueChange={(value) => setPlatform(value as RidePlatform | 'all')}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Platforms</SelectItem>
                                <SelectItem value="uber">Uber</SelectItem>
                                <SelectItem value="careem">Careem</SelectItem>
                                <SelectItem value="bolt">Bolt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ChartContainer config={{ total: { label: "Net Income", color: "hsl(var(--primary))" } }} className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    <Alert>
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold">AI Analysis</AlertTitle>
                        <AlertDescription>
                            {aiInsight}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}

function ReportSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
            <Skeleton className="h-8 w-48" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                   <Skeleton className="h-10 w-48" />
                   <Skeleton className="h-[400px] w-full" />
                   <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

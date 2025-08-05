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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const defaultPlatforms: RidePlatform[] = ['bolt', 'uber', 'careem', 'dtc_mobility'];

export default function MonthlyReportPage() {
    const { incomes, loading, settings } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');
    
    // AI feature would be here. Simulating a response for now.
    const aiInsight = "Your income for June was unusually high compared to May. Keep up the great work!";

    if (loading) {
        return <ReportSkeleton />;
    }

    const allPlatforms = [...defaultPlatforms, ...settings.customPlatforms];
    
    const filteredIncomes = incomes.filter(income => {
        return platform === 'all' || income.platform === platform;
    });

    const now = new Date();
    const monthlyData = Array.from({ length: 12 }).map((_, i) => {
        const monthOffset = 11 - i;
        const baseMonth = subMonths(now, monthOffset);
        
        const periodStart = setDate(baseMonth, 21);
        const periodEnd = setDate(addMonths(baseMonth, 1), 20);

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

    const firstPeriodStart = setDate(subMonths(now, 11), 21);
    const lastPeriodEnd = setDate(addMonths(now, 1), 20);

    const summaryIncomes = filteredIncomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= firstPeriodStart && incomeDate <= lastPeriodEnd;
    });

    const summary = summaryIncomes.reduce((acc, income) => {
        acc.gross += income.amount;
        acc.salikFee += income.salikFee || 0;
        acc.airportFee += income.airportFee || 0;
        acc.bookingFee += income.bookingFee || 0;
        acc.commission += income.commission || 0;
        acc.fuelCost += income.fuelCost || 0;
        acc.net += calculateNet(income.amount, income);
        return acc;
    }, { gross: 0, net: 0, salikFee: 0, airportFee: 0, bookingFee: 0, commission: 0, fuelCost: 0, rides: summaryIncomes.length });


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
                                {defaultPlatforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p.replace(/_/g, ' ')}</SelectItem>)}
                                {settings.customPlatforms.length > 0 && <Separator />}
                                {settings.customPlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <ChartContainer config={{ total: { label: "Net Income", color: "hsl(var(--primary))" } }} className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AED ${value}`} />
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

             <Card>
                <CardHeader>
                    <CardTitle>Monthly Summary</CardTitle>
                    <CardDescription>
                        Summary for the last 12 months
                        {platform !== 'all' && ` on ${platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                           <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Total Rides</TableCell>
                                <TableCell className="text-right">{summary.rides}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Gross Income</TableCell>
                                <TableCell className="text-right text-green-600">AED {summary.gross.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Salik Fee</TableCell>
                                <TableCell className="text-right text-red-600">-AED {summary.salikFee.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Airport Fee</TableCell>
                                <TableCell className="text-right text-red-600">-AED {summary.airportFee.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Booking Fee</TableCell>
                                <TableCell className="text-right text-red-600">-AED {summary.bookingFee.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Commission</TableCell>
                                <TableCell className="text-right text-red-600">-AED {summary.commission.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Fuel Cost</TableCell>
                                <TableCell className="text-right text-red-600">-AED {summary.fuelCost.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow className="font-bold bg-muted hover:bg-muted">
                                <TableCell>Net Income</TableCell>
                                <TableCell className="text-right">AED {summary.net.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
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

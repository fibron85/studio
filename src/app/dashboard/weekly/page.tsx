'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format, endOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RidePlatform } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const defaultPlatforms: RidePlatform[] = ['uber', 'careem', 'bolt', 'dtc_mobility'];

export default function WeeklyReportPage() {
    const { incomes, loading, settings } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');

    if (loading) {
        return <ReportSkeleton />;
    }

    const allPlatforms = [...defaultPlatforms, ...settings.customPlatforms];

    const filteredIncomes = incomes.filter(income => {
        return platform === 'all' || income.platform === platform;
    });

    const last12Weeks = eachWeekOfInterval({
        start: subWeeks(new Date(), 11),
        end: new Date(),
    }, { weekStartsOn: 1 });

    const weeklyData = last12Weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekIncomes = filteredIncomes.filter(i => {
            const incomeDate = new Date(i.date);
            return incomeDate >= weekStart && incomeDate <= weekEnd;
        });
        const total = weekIncomes.reduce((sum, i) => sum + calculateNet(i.amount, i), 0);
        return {
            name: `${format(weekStart, 'MMM d')}`,
            total: total
        };
    });

    const summaryIncomes = filteredIncomes.filter(income => {
        const incomeDate = new Date(income.date);
        const twelveWeeksAgo = subWeeks(new Date(), 12);
        return incomeDate >= twelveWeeksAgo;
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
            <h2 className="text-3xl font-bold tracking-tight">Weekly Report</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Last 12 Weeks Net Income</CardTitle>
                    <CardDescription>Your net income totals for the past 12 weeks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <BarChart data={weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AED ${value}`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Summary</CardTitle>
                    <CardDescription>
                        Summary for the last 12 weeks
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
                <CardContent className="space-y-4 pt-6">
                   <Skeleton className="h-10 w-48" />
                   <Skeleton className="h-[400px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

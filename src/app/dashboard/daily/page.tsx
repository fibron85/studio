'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay } from 'date-fns';
import { groupBy } from '@/lib/utils';
import type { Income, RidePlatform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const calculateTotalCosts = ({ salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return salikFee + airportFee + commission + bookingFee + fuelCost;
}


export default function DailyReportPage() {
    const { incomes, loading } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');

    if (loading) {
        return <ReportSkeleton />;
    }

    const filteredIncomes = incomes.filter(income => {
        return platform === 'all' || income.platform === platform;
    });
    
    const groupedByDay = groupBy(filteredIncomes, (income: Income) => format(startOfDay(new Date(income.date)), 'yyyy-MM-dd'));

    const dailySummaries = Object.entries(groupedByDay).map(([date, dailyIncomes]) => {
        const gross = dailyIncomes.reduce((sum, i) => sum + i.amount, 0);
        const costs = dailyIncomes.reduce((sum, i) => sum + calculateTotalCosts(i), 0);
        const net = dailyIncomes.reduce((sum, i) => sum + calculateNet(i.amount, i), 0);
        return {
            date,
            gross,
            costs,
            net,
            count: dailyIncomes.length,
        }
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Daily Report</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Daily Summary</CardTitle>
                    <CardDescription>A summary of your income, day by day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Rides</TableHead>
                                <TableHead className="text-right">Gross</TableHead>
                                <TableHead className="text-right">Costs</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailySummaries.length > 0 ? dailySummaries.map(summary => (
                                <TableRow key={summary.date}>
                                    <TableCell className="font-medium">{format(new Date(summary.date), 'PPP')}</TableCell>
                                    <TableCell>{summary.count}</TableCell>
                                    <TableCell className="text-right text-green-600">${summary.gross.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-${summary.costs.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold">${summary.net.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No income data available.</TableCell>
                                </TableRow>
                            )}
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
                <CardContent>
                   <Skeleton className="h-10 w-48 mb-4" />
                   <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

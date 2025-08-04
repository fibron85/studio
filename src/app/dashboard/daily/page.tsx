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
        const summary = dailyIncomes.reduce((acc, income) => {
            acc.gross += income.amount;
            acc.salikFee += income.salikFee || 0;
            acc.airportFee += income.airportFee || 0;
            acc.bookingFee += income.bookingFee || 0;
            acc.commission += income.commission || 0;
            acc.fuelCost += income.fuelCost || 0;
            acc.net += calculateNet(income.amount, income);
            return acc;
        }, { gross: 0, net: 0, salikFee: 0, airportFee: 0, bookingFee: 0, commission: 0, fuelCost: 0 });

        return {
            date,
            ...summary,
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
                                <TableHead className="text-right">Salik</TableHead>
                                <TableHead className="text-right">Airport</TableHead>
                                <TableHead className="text-right">Booking</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                                <TableHead className="text-right">Fuel</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailySummaries.length > 0 ? dailySummaries.map(summary => (
                                <TableRow key={summary.date}>
                                    <TableCell className="font-medium">{format(new Date(summary.date), 'PPP')}</TableCell>
                                    <TableCell>{summary.count}</TableCell>
                                    <TableCell className="text-right text-green-600">AED {summary.gross.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.salikFee.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.airportFee.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.bookingFee.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.commission.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.fuelCost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold">AED {summary.net.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">No income data available.</TableCell>
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

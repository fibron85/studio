'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { RidePlatform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const defaultPlatforms: RidePlatform[] = ['uber', 'careem', 'bolt'];

export default function DailyReportPage() {
    const { incomes, loading, settings } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');

    if (loading) {
        return <ReportSkeleton />;
    }

    const allPlatforms = [...defaultPlatforms, ...settings.customPlatforms];

    const filteredIncomes = incomes
        .filter(income => platform === 'all' || income.platform === platform)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Daily Rides Log</h2>
            <Card>
                <CardHeader>
                    <CardTitle>All Rides</CardTitle>
                    <CardDescription>A detailed log of all your recorded rides.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-start">
                        <Select value={platform} onValueChange={(value) => setPlatform(value as RidePlatform | 'all')}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Platforms</SelectItem>
                                {defaultPlatforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                {settings.customPlatforms.length > 0 && <Separator />}
                                {settings.customPlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Gross</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="text-right">Distance</TableHead>
                                <TableHead className="text-right">Salik</TableHead>
                                <TableHead className="text-right">Airport</TableHead>
                                <TableHead className="text-right">Booking</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                                <TableHead className="text-right">Fuel</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIncomes.length > 0 ? filteredIncomes.map(income => (
                                <TableRow key={income.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(income.date), 'PPP')}</TableCell>
                                    <TableCell className="capitalize">{income.platform}</TableCell>
                                    <TableCell className="capitalize">{income.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                                    <TableCell className="text-right text-green-600">AED {income.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold">AED {calculateNet(income.amount, income).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{income.distance ? `${income.distance.toFixed(1)} km` : '-'}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {(income.salikFee || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {(income.airportFee || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {(income.bookingFee || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {(income.commission || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {(income.fuelCost || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center h-24">No income data available.</TableCell>
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

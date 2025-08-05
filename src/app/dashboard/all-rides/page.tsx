'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format } from 'date-fns';
import type { RidePlatform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const defaultPlatforms: RidePlatform[] = ['bolt', 'uber', 'careem', 'dtc'];
const RIDES_PER_PAGE = 50;

export default function AllRidesPage() {
    const { incomes, loading, settings, markAsPaidToCashier } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    if (loading) {
        return <ReportSkeleton />;
    }

    const filteredIncomes = incomes
        .filter(income => platform === 'all' || income.platform === platform)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const summary = filteredIncomes.reduce((acc, income) => {
        acc.gross += income.amount;
        acc.salikFee += income.salikFee || 0;
        acc.airportFee += income.airportFee || 0;
        acc.bookingFee += income.bookingFee || 0;
        acc.commission += income.commission || 0;
        acc.fuelCost += income.fuelCost || 0;
        acc.net += calculateNet(income.amount, income);
        acc.distance += income.distance || 0;
        return acc;
    }, { gross: 0, net: 0, salikFee: 0, airportFee: 0, bookingFee: 0, commission: 0, fuelCost: 0, distance: 0 });

    const totalPages = Math.ceil(filteredIncomes.length / RIDES_PER_PAGE);
    const paginatedIncomes = filteredIncomes.slice((currentPage - 1) * RIDES_PER_PAGE, currentPage * RIDES_PER_PAGE);
    
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">All Rides Log</h2>
            <Card>
                <CardHeader>
                    <CardTitle>All Rides</CardTitle>
                    <CardDescription>A detailed log of all your recorded rides.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-start">
                        <Select value={platform} onValueChange={(value) => { setPlatform(value as RidePlatform | 'all'); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Platforms</SelectItem>
                                {defaultPlatforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p.toUpperCase()}</SelectItem>)}
                                {settings.customPlatforms.length > 0 && <Separator />}
                                {settings.customPlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="overflow-x-auto">
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
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedIncomes.length > 0 ? paginatedIncomes.map(income => (
                                    <TableRow key={income.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{format(new Date(income.date), 'PPP')}</TableCell>
                                        <TableCell className="capitalize">{income.platform.toUpperCase()}</TableCell>
                                        <TableCell className="capitalize">{income.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                                        <TableCell className="text-right text-green-600">AED {income.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold">AED {calculateNet(income.amount, income).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{income.distance ? `${income.distance.toFixed(1)} km` : '-'}</TableCell>
                                        <TableCell className="text-right text-red-600">-AED {(income.salikFee || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-red-600">-AED {(income.airportFee || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-red-600">-AED {(income.bookingFee || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-red-600">-AED {(income.commission || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-red-600">-AED {(income.fuelCost || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            {(income.paymentMethod === 'cash' || income.paymentMethod === 'credit_card') && (
                                                <Button
                                                    size="sm"
                                                    variant={income.paidToCashier ? 'secondary' : 'default'}
                                                    onClick={() => !income.paidToCashier && markAsPaidToCashier(income.id)}
                                                    disabled={income.paidToCashier}
                                                >
                                                    {income.paidToCashier ? 'Paid' : 'Pay to Cashier'}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center h-24">No income data available.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                             <TableFooter>
                                <TableRow className="font-bold bg-muted hover:bg-muted">
                                    <TableCell colSpan={3}>Total ({filteredIncomes.length} rides)</TableCell>
                                    <TableCell className="text-right text-green-600">AED {summary.gross.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">AED {summary.net.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{summary.distance.toFixed(1)} km</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.salikFee.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.airportFee.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.bookingFee.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.commission.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-red-600">-AED {summary.fuelCost.toFixed(2)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                     {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
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
                   <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

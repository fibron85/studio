'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Income, RidePlatform } from '@/lib/types';
import * as XLSX from 'xlsx';
import { Separator } from '@/components/ui/separator';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const defaultPlatforms: RidePlatform[] = ['bolt', 'uber', 'careem', 'dtc'];

export default function CustomReportPage() {
    const { incomes, loading, settings } = useAppContext();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');

    if (loading) {
        return <ReportSkeleton />;
    }

    const allPlatforms = [...defaultPlatforms, ...settings.customPlatforms];

    const filteredIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        const inDateRange = dateRange?.from && dateRange?.to && incomeDate >= dateRange.from && incomeDate <= addDays(dateRange.to, 1); // addDays to include the 'to' date
        const isPlatformMatch = platform === 'all' || income.platform === platform;
        return inDateRange && isPlatformMatch;
    });

    const summary = filteredIncomes.reduce((acc, income) => {
        acc.gross += income.amount;
        acc.salikFee += income.salikFee || 0;
        acc.airportFee += income.airportFee || 0;
        acc.bookingFee += income.bookingFee || 0;
        acc.commission += income.commission || 0;
        acc.fuelCost += income.fuelCost || 0;
        acc.net += calculateNet(income.amount, income);
        return acc;
    }, { gross: 0, net: 0, salikFee: 0, airportFee: 0, bookingFee: 0, commission: 0, fuelCost: 0, rides: filteredIncomes.length });

    const handleExport = () => {
        if (!filteredIncomes.length) {
            return;
        }

        const dataToExport = filteredIncomes.map(income => ({
            'Platform': income.platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            'Date': format(new Date(income.date), 'PPP'),
            'Payment Method': income.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
            'Gross Amount': income.amount.toFixed(2),
            'Distance (km)': income.distance?.toFixed(2) || 'N/A',
            'Pickup Location': income.pickupLocation?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
            'Salik Fee': (income.salikFee || 0).toFixed(2),
            'Airport Fee': (income.airportFee || 0).toFixed(2),
            'Booking Fee': (income.bookingFee || 0).toFixed(2),
            'Commission': (income.commission || 0).toFixed(2),
            'Fuel Cost': (income.fuelCost || 0).toFixed(2),
            'Net Income': calculateNet(income.amount, income).toFixed(2)
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Report');
        XLSX.writeFile(workbook, `RideShare_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Custom Report</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select a date range and platform to generate a report.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <Select value={platform} onValueChange={(value) => setPlatform(value as RidePlatform | 'all')}>
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
                    <Button onClick={handleExport} disabled={filteredIncomes.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Export to Excel
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Report Summary</CardTitle>
                    <CardDescription>
                        Summary for {dateRange?.from ? format(dateRange.from, "PPP") : ''}
                        {dateRange?.to ? ` to ${format(dateRange.to, "PPP")}` : ''}
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
                <CardContent className="flex gap-4">
                   <Skeleton className="h-10 w-48" />
                   <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

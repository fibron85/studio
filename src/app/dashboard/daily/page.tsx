'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfToday, startOfYesterday, isEqual } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { RidePlatform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

const defaultPlatforms: RidePlatform[] = ['bolt', 'uber', 'careem', 'dtc'];

const timeZone = 'Asia/Dubai';

export default function DailyReportPage() {
    const { incomes, loading, settings } = useAppContext();
    const [platform, setPlatform] = useState<RidePlatform | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());

    if (loading) {
        return <ReportSkeleton />;
    }

    const getDayStart = (date: Date) => {
        return toZonedTime(date, timeZone);
    };

    const filteredIncomes = incomes
        .filter(income => {
            if (!selectedDate) return false;
            const incomeDate = new Date(income.date);
            const zonedIncomeDate = getDayStart(incomeDate);
            const zonedSelectedDate = getDayStart(selectedDate);
            const isSameDay = zonedIncomeDate.getFullYear() === zonedSelectedDate.getFullYear() &&
                              zonedIncomeDate.getMonth() === zonedSelectedDate.getMonth() &&
                              zonedIncomeDate.getDate() === zonedSelectedDate.getDate();

            const isPlatformMatch = platform === 'all' || income.platform === platform;
            return isSameDay && isPlatformMatch;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Daily Report</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Daily Rides</CardTitle>
                    <CardDescription>A detailed log of rides for the selected date.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Select
                            value={
                                selectedDate
                                    ? isEqual(selectedDate, startOfToday())
                                        ? 'today'
                                        : isEqual(selectedDate, startOfYesterday())
                                            ? 'yesterday'
                                            : 'custom'
                                    : ''
                            }
                            onValueChange={(value) => {
                                if (value === 'today') setSelectedDate(startOfToday());
                                if (value === 'yesterday') setSelectedDate(startOfYesterday());
                            }}
                        >
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Select a date range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="custom">Custom Date</SelectItem>
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full md:w-[240px] justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => setSelectedDate(date || undefined)}
                                    initialFocus
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
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(income.date), 'p')}</TableCell>
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
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center h-24">No income data available for this day.</TableCell>
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

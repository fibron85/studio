'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay } from 'date-fns';
import { groupBy } from '@/lib/utils';
import type { Income } from '@/lib/types';

export default function DailyReportPage() {
    const { incomes, loading } = useAppContext();

    if (loading) {
        return <ReportSkeleton />;
    }
    
    const groupedByDay = groupBy(incomes, (income: Income) => format(startOfDay(new Date(income.date)), 'yyyy-MM-dd'));

    const dailySummaries = Object.entries(groupedByDay).map(([date, dailyIncomes]) => {
        const total = dailyIncomes.reduce((sum, i) => sum + i.amount, 0);
        return {
            date,
            total,
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
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Rides</TableHead>
                                <TableHead className="text-right">Total Income</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailySummaries.length > 0 ? dailySummaries.map(summary => (
                                <TableRow key={summary.date}>
                                    <TableCell className="font-medium">{format(new Date(summary.date), 'PPP')}</TableCell>
                                    <TableCell>{summary.count}</TableCell>
                                    <TableCell className="text-right">${summary.total.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No income data available.</TableCell>
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
                   <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

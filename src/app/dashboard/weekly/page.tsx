'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format, endOfWeek, eachWeekOfInterval, subWeeks, startOfWeek } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const calculateNet = (amount: number, { salikToll = 0, airportFee = 0, commission = 0, bookingFee = 0 }: { salikToll?: number, airportFee?: number, commission?: number, bookingFee?: number }) => {
    return amount - salikToll - airportFee - commission - bookingFee;
}

export default function WeeklyReportPage() {
    const { incomes, loading } = useAppContext();

    if (loading) {
        return <ReportSkeleton />;
    }

    const last12Weeks = eachWeekOfInterval({
        start: subWeeks(new Date(), 11),
        end: new Date(),
    }, { weekStartsOn: 1 });

    const weeklyData = last12Weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekIncomes = incomes.filter(i => {
            const incomeDate = new Date(i.date);
            return incomeDate >= weekStart && incomeDate <= weekEnd;
        });
        const total = weekIncomes.reduce((sum, i) => sum + calculateNet(i.amount, i), 0);
        return {
            name: `${format(weekStart, 'MMM d')}`,
            total: total
        };
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Weekly Report</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Last 12 Weeks Net Income</CardTitle>
                    <CardDescription>Your net income totals for the past 12 weeks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{ total: { label: "Net Income", color: "hsl(var(--primary))" } }} className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
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
                   <Skeleton className="h-[400px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

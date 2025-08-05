'use client';
import { Target, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/contexts/app-provider';
import AddIncomeDialog from '@/components/add-income-dialog';
import SetGoalDialog from '@/components/set-goal-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, isWithinInterval, setDate, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { Income } from '@/lib/types';

const calculateNet = (amount: number, { salikFee = 0, airportFee = 0, commission = 0, bookingFee = 0, fuelCost = 0 }: { salikFee?: number, airportFee?: number, commission?: number, bookingFee?: number, fuelCost?: number }) => {
    return amount - salikFee - airportFee - commission - bookingFee - fuelCost;
}

export default function DashboardPage() {
    const { incomes, settings, loading, markAsPaidToCashier } = useAppContext();

    if (loading) {
        return <DashboardSkeleton />;
    }

    const today = new Date();
    const periodStart = today.getDate() >= 21 ? setDate(today, 21) : setDate(subMonths(today, 1), 21);
    const periodEnd = today.getDate() >= 21 ? setDate(subMonths(today, -1), 20) : setDate(today, 20);

    const monthlyIncome = incomes
        .filter(income => {
            const incomeDate = new Date(income.date);
            return isWithinInterval(incomeDate, { start: periodStart, end: periodEnd });
        })
        .reduce((acc, income) => acc + calculateNet(income.amount, income), 0);
    
    const totalIncome = incomes.reduce((acc, income) => acc + calculateNet(income.amount, income), 0);

    const uniqueDays = new Set(incomes.map(i => new Date(i.date).toDateString())).size;
    const avgDailyIncome = uniqueDays > 0 ? totalIncome / uniqueDays : 0;

    const goalProgress = settings.monthlyGoal > 0 ? (monthlyIncome / settings.monthlyGoal) * 100 : 0;
    
    const recentIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const recentIncomesSummary = recentIncomes.reduce((acc, income) => {
        acc.gross += income.amount;
        acc.net += calculateNet(income.amount, income);
        acc.distance += income.distance || 0;
        return acc;
    }, { gross: 0, net: 0, distance: 0 });

    return (
        <div className="flex flex-col flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <SetGoalDialog />
                    <AddIncomeDialog />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Net Income</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AED {totalIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month's Net Income</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AED {monthlyIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Daily Net Income</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AED {avgDailyIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Goal Progress</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{goalProgress.toFixed(0)}%</div>
                        <Progress value={goalProgress} className="mt-2 h-2" />
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Rides</CardTitle>
                        <CardDescription>Your last 5 recorded incomes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Gross</TableHead>
                                    <TableHead className="text-right">Net</TableHead>
                                    <TableHead className="text-right">Distance</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentIncomes.length > 0 ? recentIncomes.map(income => (
                                    <TableRow key={income.id}>
                                        <TableCell className="font-medium capitalize">{income.platform}</TableCell>
                                        <TableCell className="capitalize">{income.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                                        <TableCell className="text-right">AED {income.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">AED {calculateNet(income.amount, income).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{income.distance ? `${income.distance.toFixed(1)} km` : '-'}</TableCell>
                                        <TableCell className="text-right">{format(new Date(income.date), 'PPP')}</TableCell>
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
                                        <TableCell colSpan={7} className="text-center h-24">No recent income recorded.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            {recentIncomes.length > 0 && (
                                <TableFooter>
                                    <TableRow className="font-bold bg-muted hover:bg-muted">
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell className="text-right">AED {recentIncomesSummary.gross.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">AED {recentIncomesSummary.net.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{recentIncomesSummary.distance.toFixed(1)} km</TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="h-2 w-full mt-2" /></CardContent></Card>
            </div>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                    <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

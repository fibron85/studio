'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Banknote, CreditCard, Globe } from 'lucide-react';

export default function PaymentSummaryPage() {
    const { incomes, loading } = useAppContext();

    if (loading) {
        return <ReportSkeleton />;
    }

    const paymentSummary = incomes.reduce((acc, income) => {
        const platform = income.platform;
        const paymentMethod = income.paymentMethod || 'online_paid';
        const amount = income.amount;

        if (!acc[platform]) {
            acc[platform] = { cash: 0, credit_card: 0, online_paid: 0 };
        }
        acc[platform][paymentMethod] = (acc[platform][paymentMethod] || 0) + amount;
        
        return acc;
    }, {} as Record<string, { cash: number, credit_card: number, online_paid: number }>);

    const cashierSummary = incomes.reduce((acc, income) => {
        if (income.paymentMethod === 'cash' || income.paymentMethod === 'credit_card') {
            if (income.paidToCashier) {
                acc.paid += income.amount;
            } else {
                acc.pending += income.amount;
            }
        }
        return acc;
    }, { paid: 0, pending: 0});
    
    const totalCash = Object.values(paymentSummary).reduce((sum, p) => sum + p.cash, 0);
    const totalCard = Object.values(paymentSummary).reduce((sum, p) => sum + p.credit_card, 0);
    const totalOnline = Object.values(paymentSummary).reduce((sum, p) => sum + p.online_paid, 0);


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Payment Summary</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Income by Payment Method</CardTitle>
                    <CardDescription>A complete summary of your income by payment type across all platforms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4">
                            <CardTitle className="text-base mb-2">Paid to Cashier</CardTitle>
                            <p className="text-2xl font-bold text-green-600">AED {cashierSummary.paid.toFixed(2)}</p>
                        </Card>
                        <Card className="p-4">
                            <CardTitle className="text-base mb-2">Pending to Cashier</CardTitle>
                            <p className="text-2xl font-bold text-red-600">AED {cashierSummary.pending.toFixed(2)}</p>
                        </Card>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                            <div className="flex items-center justify-between text-lg">
                            <div className="flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-muted-foreground" />
                                <span>Total Cash</span>
                            </div>
                            <span className="font-bold">AED {totalCash.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-lg">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <span>Total Credit Card</span>
                            </div>
                            <span className="font-bold">AED {totalCard.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-lg">
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                <span>Total Online</span>
                            </div>
                            <span className="font-bold">AED {totalOnline.toFixed(2)}</span>
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl">Platform Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.keys(paymentSummary).length > 0 ? Object.keys(paymentSummary).map(platform => (
                            <Card key={platform} className="p-4">
                                <CardTitle className="capitalize mb-4">{platform}</CardTitle>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Cash</span>
                                        <span className="font-medium">AED {paymentSummary[platform].cash.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Credit Card</span>
                                        <span className="font-medium">AED {paymentSummary[platform].credit_card.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Online Paid</span>
                                        <span className="font-medium">AED {paymentSummary[platform].online_paid.toFixed(2)}</span>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <p className="text-muted-foreground col-span-full">No payment data available to summarize.</p>
                        )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


function ReportSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
            <Skeleton className="h-8 w-64" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                   </div>
                    <Skeleton className="h-px w-full" />
                     <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const loginSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      // 1. Find user document by driverId in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('driverId', '==', data.driverId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // If driverId doesn't exist, show a generic error message
        toast({
          title: 'Login Failed',
          description: 'Invalid Driver ID or password.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const email = userDoc.data().email;

      // 2. Sign in with the found email and provided password.
      // Firebase will handle the password check.
      await signInWithEmailAndPassword(auth, email, data.password);
      
      toast({
        title: 'Success',
        description: 'Logged in successfully.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      // Catch errors from signInWithEmailAndPassword (e.g., wrong password)
      // and show a generic error.
      const errorMessage = 'Invalid Driver ID or password.';
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your Driver ID and password to access your dashboard.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver ID</Label>
            <Input id="driverId" placeholder="Your driver ID" {...form.register('driverId')} />
            {form.formState.errors.driverId && <p className="text-sm font-medium text-destructive">{form.formState.errors.driverId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="******" {...form.register('password')} />
            {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
           <p className="text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

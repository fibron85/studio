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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  driverId: z.string().min(3, 'Driver ID must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Driver ID can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      // Check if driverId or email is already taken
      const usersRef = collection(db, 'users');
      const driverIdQuery = query(usersRef, where('driverId', '==', data.driverId));
      const driverIdSnapshot = await getDocs(driverIdQuery);

      if (!driverIdSnapshot.empty) {
        form.setError('driverId', { type: 'manual', message: 'This Driver ID is already taken.' });
        setLoading(false);
        return;
      }
      
      // Create user in Firebase Auth. This will fail if the email is already in use.
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Store user info (email and driverId) in Firestore, using UID as doc ID
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: data.email,
        driverId: data.driverId,
      });

      toast({
        title: 'Registration Successful',
        description: 'You can now log in.',
      });
      router.push('/login');
    } catch (error: any) {
       console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        form.setError('email', { type: 'manual', message: 'This email address is already in use.' });
      } else {
         toast({
          title: 'Registration Failed',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create your account to start tracking your income.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="driver@example.com" {...form.register('email')} />
            {form.formState.errors.email && <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver ID</Label>
            <Input id="driverId" placeholder="your_driver_id" {...form.register('driverId')} />
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
            {loading ? 'Registering...' : 'Register'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {'Already have an account? '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

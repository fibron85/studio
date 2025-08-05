'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-provider';
import { useAuth } from '@/contexts/auth-provider';
import { auth } from '@/lib/firebase';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  monthlyGoal: z.coerce.number().min(0, 'Monthly goal must be a positive number'),
  boltCommission: z.coerce.number().min(0).max(100, 'Commission must be between 0 and 100'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, updateSettings, loading } = useAppContext();
  const { toast } = useToast();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user && settings) {
      profileForm.reset({
        fullName: settings.fullName || user.displayName || '',
        email: user.email || '',
        monthlyGoal: settings.monthlyGoal,
        boltCommission: settings.boltCommission,
      });
    }
  }, [user, settings, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setProfileLoading(true);

    try {
      // Update Firestore settings
      updateSettings({
        fullName: data.fullName,
        monthlyGoal: data.monthlyGoal,
        boltCommission: data.boltCommission,
      });

      // Update Firebase Auth profile
      if (user.displayName !== data.fullName) {
        await updateProfile(user, { displayName: data.fullName });
      }

      // Update email if changed
      if (user.email !== data.email) {
         toast({ title: "Email Update", description: "A verification email will be required to change your email. This feature is not fully implemented in this demo.", variant: "default"});
         // For a real app, you would need to re-authenticate the user before updating the email.
         // const credential = promptForCredentials(); // This needs a secure implementation
         // await reauthenticateWithCredential(user, credential);
         // await updateEmail(user, data.email);
      }

      toast({ title: 'Success', description: 'Your profile has been updated.' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user || !user.email) return;
    setPasswordLoading(true);

    try {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.newPassword);
        toast({ title: 'Success', description: 'Your password has been changed.' });
        passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: ''});
    } catch (error: any) {
        console.error(error);
        let description = 'An error occurred. Please try again.';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = 'The current password you entered is incorrect.';
        }
        toast({ title: 'Password Change Failed', description, variant: 'destructive' });
    } finally {
        setPasswordLoading(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-0 md:pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information and application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...profileForm.register('fullName')} />
                {profileForm.formState.errors.fullName && <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...profileForm.register('email')} />
                 {profileForm.formState.errors.email && <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="monthlyGoal">Monthly Income Goal (AED)</Label>
                    <Input id="monthlyGoal" type="number" {...profileForm.register('monthlyGoal')} />
                    {profileForm.formState.errors.monthlyGoal && <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.monthlyGoal.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="boltCommission">Bolt Commission (%)</Label>
                    <Input id="boltCommission" type="number" {...profileForm.register('boltCommission')} />
                    {profileForm.formState.errors.boltCommission && <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.boltCommission.message}</p>}
                </div>
              </div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your login password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                 {passwordForm.formState.errors.currentPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
            <Skeleton className="h-8 w-48" />
             <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-40" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

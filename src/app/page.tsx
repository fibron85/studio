'use client';
import { useAuth } from '@/contexts/auth-provider';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        redirect('/dashboard');
      } else {
        redirect('/login');
      }
    }
  }, [user, loading]);

  // You can show a loading spinner here while checking auth state
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}

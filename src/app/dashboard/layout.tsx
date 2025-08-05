'use client';

import { AppProvider } from '@/contexts/app-provider';
import DashboardSidebar from '@/components/dashboard-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserProfile from '@/components/user-profile';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <AppProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SidebarTrigger className="sm:hidden" />
                <div className="flex-1"></div>
                <UserProfile />
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="py-4 px-6 text-center text-sm text-muted-foreground">
              <p>Apps Developed By Md Fakhrul Islam DTC ID 2221508</p>
              <p>This App is under development and still on Test.</p>
            </footer>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </AppProvider>
  )
}

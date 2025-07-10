import { AppProvider } from '@/contexts/app-provider';
import DashboardSidebar from '@/components/dashboard-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SidebarTrigger className="sm:hidden" />
            </header>
            <main>
              {children}
            </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </AppProvider>
  )
}

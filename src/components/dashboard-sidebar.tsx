'use client'
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, BarChart3, LineChart, FileText, LogOut } from 'lucide-react';
import Logo from './logo';
import { useAuth } from '@/contexts/auth-provider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/daily', label: 'Daily', icon: CalendarDays },
    { href: '/dashboard/weekly', label: 'Weekly Reports', icon: BarChart3 },
    { href: '/dashboard/monthly', label: 'Monthly Reports', icon: LineChart },
    { href: '/dashboard/custom', label: 'Custom Report', icon: FileText },
]

export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({ title: 'Signed out successfully.'});
            router.push('/login');
        } catch (error) {
            toast({ title: 'Error signing out', description: 'Please try again.', variant: 'destructive' });
        }
    };


    return (
        <Sidebar>
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                className="w-full justify-start"
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {user && (
                     <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleSignOut} className="w-full justify-start">
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}

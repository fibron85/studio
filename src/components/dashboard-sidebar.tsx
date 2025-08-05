'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, BarChart3, LineChart, FileText, Settings, List } from 'lucide-react';
import Logo from './logo';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/daily', label: 'Daily Report', icon: CalendarDays },
    { href: '/dashboard/all-rides', label: 'All Rides', icon: List },
    { href: '/dashboard/weekly', label: 'Weekly Reports', icon: BarChart3 },
    { href: '/dashboard/monthly', label: 'Monthly Reports', icon: LineChart },
    { href: '/dashboard/custom', label: 'Custom Report', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardSidebar() {
    const pathname = usePathname();

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
        </Sidebar>
    );
}

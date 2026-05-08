'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Building2,
  ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/users',        label: 'Users',         Icon: Users },
  { href: '/vendors',      label: 'Vendors',       Icon: Building2 },
  { href: '/equipment',    label: 'Equipment',     Icon: Package },
  { href: '/requirements', label: 'Requirements',  Icon: ClipboardList },
  { href: '/orders',       label: 'Orders',        Icon: ShoppingCart },
  { href: '/inquiries',    label: 'Inquiries',     Icon: MessageSquare },
  { href: '/analytics',    label: 'Analytics',     Icon: BarChart3 },
  { href: '/settings',     label: 'Settings',      Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'sidebar-nav relative flex flex-col transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60',
        'min-h-screen',
      )}
    >
      {/* ── Logo ───────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--sidebar-border)]">
        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-[var(--shadow-glow)]">
          <Image
            src="/urbanav-logo.jpg"
            alt="UrbanAV"
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-base tracking-wide">UrbanAV</span>
            <span className="block text-[10px] text-white/60 leading-none tracking-widest uppercase">Admin Panel</span>
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                'text-sm font-medium',
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/8 hover:text-white/90',
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ─────────────────────────────── */}
      <div className="border-t border-[var(--sidebar-border)] px-2 py-3 space-y-0.5">
        <button
          suppressHydrationWarning
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm font-medium"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── Collapse toggle ────────────────────── */}
      <button
        suppressHydrationWarning
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-[var(--shadow-soft)] border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

// ── Top Header ────────────────────────────────────────────────────────────
export function Header({ title }: { title?: string }) {
  return (
    <header className="h-16 glass-strong border-b border-border/50 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-bold text-foreground">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            suppressHydrationWarning
            placeholder="Search..."
            className="h-9 pl-9 pr-4 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-48 lg:w-60 placeholder:text-muted-foreground/60"
          />
        </div>
        {/* Notifications */}
        <button
          suppressHydrationWarning
          className="relative w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        {/* Admin avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-[var(--shadow-neon)]">
          A
        </div>
      </div>
    </header>
  );
}

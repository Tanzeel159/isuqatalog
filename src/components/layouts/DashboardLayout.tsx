import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Home,
  BookOpen,
  Sparkles,
  CalendarDays,
  GraduationCap,
  HelpCircle,
  Settings,
  Menu,
  X,
  LogOut,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { useAuth } from '@/contexts/AuthContext';

interface NavSection {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  children: { to: string; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    children: [],
  },
  {
    id: 'courses',
    to: '/catalog',
    label: 'Courses',
    icon: BookOpen,
    children: [
      { to: '/catalog', label: 'Browse Catalog' },
      { to: '/my-courses', label: 'My Courses' },
    ],
  },
  {
    id: 'schedule',
    to: '/schedule',
    label: 'Schedule',
    icon: CalendarDays,
    children: [],
  },
  {
    id: 'planner',
    to: '/planner',
    label: 'AI Planner',
    icon: Sparkles,
    children: [],
  },
  {
    id: 'graduation',
    to: '/graduation',
    label: 'Graduation',
    icon: GraduationCap,
    children: [],
  },
  {
    id: 'profile',
    to: '/profile',
    label: 'Profile',
    icon: UserCircle,
    children: [
      { to: '/profile', label: 'Academic Info' },
      { to: '/profile?section=graduation', label: 'Graduation Progress' },
    ],
  },
];

function getActiveSection(pathname: string): string {
  if (pathname.startsWith('/catalog') || pathname.startsWith('/my-courses')) return 'courses';
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/planner')) return 'planner';
  if (pathname.startsWith('/graduation')) return 'graduation';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/help')) return 'help';
  return 'dashboard';
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const currentSection = getActiveSection(location.pathname);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? 'S');

  const sidebarContent = (onNav?: () => void) => (
    <>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Logo to="/dashboard" size="md" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {NAV_SECTIONS.map((section) => {
          const isActive = currentSection === section.id;
          const Icon = section.icon;
          return (
            <React.Fragment key={section.id}>
              <NavLink
                to={section.to}
                onClick={onNav}
                className={() =>
                  cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-sm)] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[var(--color-brand-cardinal)]/8 text-[var(--color-brand-cardinal)]'
                      : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]/80 hover:text-[var(--color-neutral-800)]',
                  )
                }
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-brand-cardinal)]"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-colors shrink-0',
                    isActive
                      ? 'bg-[var(--color-brand-cardinal)]/10'
                      : 'group-hover:bg-[var(--color-neutral-200)]/50',
                  )}
                >
                  <Icon
                    className="w-[16px] h-[16px]"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                {section.label}
              </NavLink>

              {isActive && section.children.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-[22px] border-l-2 border-[var(--color-border-default)]/40 pl-4 space-y-0.5 mt-0.5 mb-1">
                    {section.children.map((child) => {
                      const isChildActive =
                        ((child.to === '/catalog' || child.to === '/profile') &&
                          location.pathname === child.to &&
                          !location.search) ||
                        location.pathname + location.search === child.to;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onNav}
                          className={cn(
                            'block py-1.5 px-2 rounded-lg text-[var(--text-sm)] font-medium transition-colors',
                            isChildActive
                              ? 'text-[var(--color-brand-cardinal)]'
                              : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]',
                          )}
                        >
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-[var(--color-border-default)]/30 pt-3">
        <NavLink
          to="/settings"
          onClick={onNav}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-sm)] font-medium transition-colors',
            currentSection === 'settings'
              ? 'bg-[var(--color-brand-cardinal)]/8 text-[var(--color-brand-cardinal)]'
              : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-700)]',
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
        <NavLink
          to="/help"
          onClick={onNav}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-sm)] font-medium transition-colors',
            currentSection === 'help'
              ? 'bg-[var(--color-brand-cardinal)]/8 text-[var(--color-brand-cardinal)]'
              : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-700)]',
          )}
        >
          <HelpCircle className="w-4 h-4" />
          Help & Support
        </NavLink>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)] hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[var(--color-surface-page)]">
      <AnimatedBackground variant="dashboard" />
      <CommandPalette />
      <ChatPanel />

      {/* ── Mobile overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar (always expanded) ──────────────── */}
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 left-0 bottom-0 z-30 w-[260px] flex-col',
          'border-r border-[var(--color-border-default)]/50',
          'glass-panel-strong',
        )}
      >
        {sidebarContent()}
      </aside>

      {/* ── Mobile sidebar (drawer) ────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-[260px] z-50 glass-panel-strong flex flex-col lg:hidden"
          >
            <div className="absolute top-4 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent(() => setMobileOpen(false))}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 lg:pl-[260px]">
        <header className="sticky top-0 z-30 w-full">
          <div className="glass-panel-strong border-b border-[var(--color-border-default)]/50 px-4 lg:px-8 py-3 flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 max-w-xl mx-auto">
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-2xl border transition-all duration-200 cursor-text',
                  'border-[var(--color-border-default)]/70 bg-[var(--color-neutral-50)]/80',
                  'hover:border-[var(--color-border-hover)] hover:bg-white',
                )}
              >
                <Search className="w-4 h-4 text-[var(--color-neutral-400)] ml-4 flex-shrink-0" />
                <span className="flex-1 h-[var(--input-h-md)] flex items-center text-[var(--text-sm)] text-[var(--color-neutral-400)]">
                  Search courses, pages...
                </span>
                <div className="hidden sm:flex items-center mr-3 gap-1 text-[var(--text-2xs)] text-[var(--color-neutral-300)] select-none">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--color-neutral-100)] border border-[var(--color-neutral-200)] font-mono text-[10px]">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--color-neutral-100)] border border-[var(--color-neutral-200)] font-mono text-[10px]">
                    K
                  </kbd>
                </div>
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-[var(--color-brand-cardinal)] flex items-center justify-center text-white text-[var(--text-xs)] font-bold shadow-md ring-2 ring-white/50 cursor-pointer"
            >
              {initials}
            </motion.button>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

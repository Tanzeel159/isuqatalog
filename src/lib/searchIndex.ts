/**
 * Co-located search index.
 *
 * Each page exports its own `SEARCH_ENTRIES` array next to the component.
 * This file aggregates them into the flat index used by the command palette.
 *
 * To add a new page: one import + one line in getRegistry() below.
 *
 * The index is built lazily on first access to avoid TDZ issues caused by
 * Vite's module evaluation order.
 */

export type { PageSearchEntry, ContentEntry } from './searchTypes';
import type { PageSearchEntry, ContentEntry } from './searchTypes';

// ── Lazy registry ─────────────────────────────────────────────
// Imports are static (for tree-shaking) but reading values is deferred.

import * as Dashboard from '@/pages/dashboard/Dashboard';
import * as Catalog from '@/pages/catalog/CourseCatalog';
import * as CourseDetail from '@/pages/catalog/CourseDetail';
import * as Schedule from '@/pages/schedule/SchedulePlanner';
import * as Graduation from '@/pages/graduation/GraduationCheck';
import * as Profile from '@/pages/profile/StudentProfile';
import * as Planner from '@/pages/planner/AIPlannerPage';
import * as MyCourses from '@/pages/courses/MyCourses';
import * as Settings from '@/pages/settings/SettingsPage';
import * as Help from '@/pages/help/HelpSupportPage';

function getRegistry(): { page: string; route: string; entries: PageSearchEntry[] }[] {
  return [
    { page: 'Dashboard', route: '/dashboard', entries: Dashboard.SEARCH_ENTRIES },
    { page: 'Course Catalog', route: '/catalog', entries: Catalog.SEARCH_ENTRIES },
    { page: 'My Courses', route: '/my-courses', entries: MyCourses.SEARCH_ENTRIES },
    { page: 'Course Detail', route: '/course/hci5210', entries: CourseDetail.SEARCH_ENTRIES },
    { page: 'Schedule Planner', route: '/schedule', entries: Schedule.SEARCH_ENTRIES },
    { page: 'AI Planner', route: '/planner', entries: Planner.SEARCH_ENTRIES },
    { page: 'Graduation Check', route: '/graduation', entries: Graduation.SEARCH_ENTRIES },
    { page: 'Profile', route: '/profile', entries: Profile.SEARCH_ENTRIES },
    { page: 'Settings', route: '/settings', entries: Settings.SEARCH_ENTRIES },
    { page: 'Help & Support', route: '/help', entries: Help.SEARCH_ENTRIES },
  ];
}

// ── Build flat index on first access ──────────────────────────

let _cache: ContentEntry[] | null = null;

export function getSearchIndex(): ContentEntry[] {
  if (_cache) return _cache;
  let counter = 0;
  _cache = getRegistry().flatMap(({ page, route, entries }) =>
    entries.map((e) => ({
      id: `content-${counter++}`,
      page,
      route: e.route ?? route,
      section: e.section,
      text: e.text,
    })),
  );
  return _cache;
}

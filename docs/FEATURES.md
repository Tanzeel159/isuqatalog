# ISU Qatalog — Feature Documentation

> Comprehensive inventory of all implemented features, their current status, and technical details.

---

## Table of Contents

- [Authentication](#authentication)
- [Onboarding Flow](#onboarding-flow)
- [Dashboard](#dashboard)
- [Course Catalog](#course-catalog)
- [Course Detail](#course-detail)
- [Schedule Planner](#schedule-planner)
- [Graduation Check](#graduation-check)
- [Student Profile](#student-profile)
- [Department Browsing (Public)](#department-browsing-public)
- [Command Palette & Search](#command-palette--search)
- [AI Chat Assistant](#ai-chat-assistant)
- [Shared UI & Design System](#shared-ui--design-system)
- [Backend & API](#backend--api)
- [Data Layer](#data-layer)
- [Tech Stack](#tech-stack)
- [Known Gaps & Stubs](#known-gaps--stubs)

---

## Authentication

**Routes:** `/` (login), `/signup`, `/forgot-password`, `/reset-password`

### Login
- Email/QatalogID + password form with show/hide toggle
- Calls `POST /api/auth/login` — real backend auth with bcrypt password hashing
- Session-based auth using httpOnly cookies (sameSite: lax)
- On success → redirects to `/dashboard`
- Inline error messages on failure

### Signup
- QatalogID, email, password with real-time strength indicator (Weak → Excellent)
- Client-side validation: email format, QatalogID ≥ 2 chars, password ≥ 8 chars
- Calls `POST /api/auth/signup` — creates user in SQLite, starts session
- On success → redirects to `/onboarding`

### Forgot Password
- **Status: Stub** — UI complete (email input + success state), but no API call; uses `setTimeout` mock

### Reset Password
- **Status: Stub** — UI complete (new + confirm password), but no API call; uses `setTimeout` mock

### Auth Backend
- SQLite database (`Data/app.db`) with `users` and `sessions` tables
- Password hashing via `server/crypto.ts` (bcrypt-style)
- Session tokens stored as hashes, 7-day expiry
- Rate limiting: 30 requests per 15 minutes on auth endpoints
- `GET /api/auth/me` returns current user from session cookie
- `POST /api/auth/logout` clears session

---

## Onboarding Flow

**Routes:** `/onboarding` → `/onboarding/interests` → `/onboarding/workload`

A 3-step guided setup shown after signup. Wrapped in `AuthLayout` with step progress indicator.

### Step 1 — Map Your Background (`/onboarding`)
- Academic Level: Undergraduate, Graduate, PhD
- Area of Study: Engineering, Design, Business, Sciences
- Year of Study: Freshman, Sophomore, Junior, Senior

### Step 2 — Personal Interests (`/onboarding/interests`)
- 7 interest chips: Psychology, UI/UX, Graphics, AR/VR, Entrepreneurship, Qualitative Research, Cognitive Psychology
- Multi-select with visual feedback

### Step 3 — Workload Preferences (`/onboarding/workload`)
- Class Timings: Morning, Afternoon, Evening, All of the above
- Credit preferences per semester: 2, 3, 4, Doesn't matter
- International student toggle (with explanation about visa requirements)

**Data persistence:** None — all selections are `console.log`'d only. Each step has a "Skip for now" option. On completion → `/dashboard`.

---

## Dashboard

**Route:** `/dashboard` (protected)

The main landing page after login, providing an academic overview.

### Implemented Widgets

| Widget | Description | Data Source |
|--------|-------------|-------------|
| **Greeting** | Time-aware greeting (Morning/Afternoon/Evening) with user name | Auth context (email parsed) |
| **Registration Alert** | "Fall 2026 Registration Opens Soon" with date + Set Reminder button | Hardcoded |
| **Quick Actions** | 3 cards: Build Semester Plan, Search Courses, View Saved Plans | Static links |
| **Current Semester** | Table of Spring 2026 courses with codes, names, credits | `CURRENT_COURSES` from `lib/student.ts` (mock) |
| **Graduation Progress** | Credit breakdown: Core, Electives, Research with progress bars | Hardcoded (25/35 credits) |
| **AI Recommendations** | 3 personalized course recommendations with match percentages | `POST /api/ai/recommendations` with static fallback |

### AI Recommendations
- Sends current courses + completed courses to the API
- When OpenAI is configured: real personalized recommendations
- Fallback: 3 hardcoded recommendations (HCI 577, HCI 5210, CPRE 5580)

---

## Course Catalog

**Route:** `/catalog` (protected)

Full-featured course browsing with filtering, sorting, and search.

### Course Data
- **28 HCI courses** with full details (code, name, description, category, credits, delivery mode, cross-listings, offerings with instructor/rating/difficulty/would-take-again)
- **6 departments** listed (HCI, AE, BA, PSYCH, ART, IDD) — only HCI has course data; others show empty state
- **5 categories:** Design Core, Implementation Core, Phenomena Core, Evaluation Core, Elective

### Filtering System
| Filter | Type | Options |
|--------|------|---------|
| **Department** | Dropdown | HCI, AE, BA, PSYCH, ART, IDD |
| **Text search** | Input | Matches code, name, description, instructor |
| **Level** | Toggle pills | Graduate, Undergraduate |
| **Semester** | Pills | All Terms, Fall 2025, Spring 2026 |
| **Category** | Colored pills | 5 categories with live counts |
| **Max Workload** | Range slider (advanced) | 1–5 scale |
| **Min Rating** | Options (advanced) | Any, ≥ 3.0, ≥ 4.0 |

### Sorting
- Best Match (default), Highest Rated, Lowest Workload, Most Popular

### Course Cards
Each card displays:
- Course code + category badge (color-coded)
- Star rating + workload indicator (dot scale)
- Credits, level, instructor name
- Description text
- Delivery mode (In-Person, Online, In-Person & Online)
- Cross-listed courses (if any)
- "Would take again" percentage (if available)
- Term availability
- Save/Unsave toggle + "View Details" button

### Limitations
- Save state is component-local (not persisted across refresh)
- Only HCI department has real course data
- `?view=my` and `?view=saved` query params are referenced in nav but not implemented

---

## Course Detail

**Route:** `/course/:id` (protected)

A comprehensive single-course view accessible via the "View Details" button on catalog cards.

### Sections

| Section | Description |
|---------|-------------|
| **Course Header** | Code, category badge, name, category color blocks, consolidated star rating |
| **About This Course** | Full description with metadata pills (instructor, prereqs, terms, seats) |
| **Workload & Expectations** | Lecture hours per week, outside work hours, animated workload score bar (1–5) |
| **Assessment Methods** | Animated horizontal bars for grade breakdown (projects, exams, group work, etc.) |
| **Student Reviews** | Verified ISU student quotes with term attribution |
| **Course Statistics** | 2×2 grid: Workload, Take Again %, Avg Grade, Enrollment |
| **AI Difficulty Assessment** | Live AI feature — calls `POST /api/ai/course-analysis` with RAG context; shows difficulty, summary, and key points; loading skeleton + "Live" badge + refresh button; falls back to static data when AI unavailable |
| **Prerequisites & Cross-Listings** | Cross-listed department badges, advisor confirmation note |

### Tabs
- **Overview** — all content sections visible
- **Reviews** — focused reviews view
- **Discussion** — stub (coming soon)

### Navigation
- Breadcrumb: Back to Catalog → HCI Department → Course Code
- "View Details" in catalog cards navigates to `/course/:id`
- Save Course toggle + Add to Plan button (local state only)

### Mock Data
- Assessment breakdowns, reviews, enrollment, grades, and difficulty are deterministically generated per course ID
- Provides consistent but varied data for each of the 28 HCI courses

### Limitations
- Save and Add to Plan are component-local (not persisted)
- Discussion tab is a stub
- Mock data is generated, not from a real database
- Only HCI courses are supported

---

## Schedule Planner

**Route:** `/schedule` (protected)

A weekly calendar view showing scheduled courses with conflict detection.

### Calendar View
- Monday–Friday, 8 AM–5 PM grid
- Color-coded course blocks positioned by time
- Hover to see course details (instructor, location, credits)
- Semester navigation (Spring 2026, Fall 2026)

### Analytical Panels

| Panel | Description |
|-------|-------------|
| **Schedule Status** | Conflict detection — shows "No time conflicts" or lists overlapping courses |
| **Prerequisites** | Checks each course's prerequisites against completed courses (Met/Not Met) |
| **Graduation Requirements** | Core HCI, Electives, Research, Total Credits — progress toward degree |
| **Schedule Summary** | Total courses, total credits, average workload for selected semester |
| **Workload Legend** | Color scale: low, moderate, high |

### Schedule Data
- **Spring 2026:** 3 courses (HCI 5210, HCI 5300, ARTGR 5300)
- **Fall 2026:** 2 courses (HCI 5800, HCI 5750)
- **Completed courses:** 9 course codes for prerequisite checking

### Limitations
- No drag-and-drop to rearrange
- No add/remove courses
- Export and "Share with Advisor" buttons are non-functional
- Data is static mock

---

## Graduation Check

**Route:** `/graduation` (protected)

Tracks progress toward degree completion with a visual timeline and AI-powered insights.

### Sections

| Section | Description |
|---------|-------------|
| **Progress Overview** | Animated ring showing credit completion, estimated graduation date, GPA, in-progress count |
| **Degree Requirements** | Expandable rows for each requirement area with course lists and completion status |
| **Graduation Timeline** | 4 semesters (Fall 2025 → Spring 2027) with status: completed, current, planned |
| **AI Academic Insights** | Personalized tips from `POST /api/ai/insights` |

### Degree Requirements Tracked
- Each requirement has: name, required credits, earned credits, status (complete/in-progress/not-started), list of courses

### AI Insights
- Sends degree requirements, earned credits, and timeline to the API
- When OpenAI configured: real insights
- Fallback: 2 static insights about elective credits and prerequisite ordering

### Data Source
All data from `src/lib/student.ts` (mock): `EARNED_CREDITS`, `TOTAL_REQUIRED`, `GPA`, `ESTIMATED_GRAD`, `DEGREE_REQUIREMENTS`, `TIMELINE_SEMESTERS`

---

## Student Profile

**Route:** `/profile` (protected), with sections via `?section=` query param

### Academic Info (default)
- **Hero card:** Initials avatar, name, QatalogID, 4 stat badges (GPA, Credits Earned, Completion %, In Progress count)
- **Major & Degree:** Major (HCI), Minor (Psychology), Academic Level, Expected Graduation
- **Currently Enrolled:** Table with course code, name, category, semester
- **Completed Courses:** Grouped by semester with grades and credits; semester totals
- **Advisor Information:** Assigned advisor (Dr. Stephen Gilbert), contact, academic standing

### AI Preferences (`?section=ai`)
- **AI Assistance toggle:** Master on/off for AI features
- **Feature toggles:** Course Recommendations, Study Plan Generation (disabled when master is off)
- **Data Privacy:** "Do not use my data for training", "Anonymize data exports"

### Graduation Progress (`?section=graduation`)
- Degree completion progress bar
- Requirements breakdown (same data as Graduation Check)
- Remaining credits summary

### Limitations
- All data is hardcoded mock
- Toggle states are component-local (not persisted)
- "Edit Profile" and avatar edit buttons are non-functional

---

## Department Browsing (Public)

Two public pages for unauthenticated users to explore departments.

### Department Select (`/explore`)
- **Hero section:** Full-width search over HCI courses (min 2 chars, max 6 results for unauthenticated)
- **Feature cards:** Skill Mapping, Career Alignment, Syllabus Analysis (descriptive only)
- **Department grid:** 6 department cards with accent colors, descriptions, and mock course counts
- **Trending courses:** 4 hardcoded popular courses
- **CTA footer:** "Join 10,000+ learners at Iowa State" with Sign Up link

### Department View (`/department/:id`)
- **Department banner** with switcher dropdown
- **Tab navigation:** Courses, Professors, Students (only Courses is functional)
- **Course filters:** Text search, level, semester, delivery mode, category
- **Course grid:** Full course cards (only HCI has data; others show "coming soon")

---

## Command Palette & Search

**Trigger:** `Ctrl+K` / `Cmd+K`, or click the search bar in the header

### Search Scopes

| Group | Count | Match logic |
|-------|-------|-------------|
| **Pages** | 6 | Label, description, keywords |
| **Courses** | 28 (HCI) | Code, name, instructor, category (min 2 chars) |
| **Page Content** | ~30 entries | Section text from each page (min 2 chars) |

### Page Content Search (co-located architecture)
- Each page exports a `SEARCH_ENTRIES` array alongside its component
- Entries define `section`, `text`, and optional `route` override (for sub-sections like `/profile?section=ai`)
- `src/lib/searchIndex.ts` aggregates all entries lazily via `getSearchIndex()`
- Adding a new page = export `SEARCH_ENTRIES` + one line in the registry
- Cursor rule (`.cursor/rules/search-entries-on-new-page.mdc`) reminds to add entries when creating pages

### UI Features
- Grouped results with headers (Pages, Page Content, Courses)
- Highlighted text snippets for content matches (matched term wrapped in `<mark>`)
- Keyboard navigation (Arrow Up/Down, Enter, Tab)
- Category-colored dots for course results
- Page/section breadcrumb for content results (e.g., "Profile › AI Preferences")
- Full ARIA: combobox, listbox, option roles

---

## AI Chat Assistant

**Trigger:** Floating action button (bottom-right corner) on all dashboard pages

### Features
- Conversational interface with markdown rendering (headings, lists, code blocks, links)
- Calls `POST /api/chat` with message + student context
- Student context includes: current courses, degree progress, GPA, academic level
- Suggestion prompts for common questions
- HTML sanitization via DOMPurify
- Scrollable message history

### Backend
- Uses OpenAI GPT-4.1-mini
- RAG retrieval: Pinecone (if configured) or local TF-IDF over 35 HCI data JSON files
- Conversation memory: 20 messages, 30-minute TTL per session
- Rate limited: 20 requests/minute

---

## Shared UI & Design System

### Layout Components
- **DashboardLayout:** Sidebar nav (desktop: fixed, mobile: animated drawer), sticky header with search, user menu, CommandPalette + ChatPanel integration
- **AuthLayout:** Centered glass card with optional step progress, logo, footer

### Design Tokens (CSS Custom Properties)
- **Brand:** Cardinal Red (#C8102E), Gold (#F1BE48), Dark (#1F1F1F)
- **Neutrals:** 10-step scale (50–900)
- **Semantic colors:** Error, success, warning, info
- **Typography:** Inter (body), Merriweather (display); 8 size tokens (2xs–3xl)
- **Shadows:** 4 levels (sm, card, lg, dropdown) + glow effect
- **Motion:** 3 duration tokens, 3 easing tokens

### Utility Classes
- `glass-panel` / `glass-panel-strong` — frosted glass cards with backdrop blur
- `noise-overlay` — subtle texture overlay
- `text-gradient` — brand gradient text

### Animations
- Skeleton shimmer, float-subtle, pulse-ring, gradient-shift
- Motion variants: staggerContainer, fadeUp, fadeIn, scaleIn, slideInRight, pageTransition

### Component Library
- Toggle (accessible switch), Button, Input, Select, Skeleton, AnimatedBackground, Logo, ProtectedRoute

### Dark Mode
- Not implemented — light theme only

---

## Backend & API

### Server Stack
- Express.js with TypeScript (via `tsx watch`)
- SQLite (better-sqlite3) in WAL mode
- CORS enabled for `localhost:3000`
- Helmet for security headers

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/signup` | No | Create account |
| `POST` | `/api/auth/login` | No | Sign in |
| `POST` | `/api/auth/logout` | Yes | Sign out |
| `GET` | `/api/auth/me` | Yes | Current user |
| `POST` | `/api/chat` | Yes | AI chat (RAG) |
| `POST` | `/api/ai/recommendations` | Yes | Course recommendations |
| `POST` | `/api/ai/search` | Yes | Semantic course search |
| `POST` | `/api/ai/insights` | Yes | Academic insights |
| `POST` | `/api/ai/course-analysis` | Yes | Course difficulty analysis |

### Rate Limits
- Auth endpoints: 30 per 15 minutes
- Chat/AI endpoints: 20 per minute

### AI Infrastructure
- OpenAI GPT-4.1-mini for generation
- Pinecone for vector retrieval (optional; falls back to local TF-IDF)
- 35 JSON data files in `hci_data/` (courses, requirements, faculty, FAQs, etc.)
- 107 text chunks created at startup for retrieval

---

## Data Layer

### `src/lib/student.ts` (Mock Student Data)
- 4 current courses, 9 completed courses
- 25/35 earned credits, 3.7 GPA
- Estimated graduation: Spring 2027
- Degree requirements with course-level detail
- Timeline: 4 semesters with status
- `getStudentContext()` — serialized for AI prompts

### `src/pages/catalog/data.ts` (Course Data)
- 28 HCI courses with full metadata
- 6 department definitions
- 5 category configurations with colors
- All categories list

### `src/pages/schedule/data.ts` (Schedule Data)
- 2 semesters of scheduled courses with time/day/location
- Completed course codes for prerequisite checks

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Routing** | React Router 7 |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS 4, CSS custom properties |
| **Animation** | Motion (Framer Motion) 12 |
| **Icons** | Lucide React |
| **Backend** | Express.js + TypeScript |
| **Database** | SQLite (better-sqlite3) |
| **AI** | OpenAI SDK, Pinecone |
| **Security** | Helmet, bcrypt hashing, httpOnly cookies |
| **Utilities** | clsx, tailwind-merge, DOMPurify |

---

## Known Gaps & Stubs

| Feature | Status | Notes |
|---------|--------|-------|
| Forgot/Reset Password | Stub | UI done, no backend |
| Onboarding persistence | Not implemented | Data logged to console only |
| `/planner` route | Missing | Linked in nav/dashboard but 404s |
| `/catalog?view=my` | Not implemented | Nav link exists but catalog doesn't handle it |
| `/catalog?view=saved` | Not implemented | Nav link exists but catalog doesn't handle it |
| Course detail page/modal | **Implemented** | `/course/:id` — full detail view with tabs, stats, reviews |
| Save courses (persist) | Not implemented | Local component state only |
| Schedule add/remove courses | Not implemented | Static mock data only |
| Schedule export/share | Not implemented | Buttons exist, no handlers |
| Profile edit | Not implemented | Buttons exist, no handlers |
| AI preference persistence | Not implemented | Toggle state is local only |
| Non-HCI department data | Not implemented | 5 departments show empty/coming soon |
| Professors/Students tabs | Not implemented | Tabs exist in DepartmentView, no content |
| Dark mode | Not implemented | Light theme only |

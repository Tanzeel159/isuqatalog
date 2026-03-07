# ISU Qatalog — Design System

> Single source of truth for brand, tokens, components, and the Figma ↔ code pipeline.

---

## 1. Token Architecture

```
src/tokens/
├── tokens.json     ← canonical token definitions (Figma-importable)
└── index.ts        ← TypeScript constants for JS usage
src/index.css       ← CSS custom properties derived from tokens.json
```

### How it works

| Layer | File | Purpose |
|-------|------|---------|
| **Source** | `tokens.json` | Platform-agnostic definitions. This is the file you sync with Figma (via Tokens Studio or Style Dictionary). |
| **CSS vars** | `index.css` `:root` block | Every token becomes a `--color-*`, `--radius-*`, `--shadow-*`, etc. Tailwind `@theme` maps these into utility classes. |
| **TS constants** | `tokens/index.ts` | For JS-only contexts (motion config, inline styles). Components should prefer `var(--…)` in class strings. |

### Changing a token

1. Update the value in `tokens.json`.
2. Mirror the change in `index.css` (`:root` block) and `tokens/index.ts`.
3. Every component that references `var(--…)` picks it up automatically — no find-and-replace.

---

## 2. Color System

### Brand

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-cardinal` | `#C8102E` | Primary actions, links, active states |
| `--color-brand-cardinal-hover` | `#A60C26` | Cardinal hover/pressed |
| `--color-brand-cardinal-light` | `#FEF2F2` | Cardinal tinted backgrounds |
| `--color-brand-gold` | `#F1BE48` | Secondary accent, highlights |
| `--color-brand-gold-hover` | `#E0AC30` | Gold hover/pressed |
| `--color-brand-dark` | `#1F1F1F` | Headings, logo text, body text |

### Neutral

Full gray scale from `--color-neutral-50` to `--color-neutral-900` (follows Tailwind gray convention).

### Semantic

| Token | Value | Usage |
|-------|-------|-------|
| `--color-error` / `--color-error-light` | `#EF4444` / `#FEF2F2` | Form errors, destructive |
| `--color-success` / `--color-success-light` | `#22C55E` / `#F0FDF4` | Confirmation, positive |
| `--color-warning` / `--color-warning-light` | `#F59E0B` / `#FFFBEB` | Warnings |
| `--color-info` / `--color-info-light` | `#3B82F6` / `#EFF6FF` | Informational |

### Surface & Border

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface-page` | `#FFFFFF` | Page background |
| `--color-surface-card` | `rgba(255,255,255,0.60)` | Glassmorphic card bg |
| `--color-surface-subtle` | `#F3F4F6` | Secondary surfaces |
| `--color-border-default` | `#E5E7EB` | Default borders |
| `--color-border-hover` | `#D1D5DB` | Border on hover |
| `--color-border-focus` | `#C8102E` | Border on focus (= cardinal) |
| `--color-border-error` | `#EF4444` | Border for error fields |

---

## 3. Typography

### Font families

| Token | Value |
|-------|-------|
| `--font-sans` | `'Inter', ui-sans-serif, system-ui, sans-serif` |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` |

### Font sizes

| Token | Rem | Pixel | Usage |
|-------|-----|-------|-------|
| `--text-2xs` | 0.625 | 10 | Step labels, meta text |
| `--text-xs` | 0.6875 | 11 | Captions, error text, footer |
| `--text-sm` | 0.8125 | 13 | Labels, sub-labels |
| `--text-base` | 0.875 | 14 | Body text, inputs |
| `--text-md` | 1 | 16 | Panel headings (h3), sub-section titles |
| `--text-lg` | 1.25 | 20 | Card titles (h2) |
| `--text-xl` | 1.5 | 24 | Section headers |
| `--text-2xl` | 1.75 | 28 | Logo / brand text |

### Font weights

| Name | Value | Usage |
|------|-------|-------|
| Normal | 400 | Body text |
| Medium | 500 | Labels, links |
| Semibold | 600 | Card titles |
| Bold | 700 | Emphasis, buttons |
| Extrabold | 800 | Brand "ISU" text |

### Text hierarchy (section → card → body → meta)

Use a clear drop in size and weight so the eye moves from section title → card/panel title → content → supporting text.

| Level | Token | Weight | Use for |
|-------|-------|--------|--------|
| **Section** | `--text-xl` | Bold | Page section titles (e.g. "Graduation Timeline") |
| **Card / panel** | `--text-md` | Semibold | Card titles, panel headings (e.g. "Fall 2025") |
| **Body** | `--text-base` or `--text-sm` | Normal / Medium | Main content, course names, descriptions |
| **Supporting** | `--text-xs` | Normal | Captions, hints, secondary copy |
| **Meta / label** | `--text-2xs` | Semibold + uppercase | Status labels, step labels, "9 credits" |

Avoid using the same size for section title and card title; keep section (xl) > card (md) > body (sm/base) > meta (2xs).

---

## 4. Spacing & Sizing

All spacing uses Tailwind's default scale (`0.5` = 0.125rem through `16` = 4rem). Custom sizing tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--input-h-sm` | 32px | Small buttons |
| `--input-h-md` | 40px | Default inputs, buttons, selects |
| `--input-h-lg` | 48px | Large buttons |
| `--card-w-sm` | 440px | Default card max-width |
| `--card-w-md` | 520px | Wider card (signup) |
| `--card-w-lg` | 640px | Dashboard panels |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Subtle rounding |
| `--radius-md` | 8px | Badges |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Inputs, selects, chips |
| `--radius-2xl` | 20px | Auth cards, modals |
| `--radius-full` | 9999px | Pills, buttons |

---

## 6. Shadows

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Buttons |
| `--shadow-card` | Glass card |
| `--shadow-lg` | Elevated panels |
| `--shadow-dropdown` | Dropdown menus |

---

## 7. Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions (ripples, hover) |
| `--duration-normal` | 200ms | Default transitions |
| `--duration-slow` | 400ms | Draw-outline, page entrance |
| `--duration-slower` | 500ms | Progress bar animation |
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Enter/appear |
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy interactions |

---

## 8. Component Inventory

All components live in `src/components/` and reference tokens via `var(--…)`.

| Component | Path | Variants |
|-----------|------|----------|
| **Button** | `ui/Button.tsx` | `primary` · `secondary` · `outline` · `ghost` · `link` · `draw-outline` × sizes `sm` · `md` · `lg` |
| **Input** | `ui/Input.tsx` | Text, email, password (with toggle) + error state |
| **Select** | `ui/Select.tsx` | Custom dropdown matching input styling + error state |
| **AuthLayout** | `layouts/AuthLayout.tsx` | Optional progress bar (`step/totalSteps`), back button (`onBack`), title/subtitle |
| **DashboardLayout** | `layouts/DashboardLayout.tsx` | Sidebar nav, centralized search bar, gradient backdrop, responsive (mobile drawer) |

### Component conventions

- All form elements share `h-[var(--input-h-md)]`, `rounded-[var(--radius-xl)]`, `border-[var(--color-border-default)]`.
- Focus ring: `ring-4 ring-[var(--color-brand-cardinal)]/5`, border becomes `var(--color-border-focus)`.
- Error state: border becomes `var(--color-border-error)]`, helper text uses `var(--color-error)`.
- Labels: `text-[var(--text-sm)]`, `font-medium`, `text-[var(--color-neutral-700)]`.
- Error helper: `text-[var(--text-xs)]`, `font-medium`, `text-[var(--color-error)]`.

---

## 9. Figma ↔ Code Pipeline

### Recommended setup

1. **Figma Tokens Studio** (free plugin):
   - Import `tokens.json` directly into Tokens Studio.
   - Every color, size, radius, and shadow maps 1:1 to your Figma styles.
   - When you update a token in Figma, export the JSON and overwrite `tokens.json`.

2. **Sync flow**:

   ```
   ┌──────────┐     export JSON      ┌──────────────┐     CSS vars + TS     ┌────────────┐
   │  Figma   │  ─────────────────►  │ tokens.json  │  ──────────────────► │  Code      │
   │  (design)│  ◄─────────────────  │ (git repo)   │                      │  (runtime) │
   └──────────┘     import JSON      └──────────────┘                      └────────────┘
   ```

3. **Optional: Style Dictionary** — if the project scales, add a build step:
   ```bash
   npx style-dictionary build
   ```
   This auto-generates `index.css` `:root` vars and `tokens/index.ts` from `tokens.json`.
   For now the manual approach (3 files in sync) is simpler and sufficient.

### Naming convention

Tokens follow a **category → group → variant** pattern:

```
--color-brand-cardinal
--color-neutral-500
--color-border-focus
--radius-xl
--shadow-card
--duration-normal
--input-h-md
--card-w-sm
```

This maps directly to Figma Tokens Studio's group hierarchy.

---

## 10. Rules for Contributors

1. **Never hardcode hex values** in components — always use `var(--…)` or the TS `tokens` import.
2. **New colors** must be added to all three layers: `tokens.json` → `index.css` → `tokens/index.ts`.
3. **New components** must follow the existing pattern (forwardRef, `cn()` merging, token-based styling).
4. **Tailwind classes** that reference brand values should go through `@theme` mapping (e.g. `bg-isu-cardinal`).
5. **Motion** values used in `motion`/Framer props should import from `tokens/index.ts`.

---

## 11. Quick Reference — CSS Variable Cheat Sheet

```css
/* Colors */
var(--color-brand-cardinal)
var(--color-brand-gold)
var(--color-brand-dark)
var(--color-neutral-{50–900})
var(--color-error)
var(--color-success)
var(--color-surface-card)
var(--color-border-default)
var(--color-border-focus)

/* Typography */
var(--font-sans)
var(--text-{2xs|xs|sm|base|md|lg|xl|2xl})

/* Sizing */
var(--radius-{sm|md|lg|xl|2xl|full})
var(--input-h-{sm|md|lg})
var(--card-w-{sm|md|lg})

/* Effects */
var(--shadow-{sm|card|lg|dropdown})
var(--duration-{fast|normal|slow|slower})
var(--ease-{default|out|spring})
```

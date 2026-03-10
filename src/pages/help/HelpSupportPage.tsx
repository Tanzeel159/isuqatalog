import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PageSearchEntry } from '@/lib/searchTypes';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Bug,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { fadeUp, staggerContainer } from '@/lib/motion';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Help Search', text: 'What do you need help with? AI-powered contextual help search.' },
  { section: 'Getting Started', text: 'Getting started with Catalog, AI Planner, Schedule, and Social discussions.' },
  { section: 'FAQ', text: 'How does AI recommend courses? Why is a course greyed out? How do I share a plan? Saved versus Planned.' },
  { section: 'Contact & Feedback', text: 'Report a bug. Contact advisor. Submit feedback on course data quality.' },
];

const GUIDES = [
  {
    title: 'Browse the Catalog',
    desc: 'Learn how to explore courses, compare categories, and save options for later.',
    icon: BookOpen,
    to: '/catalog',
  },
  {
    title: 'Use the AI Planner',
    desc: 'Generate semester plans, compare tradeoffs, and understand AI reasoning.',
    icon: Sparkles,
    to: '/planner',
  },
  {
    title: 'Build Your Schedule',
    desc: 'Move from planned courses into a practical weekly schedule with conflict awareness.',
    icon: CalendarDays,
    to: '/schedule',
  },
  {
    title: 'Use the Social Layer',
    desc: 'Join course discussions, share plans, and follow up on advisor feedback.',
    icon: Users,
    to: null,
  },
];

const FAQS = [
  {
    question: 'How does the AI recommend courses?',
    answer:
      `The AI builds recommendations using three sources: your declared major and degree requirements, your completed course history, and the interests you selected during onboarding. It cross-references these against the full course catalog, factoring in workload scores, assessment methods, and prerequisite chains, to surface courses that fit where you are academically and where you're trying to go.\n\nEach recommendation includes a "Why this was recommended" explanation so you always know the reasoning. The AI will never suggest courses outside your major unless you explicitly ask it to explore minors or electives.`,
  },
  {
    question: 'Why is a course greyed out in my planner?',
    answer:
      `A course appears greyed out for one of two reasons. First, it may have a time conflict with a course already in your schedule, and the planner automatically filters these to prevent double-booking. Second, you may not have completed the required prerequisite.\n\nHover over any greyed-out course to see the specific reason. If it's a prerequisite issue, the AI will suggest alternative courses in the same requirement category that you're currently eligible to take.`,
  },
  {
    question: 'How do I share my plan with my advisor?',
    answer:
      `Once you've built a semester plan in the Schedule Planner, use the "Share with Advisor" button at the top of your schedule view. This gives your academic advisor a secure, read-only link to your saved plan, with no email or external tools needed.\n\nYour advisor can leave comments and an official approval status directly on the plan inside Qatalog. You'll receive a notification when they've reviewed it. Sharing a plan does not automatically register you for courses, enrollment still happens through ISU's official registration system.`,
  },
  {
    question: "What's the difference between Saved and Planned courses?",
    answer:
      `Saved means you've bookmarked a course from the catalog that you're interested in, think of it as a wishlist. Saved courses don't affect your schedule or degree audit in any way. Planned means you've added a course to a specific semester in your Schedule Planner.\n\nThe AI actively checks planned courses for conflicts, prerequisite violations, and graduation requirement coverage. The intended flow is: browse the catalog, save courses you like, move the best ones into your Planner, confirm with your advisor, then enroll through ISU's registration portal.`,
  },
];

export default function HelpSupportPage() {
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0]?.question ?? null);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredGuides = useMemo(() => {
    if (!normalizedQuery) return GUIDES;
    return GUIDES.filter((guide) =>
      `${guide.title} ${guide.desc}`.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return FAQS;
    return FAQS.filter((faq) =>
      `${faq.question} ${faq.answer}`.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const bestFaqMatch = normalizedQuery ? filteredFaqs[0] : null;

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden px-6 py-6">
          <div className="flex items-center gap-2 text-[var(--color-neutral-500)] mb-3">
            <HelpCircle className="w-4 h-4" />
            <span className="text-[var(--text-sm)] font-semibold">Help & Support</span>
          </div>
          <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-neutral-900)]">
            What do you need help with?
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-2 max-w-2xl">
            Start with contextual help before digging through docs. Qatalog should explain itself.
          </p>
          <div className="mt-5 rounded-2xl border border-[var(--color-border-default)] bg-white/70 px-4 py-3 flex items-center gap-3">
            <Search className="w-4 h-4 text-[var(--color-neutral-400)] shrink-0" />
            <input
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                const match = FAQS.find((faq) =>
                  `${faq.question} ${faq.answer}`.toLowerCase().includes(next.trim().toLowerCase()),
                );
                if (next.trim() && match) setOpenFaq(match.question);
              }}
              placeholder="Ask a question like “Why is this course unavailable?”"
              className="w-full bg-transparent text-[var(--text-sm)] text-[var(--color-neutral-700)] placeholder:text-[var(--color-neutral-400)] outline-none"
            />
          </div>
          {normalizedQuery && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[var(--text-xs)]">
              <span className="rounded-full bg-[var(--color-brand-cardinal)]/8 text-[var(--color-brand-cardinal)] px-2.5 py-1 font-semibold">
                {filteredGuides.length} guide match{filteredGuides.length !== 1 ? 'es' : ''}
              </span>
              <span className="rounded-full bg-[var(--color-info)]/8 text-[var(--color-info)] px-2.5 py-1 font-semibold">
                {filteredFaqs.length} FAQ match{filteredFaqs.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
          {bestFaqMatch && (
            <div className="mt-4 rounded-2xl border border-[var(--color-brand-cardinal)]/15 bg-[var(--color-brand-cardinal)]/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-cardinal)]">
                Best Match
              </p>
              <button
                type="button"
                onClick={() => setOpenFaq(bestFaqMatch.question)}
                className="mt-1 text-left"
              >
                <span className="text-[var(--text-sm)] font-semibold text-[var(--color-neutral-900)]">
                  {bestFaqMatch.question}
                </span>
              </button>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          <div>
            <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Getting Started</h2>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
              Short walkthroughs for the core workflows students use most.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuides.map(({ title, desc, icon: Icon, to }) => (
              <div key={title} className="glass-panel rounded-2xl overflow-hidden px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)]">{title}</h3>
                    <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">{desc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
                  </div>
                </div>
                {to ? (
                  <Link
                    to={to}
                    className="mt-4 text-[var(--text-sm)] font-semibold text-[var(--color-brand-cardinal)] inline-flex items-center gap-1.5 hover:underline"
                  >
                    Open guide
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="mt-4 text-[var(--text-sm)] font-medium text-[var(--color-neutral-400)] inline-flex items-center gap-1.5">
                    Guide coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
          {normalizedQuery && filteredGuides.length === 0 && (
            <div className="rounded-2xl border border-[var(--color-border-default)]/60 bg-[var(--color-neutral-50)]/70 px-5 py-4 text-[var(--text-sm)] text-[var(--color-neutral-500)]">
              No getting started guides matched your search.
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
            <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">FAQ</h2>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
              The questions students tend to ask most while planning and registering.
            </p>
          </div>
          <div className="divide-y divide-[var(--color-border-default)]/40">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.question;
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--color-neutral-50)]/70 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-800)]">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-[var(--color-neutral-400)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pr-10">
                      <div className="rounded-xl bg-[var(--color-neutral-50)]/70 border border-[var(--color-border-default)]/40 px-4 py-3 space-y-3">
                        {faq.answer.split('\n\n').map((paragraph) => (
                          <p key={paragraph} className="text-[var(--text-sm)] leading-6 text-[var(--color-neutral-600)]">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {normalizedQuery && filteredFaqs.length === 0 && (
            <div className="px-6 py-4 border-t border-[var(--color-border-default)]/40 text-[var(--text-sm)] text-[var(--color-neutral-500)]">
              No FAQ answers matched your search. Try terms like `planner`, `advisor`, `saved`, or `AI`.
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl overflow-hidden px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center mb-4">
              <Bug className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
            </div>
            <h3 className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)]">Report a bug</h3>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
              Flag broken data, planner issues, or interface bugs.
            </p>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
            </div>
            <h3 className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)]">Contact your advisor</h3>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
              Share academic concerns or ask for plan review from within the system.
            </p>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-cardinal)]/8 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-[var(--color-brand-cardinal)]" />
            </div>
            <h3 className="text-[var(--text-base)] font-bold text-[var(--color-neutral-900)]">Feedback & data quality</h3>
            <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
              Help improve course data, recommendation accuracy, and student-facing guidance.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

import { useState } from 'react';
import type { PageSearchEntry } from '@/lib/searchTypes';
import { motion } from 'motion/react';
import {
  Bell,
  Brain,
  Globe,
  Lock,
  Mail,
  Monitor,
  Shield,
  UserCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { fadeUp, staggerContainer } from '@/lib/motion';

export const SEARCH_ENTRIES: PageSearchEntry[] = [
  { section: 'Account', text: 'Account settings. Name. Qatalog ID. Email. Password change. NetID SSO connection.' },
  { section: 'AI Preferences', text: 'AI preferences. Course recommendations. Study plan generation. Data privacy. Anonymize exports.' },
  { section: 'Notifications', text: 'Notifications. Registration deadlines. Advisor comments. Discussion replies. Seat availability changes.' },
  { section: 'Accessibility & Display', text: 'Accessibility and display. Dark mode. Font size. Language preference.' },
];

function SettingRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="pr-6">
        <p className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-800)]">{label}</p>
        <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [courseRecs, setCourseRecs] = useState(true);
  const [studyPlan, setStudyPlan] = useState(true);
  const [noTraining, setNoTraining] = useState(true);
  const [anonymize, setAnonymize] = useState(false);

  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [advisorComments, setAdvisorComments] = useState(true);
  const [discussionReplies, setDiscussionReplies] = useState(true);
  const [seatChanges, setSeatChanges] = useState(true);

  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [englishUi, setEnglishUi] = useState(true);

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        <motion.div variants={fadeUp}>
          <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-neutral-900)]">Settings</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-neutral-500)] mt-1">
            Configure how Qatalog behaves for you.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
            <UserCircle className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Account</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {[
              { label: 'Name', value: user?.name || 'Student Name' },
              { label: 'Qatalog ID', value: 'ISU-HCI-24017' },
              { label: 'Email', value: user?.email || 'student@iastate.edu' },
              { label: 'NetID SSO', value: 'Connected to ISU NetID' },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-4 border-b even:border-l border-[var(--color-border-default)]/50">
                <p className="text-[10px] font-bold text-[var(--color-neutral-400)] uppercase tracking-[0.12em]">{label}</p>
                <p className="text-[var(--text-base)] font-semibold text-[var(--color-neutral-900)] mt-1.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 flex flex-wrap gap-3 bg-[var(--color-neutral-50)]/40">
            <Button variant="outline" size="sm">
              <Mail className="w-3.5 h-3.5" />
              Change email
            </Button>
            <Button variant="outline" size="sm">
              <Lock className="w-3.5 h-3.5" />
              Change password
            </Button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
            <Brain className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
            <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">AI Preferences</h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="Enable AI assistance"
              desc="Turn AI-powered planning and support features on across the portal."
              checked={aiEnabled}
              onChange={setAiEnabled}
            />
            <div className="divide-y divide-[var(--color-border-default)]/40">
              <SettingRow
                label="Course recommendations"
                desc="Use your academic history and interests to suggest relevant courses."
                checked={courseRecs}
                onChange={setCourseRecs}
                disabled={!aiEnabled}
              />
              <SettingRow
                label="Study plan generation"
                desc="Allow AI to generate semester plan options from your profile and constraints."
                checked={studyPlan}
                onChange={setStudyPlan}
                disabled={!aiEnabled}
              />
              <SettingRow
                label="Do not use my data for training"
                desc="Keep your academic data out of external model training workflows."
                checked={noTraining}
                onChange={setNoTraining}
              />
              <SettingRow
                label="Anonymize data exports"
                desc="Remove personal identifiers before external AI or analytics exports."
                checked={anonymize}
                onChange={setAnonymize}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
              <Bell className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
              <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Notifications</h3>
            </div>
            <div className="px-6 divide-y divide-[var(--color-border-default)]/40">
              <SettingRow
                label="Registration deadline alerts"
                desc="Get reminded before registration windows and add/drop deadlines."
                checked={deadlineAlerts}
                onChange={setDeadlineAlerts}
              />
              <SettingRow
                label="Advisor comments on plans"
                desc="Notify me when an advisor leaves feedback on a shared plan."
                checked={advisorComments}
                onChange={setAdvisorComments}
              />
              <SettingRow
                label="Discussion thread replies"
                desc="Alert me when someone replies in a course discussion thread."
                checked={discussionReplies}
                onChange={setDiscussionReplies}
              />
              <SettingRow
                label="Seat availability changes"
                desc="Track seat openings and closures for saved courses."
                checked={seatChanges}
                onChange={setSeatChanges}
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-[var(--color-border-default)]">
              <Monitor className="w-4 h-4 text-[var(--color-brand-cardinal)]" />
              <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-neutral-900)]">Accessibility & Display</h3>
            </div>
            <div className="px-6 divide-y divide-[var(--color-border-default)]/40">
              <SettingRow
                label="Dark mode"
                desc="Switch to a darker interface theme when available."
                checked={darkMode}
                onChange={setDarkMode}
              />
              <SettingRow
                label="Larger text"
                desc="Increase interface text size for easier reading."
                checked={largeText}
                onChange={setLargeText}
              />
              <SettingRow
                label="English interface"
                desc="Use English as the primary UI language."
                checked={englishUi}
                onChange={setEnglishUi}
              />
            </div>
            <div className="px-6 py-4 bg-[var(--color-neutral-50)]/40 border-t border-[var(--color-border-default)]/40">
              <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-neutral-500)]">
                <Shield className="w-3.5 h-3.5" />
                Accessibility and language preferences matter for international and multi-context student workflows.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

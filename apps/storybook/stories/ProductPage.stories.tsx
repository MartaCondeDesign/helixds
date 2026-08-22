import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Badge,
} from '@helix-ds/core';
import {
  IconBolt, IconShieldCheck, IconUsers, IconCheck, IconArrowRight,
  IconMail, IconLock, IconBuilding, IconUser,
} from '@tabler/icons-react';

const meta: Meta = {
  title: 'Pages/CreateWorkspace',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full product page demonstrating all form components in a realistic workspace creation flow.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const TEAM_SIZES = [
  { value: 'solo',   label: 'Just me' },
  { value: '2-10',   label: '2–10 people' },
  { value: '11-50',  label: '11–50 people' },
  { value: '51-200', label: '51–200 people' },
  { value: '200+',   label: 'More than 200' },
];

const USE_OPTIONS = [
  { value: 'design', label: 'Design & Prototyping', description: 'Figma, component libraries, design tokens' },
  { value: 'eng',    label: 'Engineering',           description: 'Component development, code review' },
  { value: 'both',   label: 'Design + Engineering',  description: 'Full design-to-code workflow' },
];

function WorkspacePage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', workspace: '',
    about: '', teamSize: '', primaryUse: '',
    updates: true, terms: false,
  });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name)      next.name      = 'Full name is required';
    if (!form.email || !form.email.includes('@')) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!form.workspace) next.workspace = 'Workspace name is required';
    if (!form.teamSize)  next.teamSize  = 'Select your team size';
    if (!form.primaryUse) next.primaryUse = 'Choose your primary use case';
    if (!form.terms)     next.terms     = 'You must accept the terms to continue';

    if (Object.keys(next).length > 0) { setErrors(next); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--helix-color-fill-page)',
        padding: 'var(--helix-primitive-spacing-150)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'var(--helix-primitive-spacing-100)', textAlign: 'center', maxWidth: 400,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--helix-color-fill-success-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--helix-color-text-success)',
          }}>
            <IconCheck size={28} />
          </div>
          <h1 style={{ margin: 0, fontSize: 'var(--helix-primitive-fontSize-2xl)', fontWeight: 'var(--helix-primitive-fontWeight-bold)', color: 'var(--helix-color-text-neutral)' }}>
            Workspace created!
          </h1>
          <p style={{ margin: 0, color: 'var(--helix-color-text-neutral-light)' }}>
            Welcome to <strong>{form.workspace}</strong>. You're all set to start building.
          </p>
          <Button variant="primary" iconEnd={<IconArrowRight size={16} />} onPress={() => setSubmitted(false)}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* ── Left panel: brand hero ──────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)',
        padding: '48px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: '#60a5fa', fontWeight: 700, fontSize: 18, marginBottom: 48,
          }}>
            <span style={{ fontSize: 24 }}>✦</span>
            <span>Helix</span>
          </div>

          <h1 style={{
            color: '#ffffff', fontSize: 36, fontWeight: 800, lineHeight: 1.2,
            letterSpacing: '-0.02em', margin: '0 0 16px',
          }}>
            Ship great UI,<br />every sprint.
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 16, lineHeight: 1.6, margin: '0 0 48px', maxWidth: 360 }}>
            A design system built for speed. Tokens, contracts, and AI context baked in from day one.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: <IconBolt size={18} />,        label: 'AI-ready from day one',        desc: 'Agents that know your components, tokens, and patterns' },
              { icon: <IconShieldCheck size={18} />, label: 'WCAG 2.2 AA by default',       desc: 'Accessibility built into every contract, not bolted on' },
              { icon: <IconUsers size={18} />,       label: 'Contract-first components',     desc: 'JSON contracts as the single source of truth' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(96,165,250,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#60a5fa', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{f.label}</div>
                  <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <blockquote style={{
          borderLeft: '3px solid #3b82f6',
          paddingLeft: 16, margin: 0,
        }}>
          <p style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
            "We cut design-to-code time in half. The AI context alone is worth the switch."
          </p>
          <footer style={{ color: '#64748b', fontSize: 13 }}>
            Sara M. — Lead Designer, Lumino
          </footer>
        </blockquote>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--helix-color-fill-page)',
        padding: '48px 56px',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 'var(--helix-primitive-fontSize-2xl)',
              fontWeight: 'var(--helix-primitive-fontWeight-bold)',
              color: 'var(--helix-color-text-neutral)',
              margin: '0 0 4px',
            }}>
              Create your workspace
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-light)' }}>
              Already have an account?{' '}
              <a href="#" style={{ color: 'var(--helix-color-text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                Sign in
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-125)' }}>

            {/* Section: personal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
              <h3 style={{
                margin: 0, fontSize: 'var(--helix-primitive-fontSize-xs)',
                fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                color: 'var(--helix-color-text-neutral-lightest)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Personal info
              </h3>

              <Input
                label="Full name" required fullWidth
                icon={<IconUser size={16} />}
                placeholder="Sara Martinez"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                invalid={!!errors.name}
                errorMessage={errors.name}
              />
              <Input
                label="Work email" type="email" required fullWidth
                icon={<IconMail size={16} />}
                placeholder="sara@company.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                invalid={!!errors.email}
                errorMessage={errors.email}
              />
              <Input
                label="Password" type="password" required fullWidth
                icon={<IconLock size={16} />}
                description="Minimum 8 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                invalid={!!errors.password}
                errorMessage={errors.password}
              />
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--helix-color-border-neutral-light)', margin: 0 }} />

            {/* Section: workspace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
              <h3 style={{
                margin: 0, fontSize: 'var(--helix-primitive-fontSize-xs)',
                fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                color: 'var(--helix-color-text-neutral-lightest)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Workspace
              </h3>

              <Input
                label="Workspace name" required fullWidth
                icon={<IconBuilding size={16} />}
                placeholder="Acme Design System"
                description="This will be your team's shared workspace"
                value={form.workspace}
                onChange={e => set('workspace', e.target.value)}
                invalid={!!errors.workspace}
                errorMessage={errors.workspace}
              />

              <Textarea
                label="What are you building?" fullWidth
                placeholder="Tell us about your project, team, or design system goals…"
                rows={3}
                maxLength={280}
                showCount
                resize="none"
                value={form.about}
                onChange={e => set('about', e.target.value)}
              />

              <Select
                label="Team size" required fullWidth
                placeholder="Select team size"
                options={TEAM_SIZES}
                value={form.teamSize}
                onChange={v => set('teamSize', v)}
                invalid={!!errors.teamSize}
                errorMessage={errors.teamSize}
              />

              <RadioGroup
                label="Primary use" required
                options={USE_OPTIONS}
                value={form.primaryUse}
                onChange={v => set('primaryUse', v)}
                invalid={!!errors.primaryUse}
                errorMessage={errors.primaryUse}
              />
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--helix-color-border-neutral-light)', margin: 0 }} />

            {/* Section: preferences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
              <h3 style={{
                margin: 0, fontSize: 'var(--helix-primitive-fontSize-xs)',
                fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
                color: 'var(--helix-color-text-neutral-lightest)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Preferences
              </h3>

              <Switch
                label="Product updates & changelog"
                description="Weekly email digest with new features and DS releases"
                checked={form.updates}
                onChange={v => set('updates', v)}
              />

              <Checkbox
                label="I agree to the Terms of Service and Privacy Policy"
                checked={form.terms}
                onChange={v => set('terms', v)}
                invalid={!!errors.terms}
                errorMessage={errors.terms}
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              fullWidth
              loading={loading}
              iconEnd={!loading ? <IconArrowRight size={16} /> : undefined}
            >
              {loading ? 'Creating workspace…' : 'Create workspace'}
            </Button>

            <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--helix-primitive-fontSize-xs)', color: 'var(--helix-color-text-neutral-lightest)' }}>
              By creating a workspace you agree to our{' '}
              <a href="#" style={{ color: 'var(--helix-color-text-neutral-light)' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--helix-color-text-neutral-light)' }}>Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export const CreateWorkspace: Story = {
  render: () => <WorkspacePage />,
  parameters: {
    docs: {
      description: {
        story: 'Full-page form demo. Uses all 8 Helix form components in a realistic workspace onboarding flow.',
      },
    },
  },
};

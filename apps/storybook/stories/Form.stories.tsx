import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Badge,
} from '@helixds/react';
import {
  IconBolt, IconShieldCheck, IconUsers, IconCheck, IconArrowRight,
  IconMail, IconLock, IconBuilding, IconUser,
} from '@tabler/icons-react';

const meta: Meta = {
  title: 'Pages/Form',
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
          <Button variant="primary" iconEnd={IconArrowRight} onClick={() => setSubmitted(false)}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    // Exactly one screen tall — like every Pages/* template: the form scrolls inside its own column,
    // the page itself never grows past the viewport.
    <div style={{
      height: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Brand panel colors are primitives on purpose: the panel is dark in BOTH themes, and semantic
          tokens flip with the theme (text-neutral would turn dark-on-dark in light mode). Every text
          pair is AA against both gradient ends (#0f172a top, #1e3a8a bottom) — gray-300 for the small
          supporting text, since gray-500 was 2.18:1 at the bottom. */}
      {/* ── Left panel: brand hero ──────────────────────────────────── */}
      {/* Fills the full screen-tall row, testimonial pinned to the bottom. */}
      <div style={{
        background: 'linear-gradient(160deg, var(--helix-primitive-color-gray-900) 0%, var(--helix-primitive-color-blue-900) 100%)',
        padding: 'var(--helix-spacing-layout-l) var(--helix-spacing-layout-xl)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minHeight: 0,
        overflowY: 'auto',
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)',
            color: 'var(--helix-primitive-color-blue-400)', fontWeight: 700, fontSize: 18, marginBottom: 'var(--helix-spacing-layout-l)',
          }}>
            <span style={{ fontSize: 24 }}>✦</span>
            <span>Helix</span>
          </div>

          <h1 style={{
            color: 'var(--helix-primitive-color-gray-0)', fontSize: 36, fontWeight: 800, lineHeight: 1.2,
            letterSpacing: '-0.02em', margin: '0 0 var(--helix-spacing-m)',
          }}>
            Ship great UI,<br />every sprint.
          </h1>
          <p style={{ color: 'var(--helix-primitive-color-blue-300)', fontSize: 16, lineHeight: 1.6, margin: '0 0 var(--helix-spacing-layout-l)', maxWidth: 360 }}>
            A design system built for speed. Tokens, contracts, and AI context baked in from day one.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-l)' }}>
            {[
              { icon: <IconBolt size={18} />,        label: 'AI-ready from day one',        desc: 'Agents that know your components, tokens, and patterns' },
              { icon: <IconShieldCheck size={18} />, label: 'WCAG 2.2 AA by default',       desc: 'Accessibility built into every contract, not bolted on' },
              { icon: <IconUsers size={18} />,       label: 'Contract-first components',     desc: 'JSON contracts as the single source of truth' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 'var(--helix-spacing-s)', alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'color-mix(in srgb, var(--helix-primitive-color-blue-400) 15%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--helix-primitive-color-blue-400)', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: 'var(--helix-primitive-color-gray-200)', fontWeight: 600, fontSize: 14, marginBottom: 'var(--helix-spacing-3xs)' }}>{f.label}</div>
                  <div style={{ color: 'var(--helix-primitive-color-gray-300)', fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <blockquote style={{
          borderLeft: '3px solid var(--helix-primitive-color-blue-500)',
          paddingLeft: 'var(--helix-spacing-m)', margin: 0,
        }}>
          <p style={{ color: 'var(--helix-primitive-color-gray-300)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, margin: '0 0 var(--helix-spacing-xs)' }}>
            "We cut design-to-code time in half. The AI context alone is worth the switch."
          </p>
          <footer style={{ color: 'var(--helix-primitive-color-gray-300)', fontSize: 13 }}>
            Sara M. — Lead Designer, Lumino
          </footer>
        </blockquote>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--helix-color-fill-page)',
        padding: 'var(--helix-spacing-layout-l) var(--helix-spacing-layout-xl)',
        overflowY: 'auto',
        minHeight: 0, // lets the grid item shrink to the row so overflowY actually scrolls
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ marginBottom: 'var(--helix-spacing-xl)' }}>
            <h2 style={{
              fontSize: 'var(--helix-primitive-fontSize-2xl)',
              fontWeight: 'var(--helix-primitive-fontWeight-bold)',
              color: 'var(--helix-color-text-neutral)',
              margin: '0 0 var(--helix-spacing-2xs)',
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

          {/* Between blocks (a labeled section of fields, or the divider that separates one from
              the next) is 24px (primitive.spacing.150) — see .ai/maps/patterns/form-field-spacing.md. */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-150)' }}>

            {/* Section: personal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-primitive-spacing-100)' }}>
              {/* heading-m-bold — the block-title style (.ai/maps/patterns/form-field-spacing.md),
                  16px below it to the first field, same as the field-to-field gap. */}
              <h3 style={{
                margin: 0,
                fontSize: 'var(--helix-textStyle-heading-m-bold-fontSize)',
                fontWeight: 'var(--helix-textStyle-heading-m-bold-fontWeight)',
                lineHeight: 'var(--helix-textStyle-heading-m-bold-lineHeight)',
                color: 'var(--helix-color-text-neutral)',
              }}>
                Personal info
              </h3>

              <Input
                label="Full name" required fullWidth
                icon={IconUser}
                placeholder="Sara Martinez"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                invalid={!!errors.name}
                errorMessage={errors.name}
              />
              <Input
                label="Work email" type="email" required fullWidth
                icon={IconMail}
                placeholder="sara@company.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                invalid={!!errors.email}
                errorMessage={errors.email}
              />
              <Input
                label="Password" type="password" required fullWidth
                icon={IconLock}
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
                margin: 0,
                fontSize: 'var(--helix-textStyle-heading-m-bold-fontSize)',
                fontWeight: 'var(--helix-textStyle-heading-m-bold-fontWeight)',
                lineHeight: 'var(--helix-textStyle-heading-m-bold-lineHeight)',
                color: 'var(--helix-color-text-neutral)',
              }}>
                Workspace
              </h3>

              <Input
                label="Workspace name" required fullWidth
                icon={IconBuilding}
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
                margin: 0,
                fontSize: 'var(--helix-textStyle-heading-m-bold-fontSize)',
                fontWeight: 'var(--helix-textStyle-heading-m-bold-fontWeight)',
                lineHeight: 'var(--helix-textStyle-heading-m-bold-lineHeight)',
                color: 'var(--helix-color-text-neutral)',
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
              isLoading={loading}
              iconEnd={IconArrowRight}
            >
              {loading ? 'Creating workspace…' : 'Create workspace'}
            </Button>

            <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--helix-primitive-fontSize-s)', color: 'var(--helix-color-text-neutral-lightest)' }}>
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

export const Form: Story = {
  render: () => <WorkspacePage />,
  parameters: {
    docs: {
      description: {
        story: 'Full-page form demo. Uses all 8 Helix form components in a realistic workspace onboarding flow.',
      },
    },
  },
};

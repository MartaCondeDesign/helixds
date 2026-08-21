import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

const meta: Meta = {
  title: 'Foundation/Motion',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// ── Duration ───────────────────────────────────────────────────────────────

const DURATIONS: { name: string; ms: string; token: string }[] = [
  { name: 'instant', ms: '0ms',   token: 'var(--helix-primitive-duration-instant)' },
  { name: 'fast',    ms: '80ms',  token: 'var(--helix-primitive-duration-fast)' },
  { name: 'base',    ms: '120ms', token: 'var(--helix-primitive-duration-base)' },
  { name: 'slow',    ms: '200ms', token: 'var(--helix-primitive-duration-slow)' },
  { name: 'slower',  ms: '300ms', token: 'var(--helix-primitive-duration-slower)' },
];

export const Duration: Story = {
  render: () => {
    const [active, setActive] = useState<string | null>(null);

    function toggle(name: string) {
      setActive(prev => prev === name ? null : name);
    }

    return (
      <div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--helix-color-text-neutral-light)' }}>
          Click each card to toggle it on/off. Each uses a different duration token.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {DURATIONS.map(d => {
            const on = active === d.name;
            return (
              <button
                key={d.name}
                onClick={() => toggle(d.name)}
                style={{
                  width: 140, height: 110,
                  borderRadius: 10, border: '2px solid',
                  borderColor: on ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-border-neutral)',
                  background: on ? 'var(--helix-color-fill-primary)' : 'var(--helix-color-fill-surface)',
                  color: on ? 'white' : 'var(--helix-color-text-neutral)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: `background ${d.token} var(--helix-primitive-easing-base),
                               border-color ${d.token} var(--helix-primitive-easing-base),
                               color ${d.token} var(--helix-primitive-easing-base)`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{d.name}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{d.ms}</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>{on ? 'on' : 'off'}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Click cards to toggle. Each card uses its own duration token — notice how fast `instant` is vs `slower`.' } },
  },
};

// ── Easing ─────────────────────────────────────────────────────────────────

const EASINGS: { name: string; curve: string }[] = [
  { name: 'base', curve: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  { name: 'in',   curve: 'cubic-bezier(0.4, 0, 1, 1)' },
  { name: 'out',  curve: 'cubic-bezier(0, 0, 0.2, 1)' },
];

export const Easing: Story = {
  render: () => {
    const [running, setRunning] = useState(false);
    const [tick,    setTick]    = useState(0);

    function play() {
      setTick(t => t + 1);
      setRunning(true);
      setTimeout(() => setRunning(false), 320);
    }

    return (
      <div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--helix-color-text-neutral-light)' }}>
          Press Play to animate all three at the same time. Same duration (<code>slower</code>), different easing.
        </p>
        <button
          onClick={play}
          style={{
            marginBottom: 24, padding: '8px 20px', borderRadius: 8,
            background: 'var(--helix-color-fill-primary)', color: 'white',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ▶ Play
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {EASINGS.map(e => (
            <div key={e.name}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: 'var(--helix-color-text-neutral)', marginBottom: 6 }}>
                easing-{e.name}
                <span style={{ fontWeight: 400, color: 'var(--helix-color-text-neutral-lightest)', marginLeft: 8 }}>{e.curve}</span>
              </div>
              <div style={{
                height: 40, borderRadius: 8, position: 'relative', overflow: 'hidden',
                background: 'var(--helix-color-fill-surface)',
                border: '1px solid var(--helix-color-border-neutral-light)',
              }}>
                <div
                  key={tick}
                  style={{
                    position: 'absolute',
                    top: 4, width: 32, height: 32, borderRadius: 6,
                    background: 'var(--helix-color-fill-primary)',
                    left: running ? 'calc(100% - 36px)' : 4,
                    transition: running
                      ? `left var(--helix-primitive-duration-slower) var(--helix-primitive-easing-${e.name})`
                      : 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'All three curves at the same duration. `base` = ease-in-out (most common). `in` = accelerates, feels snappy. `out` = decelerates, feels natural for elements entering the view.' } },
  },
};

// ── All tokens ─────────────────────────────────────────────────────────────

export const AllMotionTokens: Story = {
  render: () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)' }}>
          Duration
        </h3>
        {DURATIONS.map((d, i) => (
          <div key={d.name} style={{
            display: 'flex', gap: 24, alignItems: 'center', paddingBlock: 10,
            borderBottom: i < DURATIONS.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
          }}>
            <code style={{ fontSize: 12, color: 'var(--helix-color-text-primary)', width: 280, flexShrink: 0 }}>
              {d.token}
            </code>
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--helix-color-text-neutral-light)' }}>{d.ms}</span>
          </div>
        ))}
      </div>
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)' }}>
          Easing
        </h3>
        {EASINGS.map((e, i) => (
          <div key={e.name} style={{
            display: 'flex', gap: 24, alignItems: 'center', paddingBlock: 10,
            borderBottom: i < EASINGS.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
          }}>
            <code style={{ fontSize: 12, color: 'var(--helix-color-text-primary)', width: 280, flexShrink: 0 }}>
              {`var(--helix-primitive-easing-${e.name})`}
            </code>
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--helix-color-text-neutral-light)' }}>{e.curve}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

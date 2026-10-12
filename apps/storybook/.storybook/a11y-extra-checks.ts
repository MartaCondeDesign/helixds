// Accessibility checks axe can't do, run in the real browser on every story by test-runner.ts and counted by
// `pnpm verify:stable` under criterion 4 (stories + accessibility):
//
//   targetSize   WCAG 2.5.8 Target Size (Minimum, AA) — every interactive element is at least 24×24 px, or
//                has the spacing exception: a 24 px circle centred on it overlaps no other target. Inline
//                links inside running text are exempt, as the criterion allows.
//   focusVisible WCAG 2.4.7 Focus Visible (AA) — tabbing through the story with the real keyboard, each element
//                that receives focus must look different from the same element unfocused (pixel comparison
//                of a padded screenshot of it). Checked per theme: a ring can vanish against a dark page.
//   reflow       WCAG 1.4.10 Reflow (AA), on Layout/ and Pages/ stories — at 320 CSS px wide the story scrolls in one direction only: no
//                horizontal scroll, nothing pushed past the right edge. Tables and explicit horizontal
//                scrollers are exempt (two-dimensional content, as the criterion allows).
//
// A11Y_DEBUG_DIR=<dir> saves, per focus stop, the focused/unfocused crops it compared and what it measured —
// that's how a closed Modal whose buttons Tab still reached (invisible, opacity 0) was told apart from a
// broken check.
import type { Page } from 'playwright';

export type TargetIssue = { element: string; width: number; height: number };
export type FocusIssue = { element: string };
export type ReflowIssue = { element: string; overflowPx: number };

// The whole story document, not just #storybook-root: Menu, Toast and other overlays are portaled to <body>.
// Storybook's own hidden nodes (docs root, error overlays) have no box, so they are skipped.
const ROOT = 'body';
const INTERACTIVE = [
  'button', 'a[href]', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[role="tab"]',
  '[role="menuitem"]', '[role="option"]', '[role="slider"]', '[tabindex]:not([tabindex="-1"])',
].join(',');

export async function checkTargetSize(page: Page): Promise<TargetIssue[]> {
  return page.evaluate(({ root, selector }) => {
    const describe = (el: Element) => {
      const name = el.getAttribute('aria-label') || (el as HTMLElement).innerText?.trim().slice(0, 30) || el.getAttribute('name') || '';
      return `<${el.tagName.toLowerCase()}${el.getAttribute('role') ? ` role="${el.getAttribute('role')}"` : ''}>${name ? ` "${name}"` : ''}`;
    };
    // The box a pointer can hit: a visually hidden native input is clicked through its <label>.
    const hitBox = (el: Element): DOMRect | null => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const hidden = style.opacity === '0' || rect.width <= 1 || rect.height <= 1 || style.clipPath !== 'none';
      if (el instanceof HTMLInputElement && hidden) {
        const label = el.closest('label') ?? (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
        return label ? label.getBoundingClientRect() : null;
      }
      return rect.width && rect.height ? rect : null;
    };
    const container = document.querySelector(root);
    if (!container) return [];
    const targets = [...container.querySelectorAll(selector)].filter(el => {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || el.closest('[aria-hidden="true"], [inert]')) return false;
      if ((el as HTMLButtonElement).disabled) return false; // 2.5.8 applies to targets that can be activated
      // Inline exception: a link inside a sentence.
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && /\S/.test(el.parentElement.textContent?.replace(el.textContent ?? '', '') ?? '')) return false;
      return true;
    });
    // A target covered by something else at its centre (a toast stacked behind the front one, scaled down
    // until the stack is hovered open) can't be hit by a pointer in this state — not a size problem.
    const covered = (el: Element, box: DOMRect) => {
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      const label = el instanceof HTMLInputElement ? el.closest('label') : null;
      return !!hit && !el.contains(hit) && !(label && label.contains(hit)) && !hit.contains(el);
    };
    const boxes = targets.map(el => ({ el, box: hitBox(el) }))
      .filter((t): t is { el: Element; box: DOMRect } => !!t.box && !covered(t.el, t.box));
    const issues: { element: string; width: number; height: number }[] = [];
    for (const { el, box } of boxes) {
      if (box.width >= 24 && box.height >= 24) continue;
      // Spacing exception: a 24 px circle centred on the target touches no other target.
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      const crowded = boxes.some(o => {
        if (o.el === el || o.el.contains(el) || el.contains(o.el)) return false;
        const nx = Math.max(o.box.left, Math.min(cx, o.box.right));
        const ny = Math.max(o.box.top, Math.min(cy, o.box.bottom));
        return Math.hypot(cx - nx, cy - ny) < 12;
      });
      if (crowded) issues.push({ element: describe(el), width: Math.round(box.width), height: Math.round(box.height) });
    }
    return issues;
  }, { root: ROOT, selector: INTERACTIVE });
}

export async function checkFocusVisible(page: Page, maxStops = 12): Promise<FocusIssue[]> {
  const issues: FocusIssue[] = [];
  // Park the pointer: a story's play test can leave it over a control, and a hover style that looks like
  // the focus ring would hide the difference. This measures focus, not hover.
  await page.mouse.move(0, 0);
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
  await page.waitForTimeout(200);

  // Baselines first, with nothing focused: a padded crop of every focusable element. Comparing against these
  // (rather than blurring each element after focusing it) never disturbs the story — a speed dial or menu
  // that closes when focus leaves would otherwise change under the measurement.
  const candidates = await page.evaluate(root => {
    const els = [...(document.querySelector(root)?.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])') ?? [])];
    return els.flatMap(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return [];
      // Already open (a Select whose list is showing): its open state draws the same ring as focus by design,
      // so the unfocused crop isn't a neutral baseline — it can't be judged here, in either direction.
      if (el.getAttribute('aria-expanded') === 'true') return [];
      if (!el.dataset.a11yFocusId) el.dataset.a11yFocusId = String(Math.random()).slice(2);
      // Padded: rings are often drawn outside the box (outline-offset, box-shadow spread).
      return [{ id: el.dataset.a11yFocusId, clip: { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), width: r.width + 12, height: r.height + 12 } }];
    });
  }, ROOT);
  const baseline = new Map<string, { clip: { x: number; y: number; width: number; height: number }; png: Buffer }>();
  for (const c of candidates) baseline.set(c.id, { clip: c.clip, png: await page.screenshot({ clip: c.clip, animations: 'disabled' }) });

  const seen = new Set<string>();
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    const info = await page.evaluate(root => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || !document.querySelector(root)?.contains(el)) return null;
      const r = el.getBoundingClientRect();
      const name = el.getAttribute('aria-label') || el.innerText?.trim().slice(0, 30) || el.getAttribute('name') || '';
      return {
        id: el.dataset.a11yFocusId ?? null,
        label: `<${el.tagName.toLowerCase()}${el.getAttribute('role') ? ` role="${el.getAttribute('role')}"` : ''}>${name ? ` "${name}"` : ''}`,
        clip: { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), width: r.width + 12, height: r.height + 12 },
      };
    }, ROOT);
    if (!info) break;
    const key = info.id ?? info.label;
    if (seen.has(key)) break;
    seen.add(key);
    const base = info.id ? baseline.get(info.id) : undefined;
    // Only comparable if the element is where it was when the baseline was taken: something that appeared
    // or moved on focus (a menu opening) can't be compared pixel for pixel, so it isn't judged.
    const same = base && ['x', 'y', 'width', 'height'].every(k => Math.abs(base.clip[k as 'x'] - info.clip[k as 'x']) < 1);
    if (!base || !same) continue;
    const focused = await page.screenshot({ clip: base.clip, animations: 'disabled' });
    if (process.env.A11Y_DEBUG_DIR) {
      const fs = await import('fs');
      fs.mkdirSync(process.env.A11Y_DEBUG_DIR, { recursive: true });
      const story = new URL(page.url()).searchParams.get('id') ?? 'story';
      const tag = `${story}-${await page.evaluate(() => document.documentElement.dataset.theme)}-${i}`;
      fs.writeFileSync(`${process.env.A11Y_DEBUG_DIR}/${tag}-focused.png`, focused);
      fs.writeFileSync(`${process.env.A11Y_DEBUG_DIR}/${tag}-unfocused.png`, base.png);
    }
    if (focused.equals(base.png)) issues.push({ element: info.label });
  }
  return issues;
}

export async function checkReflow(page: Page): Promise<ReflowIssue[]> {
  const original = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForTimeout(300);
  const issues = await page.evaluate(root => {
    const out: { element: string; overflowPx: number }[] = [];
    const doc = document.documentElement;
    const exempt = (el: Element) => !!el.closest('table, [role="table"], [role="grid"]') ||
      [...ancestors(el)].some(a => ['auto', 'scroll'].includes(getComputedStyle(a).overflowX) && a !== doc && a !== document.body);
    function* ancestors(el: Element) { for (let a = el.parentElement; a; a = a.parentElement) yield a; }
    const width = doc.clientWidth;
    if (doc.scrollWidth > width + 1) {
      // Name what pushes past the edge — the outermost element, and never an SVG's insides (a <path>
      // says nothing; its icon does). Only non-exempt elements count: if all that overflows is a table or
      // an explicit horizontal scroller, the page passes (WCAG 1.4.10's two-dimensional exception).
      const seen = new Set<Element>();
      for (const el of document.querySelector(root)?.querySelectorAll('*') ?? []) {
        const box = el.closest('svg') ?? el;
        if (seen.has(box)) continue;
        const r = box.getBoundingClientRect();
        if (!(r.right > width + 1 && r.width > 0) || exempt(box)) continue;
        if ([...seen].some(s => s.contains(box))) continue;
        seen.add(box);
        const label = box.getAttribute('data-helix-part') ?? (typeof box.className === 'string' ? box.className.slice(0, 40) : '');
        out.push({ element: `<${box.tagName.toLowerCase()}${label ? ` ${label}` : ''}>`, overflowPx: Math.round(r.right - width) });
        if (out.length >= 5) break;
      }
    }
    return out;
  }, ROOT);
  if (original) await page.setViewportSize(original);
  await page.waitForTimeout(150);
  return issues;
}

// ── What a component APPLIES (not pass/fail) — recorded per story, aggregated into each contract's
// a11y.applied by `pnpm a11y` (scripts/a11y.ts). ──────────────────────────────────────────────────────

export type AppliedAria = { part: string; attribute: string; value: string };
export type AppliedContrast = { part: string; variant: string; ratio: number; fg: string; bg: string };
export type AppliedTarget = { part: string; variant: string; width: number; height: number };

/** Every role / aria-* attribute on a Helix part (or its descendants) in the story, as rendered right now. */
export async function collectAria(page: Page): Promise<AppliedAria[]> {
  return page.evaluate(root => {
    const out: { part: string; attribute: string; value: string }[] = [];
    for (const el of document.querySelector(root)?.querySelectorAll('*') ?? []) {
      const part = el.closest('[data-helix-part]')?.getAttribute('data-helix-part');
      if (!part) continue;
      for (const a of el.attributes) {
        if (a.name === 'role' || a.name.startsWith('aria-')) out.push({ part, attribute: a.name, value: a.value.slice(0, 60) });
      }
    }
    return out;
  }, ROOT);
}

/** axe's measured contrast for every text it checked (the passes, not just failures), per Helix part. */
export async function collectContrast(page: Page): Promise<AppliedContrast[]> {
  return page.evaluate(async root => {
    const axe = (window as unknown as { axe?: { run: (c: unknown, o: unknown) => Promise<any> } }).axe;
    if (!axe) return [];
    const r = await axe.run(document.querySelector(root), { runOnly: { type: 'rule', values: ['color-contrast'] } });
    const out: { part: string; variant: string; ratio: number; fg: string; bg: string }[] = [];
    for (const group of [r.passes, r.violations]) for (const rule of group) for (const node of rule.nodes) {
      const data = node.any?.[0]?.data;
      if (!data?.contrastRatio) continue;
      const el = document.querySelector(node.target[0]);
      const part = el?.closest('[data-helix-part]')?.getAttribute('data-helix-part');
      // variant/size of the instance it belongs to, so "5.16:1" reads as "primary: 5.16:1"
      const v = el?.closest('[data-variant], [data-size]');
      const variant = [v?.getAttribute('data-variant'), v?.getAttribute('data-size')].filter(Boolean).join(' ');
      if (part) out.push({ part, variant, ratio: Math.round(data.contrastRatio * 100) / 100, fg: data.fgColor, bg: data.bgColor });
    }
    // Icons are non-text content (WCAG 1.4.11, 3:1) — axe only measures text, so measure each visible icon's
    // color against the first opaque background behind it.
    const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const lum = (c: string) => { const [r, g, b] = parse(c).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
    const hex = (c: string) => '#' + parse(c).slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const bgOf = (el: Element | null): string => {
      for (let a = el; a; a = a.parentElement) { const bg = getComputedStyle(a).backgroundColor; const p = parse(bg); if (p.length && (p[3] === undefined || p[3] > 0.5)) return bg; }
      return 'rgb(255, 255, 255)';
    };
    for (const svg of document.querySelector(root)?.querySelectorAll('svg') ?? []) {
      // The icon's owner is the component around it (IconButton, Chip…), not Icon's own wrapper — unless the
      // story is Icon's own.
      const own = svg.closest('[data-helix-part]');
      const host = own?.getAttribute('data-helix-part') === 'icon-root' ? own.parentElement?.closest('[data-helix-part]') ?? own : own;
      const part = host?.getAttribute('data-helix-part');
      const r = svg.getBoundingClientRect();
      if (!part || !r.width || svg.closest('[aria-hidden="true"]:not(svg)') && !svg.closest('button, a, [role="button"]')) continue;
      // Disabled controls are exempt from contrast (WCAG 1.4.3/1.4.11), as axe does for text.
      if (svg.closest(':disabled, [aria-disabled="true"], [data-disabled]')) continue;
      // What is actually painted under the icon's centre — a positioned sibling (NavItem's current pill) or an
      // ancestor — not just its ancestors' backgrounds.
      const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).find(e => !svg.contains(e) && e !== svg && (() => { const p = parse(getComputedStyle(e).backgroundColor); return p.length && (p[3] === undefined || p[3] > 0.5); })());
      const fg = getComputedStyle(svg).color, bg = under ? getComputedStyle(under).backgroundColor : bgOf(svg.parentElement);
      const [L1, L2] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      const v = svg.closest('[data-variant], [data-size]');
      const variant = ['icon', v?.getAttribute('data-variant'), v?.getAttribute('data-size')].filter(Boolean).join(' ');
      out.push({ part, variant, ratio: Math.round(((L1! + 0.05) / (L2! + 0.05)) * 100) / 100, fg: hex(fg), bg: hex(bg) });
    }
    return out;
  }, ROOT);
}

/** The box a pointer can hit, for every interactive Helix part in the story. */
export async function collectTargets(page: Page): Promise<AppliedTarget[]> {
  return page.evaluate(({ root, selector }) => {
    const out: { part: string; variant: string; width: number; height: number }[] = [];
    for (const el of document.querySelector(root)?.querySelectorAll(selector) ?? []) {
      const part = el.closest('[data-helix-part]')?.getAttribute('data-helix-part');
      const style = getComputedStyle(el);
      if (!part || style.display === 'none' || style.visibility === 'hidden') continue;
      let r = el.getBoundingClientRect();
      if (el instanceof HTMLInputElement && (r.width <= 1 || style.opacity === '0')) r = (el.closest('label') ?? el).getBoundingClientRect();
      const v = el.closest('[data-variant], [data-size]');
      const variant = [v?.getAttribute('data-variant'), v?.getAttribute('data-size')].filter(Boolean).join(' ');
      if (r.width && r.height) out.push({ part, variant, width: Math.round(r.width), height: Math.round(r.height) });
    }
    return out;
  }, { root: ROOT, selector: INTERACTIVE });
}

// Every control of a Components/ or Layout/ story changes the canvas — run in the real browser on every story
// by test-runner.ts. The lint rule helix/story-has-controls catches a story with its Controls panel off or a
// `render` that takes no args; this catches the rest: a `render` that takes the args but drops one
// (`render: ({ size }) => …` with a `label` control that does nothing).
//
// For each control the story leaves on, it sets a different value (boolean flipped both ways, another option,
// text, number + 1), waits for the re-render and compares the story document (#storybook-root and the overlays
// portaled to <body>) with how it was, then resets that arg. A control that only shows with another one
// (`errorMessage` needs `invalid`, `iconEnd` is hidden while `isLoading`) is retried with each other control
// changed first. `default*` args only apply on mount: the story is remounted for them, or skipped when it has a
// play test (a remount would replay it).
//
// Skipped: actions (on…), `control: false` or hidden-from-table controls, object/file/date/color controls,
// stories with Controls off (`// controls-off: <reason>`, see the lint rule) or hidden from the sidebar (`!dev`),
// and the args a story lists in `parameters.controlsCheck: { skip: ['label'], reason: '…' }` — for a control
// that works but not on the canvas (Toast › Playground's args only reach the toast you open with its button).
import type { Page } from 'playwright';

export type DeadControl = { arg: string; control: string };

export async function checkControls(page: Page, storyId: string): Promise<DeadControl[]> {
  return page.evaluate(async id => {
    type ArgType = { control?: false | { type?: string; disable?: boolean }; options?: unknown[]; table?: { disable?: boolean }; action?: string; type?: { name?: string } };
    const preview = (window as any).__STORYBOOK_PREVIEW__;
    const channel = preview.channel;
    const story = await preview.loadStory({ storyId: id });
    // `!dev` is resolved away: a story hidden from the sidebar is one whose tags lack `dev`
    if (story.parameters?.controls?.disable || !story.tags?.includes('dev')) return [];
    const skip: string[] | undefined = story.parameters?.controlsCheck?.skip;
    if (story.parameters?.controlsCheck && !skip) return [];
    const args = (): Record<string, unknown> => preview.storyStoreValue.args.get(id);

    const snapshot = () => {
      const root = document.getElementById('storybook-root')?.innerHTML ?? '';
      const portals = [...document.body.children]
        .filter(el => !['storybook-root', 'storybook-docs'].includes(el.id) && !['SCRIPT', 'STYLE'].includes(el.tagName) && !el.classList.contains('sb-wrapper'))
        .map(el => el.outerHTML).join('');
      // Ids a component generates per render (helix-checkbox-3, React's :r5:) change on every re-render: number
      // them by order of appearance, or any re-render would look like a change.
      // A form control's live state (checked, value…) is a DOM property, not in the HTML.
      const state = [...document.querySelectorAll('#storybook-root input, #storybook-root select, #storybook-root textarea')]
        .map(el => { const i = el as HTMLInputElement; return `${i.checked}|${i.indeterminate}|${i.value}`; }).join(',');
      const seen = new Map<string, string>();
      return (root + portals + state).replace(/\bhelix-[a-z-]+-\d+\b|:r[0-9a-z]+:|«r[0-9a-z]+»/g, m => {
        if (!seen.has(m)) seen.set(m, `#id${seen.size}`);
        return seen.get(m)!;
      });
    };
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    async function send(event: string, payload: object) {
      const wait = new Promise<void>(resolve => {
        const done = () => { channel.off('storyRendered', done); clearTimeout(timer); resolve(); };
        const timer = setTimeout(done, 400); // no storyRendered when the args didn't actually change
        channel.on('storyRendered', done);
      });
      channel.emit(event, payload);
      await wait; await frame();
    }
    const update = (updatedArgs: Record<string, unknown>) => send('updateStoryArgs', { storyId: id, updatedArgs });
    const reset = (argNames: string[]) => send('resetStoryArgs', { storyId: id, argNames });

    // A transparent 1×1 GIF: an image URL that loads, so `src` shows an image instead of falling back.
    const IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    function candidates(name: string, type: string, argType: ArgType, value: unknown): unknown[] {
      if (type === 'boolean') return value === undefined ? [true, false] : [!value];
      if (['select', 'radio', 'inline-radio'].includes(type)) {
        return (argType.options ?? []).filter(o => o !== value && !(value === undefined && o === 'none')).slice(0, 2);
      }
      if (type === 'text' && name === 'src') return [IMAGE];
      // `value` of a choice component: one of its own options (any other string selects nothing)
      const options = (args().options as { value?: unknown; options?: { value?: unknown }[] }[] | undefined);
      if (type === 'text' && name === 'value' && Array.isArray(options)) {
        return options.flatMap(o => o.options ?? [o]).map(o => o.value).filter(v => typeof v === 'string' && v !== value).slice(0, 2);
      }
      if (type === 'text') return [`${value ?? ''} Changed`.trim()];
      if (type === 'number' || type === 'range') return [(typeof value === 'number' ? value : 0) + 1];
      return []; // object, array, file, date, color, check, multi-select: nothing generic to try
    }

    const controls = Object.entries(story.argTypes as Record<string, ArgType>).flatMap(([name, argType]) => {
      const control = argType.control;
      if (!control || control.disable || argType.table?.disable || skip?.includes(name)) return [];
      if (argType.action || argType.type?.name === 'function' || /^on[A-Z]/.test(name)) return [];
      return [{ name, argType, type: control.type ?? '' }];
    });

    // Does setting `name` (from the current state) change the canvas?
    async function changes(name: string, type: string, argType: ArgType, remount: boolean) {
      for (const value of candidates(name, type, argType, args()[name])) {
        const before = snapshot();
        await update({ [name]: value });
        if (remount) await send('forceRemount', { storyId: id });
        const after = snapshot();
        await reset([name]);
        if (remount) await send('forceRemount', { storyId: id });
        if (after !== before) return true;
      }
      return false;
    }

    const dead: { arg: string; control: string }[] = [];
    for (const { name, argType, type } of controls) {
      const mountOnly = /^default[A-Z]/.test(name);
      if (mountOnly && story.playFunction) continue;
      if (!candidates(name, type, argType, args()[name]).length) continue;
      if (await changes(name, type, argType, mountOnly)) continue;
      // Shown only together with another control: try again with each other one changed first.
      let works = false;
      for (const other of controls) {
        if (other.name === name || /^default[A-Z]/.test(other.name)) continue;
        for (const value of candidates(other.name, other.type, other.argType, args()[other.name])) {
          await update({ [other.name]: value });
          works = await changes(name, type, argType, mountOnly);
          await reset([other.name]);
          if (works) break;
        }
        if (works) break;
      }
      if (!works) dead.push({ arg: name, control: type });
    }
    return dead;
  }, storyId);
}

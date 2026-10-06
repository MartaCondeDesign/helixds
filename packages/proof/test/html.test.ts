import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { galleryHtml } from '../src/html.ts';

describe('@helix-ds/proof html', () => {
  it("writes a page whose script parses — escapes in the template literal can't break it", () => {
    const html = galleryHtml({
      name: 'Acme',
      tasks: ['task'],
      variants: { bare: { label: 'bare', command: 'run --task {task}' } },
      generatedAt: '2026-10-06T00:00:00.000Z',
      cells: [{ id: 'a', task: 'task', variant: 'bare', rep: 0, score: 50, passed: false, model: null, tokens: 1200, code: 'x', buildError: null, issues: [] }],
    });
    const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
    assert.doesNotThrow(() => new Function(script));
  });

  it('keeps answer code from closing the script tag', () => {
    const html = galleryHtml({
      name: 'Acme', tasks: [], variants: {}, generatedAt: '2026-10-06T00:00:00.000Z',
      cells: [{ id: 'a', task: 'task', variant: 'bare', rep: 0, score: 0, passed: false, model: null, tokens: null, code: '</script><script>alert(1)</script>', buildError: null, issues: [] }],
    });
    assert.equal(html.match(/<\/script>/g)?.length, 1);
  });
});

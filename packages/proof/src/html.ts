// The gallery as one self-contained HTML file: data and screenshots inlined, no server, no dependencies.
import type { VariantInfo } from './config.ts';
import type { Cell } from './cells.ts';

export function galleryHtml(opts: { name: string; cells: Cell[]; tasks: string[]; defaultTask?: string; variants: Record<string, VariantInfo>; generatedAt: string }) {
  const data = JSON.stringify(opts).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(opts.name)} Proof</title>
<style>
:root { --bg:#f6f7f9; --panel:#fff; --line:#dfe3e8; --text:#14181f; --muted:#5b6472; --pass:#0f7a4f; --pass-bg:#e3f5ec; --fail:#b42318; --fail-bg:#fdecea; --warn:#8a5300; --warn-bg:#fdf0d8; --accent:#2457d6; }
@media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --panel:#161b22; --line:#2b323c; --text:#e6e9ef; --muted:#9aa4b2; --pass:#5fd39b; --pass-bg:#10291e; --fail:#ff8a7a; --fail-bg:#3a1512; --warn:#f2b45a; --warn-bg:#36260b; --accent:#7aa2ff; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; }
main { max-width:1400px; margin:0 auto; padding:24px 16px 48px; }
h1 { margin:0; font-size:24px; } .sub { color:var(--muted); margin:4px 0 20px; }
.bar { display:flex; flex-wrap:wrap; gap:12px; align-items:center; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin-bottom:20px; }
.bar label { display:flex; gap:6px; align-items:center; color:var(--muted); font-size:13px; }
select, input { font:inherit; color:var(--text); background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:4px 6px; }
/* Task picker: a select-only combobox (WAI-ARIA), so each task can show its mean score right-aligned. */
.picker { position:relative; }
#task { font:inherit; color:var(--text); background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:4px 28px 4px 8px; text-align:left; cursor:pointer; position:relative; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
#task::after { content:''; position:absolute; right:10px; top:50%; width:6px; height:6px; border:solid var(--muted); border-width:0 1.5px 1.5px 0; transform:translateY(-70%) rotate(45deg); }
#task:focus-visible, #task-list li.active { outline:2px solid var(--accent); outline-offset:-2px; }
#task-list { position:absolute; z-index:10; top:calc(100% + 4px); left:0; min-width:100%; max-height:min(420px,60vh); overflow:auto; margin:0; padding:4px; list-style:none; background:var(--panel); border:1px solid var(--line); border-radius:8px; box-shadow:0 8px 24px rgb(0 0 0 / .18); }
#task-list[hidden] { display:none; }
#task-list li { display:flex; justify-content:space-between; gap:24px; padding:6px 8px; border-radius:5px; cursor:pointer; color:var(--text); white-space:nowrap; }
#task-list li:hover { background:var(--bg); }
#task-list li[aria-selected="true"] { font-weight:600; }
#task-list .pct { font:12px ui-monospace,Menlo,monospace; color:var(--muted); min-width:3.5em; text-align:right; }
.row { display:grid; grid-template-columns:186px 1fr; gap:16px; margin-bottom:20px; }
.head { min-width:0; padding-left:16px; }
.head h2 { margin:0; font-size:16px; display:inline; }
.title { display:flex; align-items:center; gap:4px; }
/* ⓘ next to a level's name: its tooltip says, in plain words, what the agent was given. */
.info { position:relative; display:inline-grid; place-items:center; width:22px; height:22px; padding:0; border:0; border-radius:6px; background:none; color:var(--muted); cursor:help; font:inherit; }
.info:hover, .info:focus-visible { background:var(--bg); color:var(--text); }
.info .tip { position:absolute; left:calc(100% + 6px); top:50%; transform:translateY(-50%); z-index:5; width:240px; padding:8px 10px; border-radius:6px; background:var(--text); color:var(--panel); font:12px/1.45 system-ui,-apple-system,sans-serif; text-align:left; visibility:hidden; opacity:0; transition:opacity .12s; pointer-events:none; }
.info:hover .tip, .info:focus-visible .tip { visibility:visible; opacity:1; }
.score { display:flex; align-items:center; gap:8px; margin-top:6px; } .score .mean { margin-top:0; }
.pass-badge { display:inline-block; padding:0 6px; border-radius:999px; font:600 11px/1.6 system-ui,-apple-system,sans-serif; white-space:nowrap; }
.pass-badge.danger { color:var(--fail); background:var(--fail-bg); } .pass-badge.success { color:var(--pass); background:var(--pass-bg); }
.pass-badge.warning { color:var(--warn); background:var(--warn-bg); }
.status { margin-top:6px; color:var(--muted); font-size:12px; line-height:1.45; } .mean { font:600 30px/1.2 ui-monospace,Menlo,monospace; margin-top:6px; }
.meta { color:var(--muted); font-size:12px; font-family:ui-monospace,Menlo,monospace; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--card,240px),1fr)); gap:12px; }
.card { background:var(--panel); border:1px solid var(--line); border-radius:10px; overflow:hidden; cursor:pointer; text-align:left; padding:0; color:inherit; font:inherit; }
.card:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.card.pass { border-color:color-mix(in srgb,var(--pass) 45%,var(--line)); } .card.fail { border-color:color-mix(in srgb,var(--fail) 45%,var(--line)); }
.top { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; font:12px ui-monospace,Menlo,monospace; }
.tag { font-weight:700; font-size:11px; padding:1px 6px; border-radius:4px; }
.tok { color:var(--muted); }
.tag.pass { color:var(--pass); background:var(--pass-bg); } .tag.fail { color:var(--fail); background:var(--fail-bg); }
.a11y { padding:6px 10px; font:11px ui-monospace,Menlo,monospace; border-top:1px solid var(--line); color:var(--pass); }
.a11y.bad { color:var(--fail); }
dialog ul { padding-left:18px; font-size:13px; }
.shot { aspect-ratio:800/520; background:#fff; display:block; width:100%; object-fit:contain; padding:8px; border-top:1px solid var(--line); }
.err { aspect-ratio:800/520; padding:12px; color:var(--fail); font:12px ui-monospace,Menlo,monospace; border-top:1px solid var(--line); overflow:hidden; }
.note { color:var(--fail); font:11px ui-monospace,Menlo,monospace; padding:4px 10px 8px; }
.err.info, .note.info { color:var(--muted); }
.empty { color:var(--muted); padding:24px; text-align:center; }
.pending { border:1px dashed var(--line); border-radius:10px; padding:16px; color:var(--muted); }
.pending code { display:block; margin-top:8px; color:var(--text); font:12px ui-monospace,Menlo,monospace; overflow-wrap:anywhere; }
dialog { width:min(1100px,94vw); max-height:92vh; border:1px solid var(--line); border-radius:12px; background:var(--panel); color:var(--text); padding:16px; }
dialog::backdrop { background:rgb(0 0 0 / .55); }
dialog img { width:100%; border:1px solid var(--line); border-radius:8px; background:#fff; }
dialog pre { background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:12px; overflow:auto; max-height:40vh; font-size:12px; }
dialog button { font:inherit; float:right; background:none; border:1px solid var(--line); color:var(--text); border-radius:6px; padding:4px 10px; cursor:pointer; }
.runbtn { margin-left:auto; font:inherit; font-weight:600; color:#fff; background:var(--accent); border:0; border-radius:6px; padding:6px 12px; cursor:pointer; }
.runbtn[hidden] { display:none; }
#runner { width:min(640px,94vw); }
#runner fieldset { border:1px solid var(--line); border-radius:8px; margin:0 0 12px; padding:8px 12px; }
#runner legend { color:var(--muted); font-size:12px; padding:0 4px; }
#runner fieldset label { display:inline-flex; gap:6px; align-items:center; margin:4px 14px 4px 0; }
#r-estimate { margin:12px 0; padding:10px 12px; border-radius:8px; background:var(--bg); border:1px solid var(--line); }
#r-estimate strong { font-size:16px; }
#r-actions { display:flex; justify-content:flex-end; gap:8px; }
#r-actions button { float:none; }
#r-go { color:#fff; background:var(--accent); border-color:var(--accent); font-weight:600; }
#r-go:disabled { opacity:.5; cursor:not-allowed; }
#r-log { white-space:pre-wrap; max-height:45vh; }
@media (max-width:640px) { .row { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main>
  <h1>Proof · ${escape(opts.name)}</h1>
  <p class="sub">What the agents built for each task, per context level and rep, next to its score. Generated <span id="when"></span>.<span id="spend"></span></p>
  <div class="bar">
    <label id="task-label">Task</label>
    <div class="picker"><button id="task" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="task-list" aria-labelledby="task-label"></button><ul id="task-list" role="listbox" aria-labelledby="task-label" tabindex="-1" hidden></ul></div>
    <label>Gate <select id="gate"><option value="all">all</option><option value="pass">pass</option><option value="fail">fail</option></select></label>
    <label>Size <input id="size" type="range" min="160" max="480" value="240"></label>
    <button id="run" class="runbtn" hidden>Run evals</button>
  </div>
  <div id="rows"></div>
</main>
<dialog id="detail"><button id="close">Close</button><h2 id="d-title"></h2><div id="d-body"></div></dialog>
<dialog id="runner">
  <h2 style="margin-top:0">Run evals</h2>
  <p class="meta">A new measurement round: fresh answers for every level and task you pick, recorded so you can compare rounds over time. It uses tokens — check the estimate first.</p>
  <div id="r-form">
    <fieldset><legend>Levels</legend><div id="r-levels"></div></fieldset>
    <fieldset><legend>Tasks</legend>
      <label><input type="radio" name="r-tasks" value="current" checked><span>This task (<span id="r-current"></span>)</span></label>
      <label><input type="radio" name="r-tasks" value="all"><span>All tasks (<span id="r-all"></span>)</span></label>
    </fieldset>
    <fieldset><legend>Runs per task and level</legend><label><input id="r-runs" type="number" min="1" max="20" value="1" style="width:5em"></label></fieldset>
    <div id="r-estimate">Estimating…</div>
  </div>
  <pre id="r-log" hidden></pre>
  <div id="r-actions"><button id="r-cancel">Cancel</button><button id="r-go" disabled>Run</button></div>
</dialog>
<script>
const G = ${data};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const order = Object.keys(G.variants);
const rank = v => { const i = order.indexOf(v); return i === -1 ? order.length : i; };
$('when').textContent = new Date(G.generatedAt).toLocaleString();
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n));
const sumTokens = cells => cells.reduce((n, c) => n + (c.tokens ?? 0), 0);
const measured = G.cells.filter(c => c.tokens);
if (measured.length) $('spend').textContent = ' ' + fmt(sumTokens(measured)) + ' tokens spent on ' + measured.length + ' answers with usage recorded.';
const ran = new Set(G.cells.map(c => c.task));
const tasks = [...new Set([...ran, ...G.tasks])].sort();
// Mean score of every answer shown for a task, all levels together; "–" when it was never run.
const taskMean = t => { const cs = G.cells.filter(c => c.task === t); return cs.length ? Math.round(cs.reduce((n, c) => n + c.score, 0) / cs.length) + '%' : '–'; };
let currentTask = tasks.includes(G.defaultTask) ? G.defaultTask : tasks[0] ?? '';
$('task-list').innerHTML = tasks.map((t, i) => '<li role="option" id="opt-' + i + '" data-task="' + esc(t) + '" aria-selected="false"><span>' + esc(t) + '</span><span class="pct" aria-label="mean score ' + taskMean(t) + '">' + taskMean(t) + '</span></li>').join('');
const saved = new URLSearchParams(location.hash.slice(1));
if (tasks.includes(saved.get('task'))) currentTask = saved.get('task');

const options = () => [...$('task-list').children];
const taskText = t => t + '  ·  ' + taskMean(t);
// Fixed width: as wide as the longest task, so picking another one never resizes the field.
(() => {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = getComputedStyle($('task')).font;
  const widest = Math.max(...tasks.map(t => ctx.measureText(taskText(t)).width));
  $('task').style.width = Math.ceil(widest) + 8 + 28 + 2 + 'px'; // + padding-left, chevron room, border
})();
function setTask(t) {
  currentTask = t;
  $('task').textContent = taskText(t);
  options().forEach(li => li.setAttribute('aria-selected', String(li.dataset.task === t)));
  render();
}
function openList() {
  $('task-list').hidden = false;
  $('task').setAttribute('aria-expanded', 'true');
  activate(options().findIndex(li => li.dataset.task === currentTask));
}
function closeList() {
  $('task-list').hidden = true;
  $('task').setAttribute('aria-expanded', 'false');
  $('task').removeAttribute('aria-activedescendant');
}
function activate(i) {
  const list = options(); if (!list.length) return;
  i = Math.max(0, Math.min(list.length - 1, i));
  list.forEach((li, j) => li.classList.toggle('active', j === i));
  $('task').setAttribute('aria-activedescendant', list[i].id);
  list[i].scrollIntoView({ block: 'nearest' });
}
const activeIndex = () => options().findIndex(li => li.classList.contains('active'));
$('task').addEventListener('click', () => $('task-list').hidden ? openList() : closeList());
$('task').addEventListener('keydown', e => {
  const open = !$('task-list').hidden;
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    if (!open) return openList();
    const n = options().length;
    activate(e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : activeIndex() + (e.key === 'ArrowDown' ? 1 : -1));
  } else if ((e.key === 'Enter' || e.key === ' ') && open) {
    e.preventDefault();
    setTask(options()[activeIndex()].dataset.task); closeList();
  } else if (e.key === 'Escape' && open) {
    e.preventDefault(); closeList();
  } else if (e.key.length === 1 && /\w/.test(e.key)) {
    // Type-ahead: jump to the next task starting with that letter.
    if (!open) openList();
    const list = options(), from = activeIndex();
    const hit = [...list.slice(from + 1), ...list.slice(0, from + 1)].find(li => li.dataset.task.startsWith(e.key.toLowerCase()));
    if (hit) activate(list.indexOf(hit));
  }
});
$('task-list').addEventListener('click', e => { const li = e.target.closest('li'); if (li) { setTask(li.dataset.task); closeList(); $('task').focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('.picker')) closeList(); });

function render() {
  const task = currentTask, gate = $('gate').value;
  history.replaceState(null, '', '#task=' + encodeURIComponent(task));
  const byVariant = {};
  for (const c of G.cells) if (c.task === task) (byVariant[c.variant] ??= []).push(c);
  // Every listed level gets a row, run or not, so the whole ladder is visible from the start.
  for (const v of order) byVariant[v] ??= [];
  const rows = Object.entries(byVariant).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
  $('rows').innerHTML = rows.map(([variant, cells]) => {
    cells.sort((a, b) => a.rep - b.rep);
    const info = G.variants[variant] ?? { label: variant };
    if (!cells.length) {
      return '<section class="row"><div class="head">' + title(info) + '<div class="mean">—</div></div>'
        + '<div class="pending">Not run yet' + (info.command ? ' — generate it with:<code>' + esc(info.command.replaceAll('{task}', task)) + '</code>' : '') + '</div></section>';
    }
    const mean = cells.reduce((s, c) => s + c.score, 0) / cells.length;
    const shown = cells.filter(c => gate === 'all' || (gate === 'pass') === c.passed);
    const withTokens = cells.filter(c => c.tokens);
    const spend = withTokens.length ? '<div class="meta">~' + fmt(sumTokens(withTokens) / withTokens.length) + ' tokens/answer · ' + fmt(sumTokens(withTokens)) + ' total</div>' : '';
    return '<section class="row"><div class="head">' + title(info)
      + '<div class="score"><div class="mean">' + mean.toFixed(1) + '</div><span class="pass-badge ' + scoreTone(scoreOutOf(mean, cells.length), cells.length) + '">' + scoreOutOf(mean, cells.length) + '/' + cells.length + '</span></div>'
      + '<div class="status">' + esc(rowStatus(cells)) + '</div>'
      + a11ySummary(cells) + spend + '</div>'
      + '<div class="grid">' + (shown.map(card).join('') || '<div class="empty">No ' + gate + ' cells</div>') + '</div></section>';
  }).join('') || '<p class="empty">No answers for this task.</p>';
}

function card(c) {
  const status = c.passed ? 'pass' : 'fail';
  const failure = c.buildError ? 'Build failed: ' + c.buildError : c.renderError;
  const body = c.screenshot ? '<img class="shot" alt="Rendered answer, ' + esc(c.variant) + ' rep ' + c.rep + '" loading="lazy" src="data:image/jpeg;base64,' + c.screenshot + '">'
    : '<div class="err' + tone(failure) + '">' + esc(failure ?? 'Not rendered') + '</div>';
  return '<button class="card ' + status + '" data-id="' + c.id + '"><div class="top"><span>rep' + c.rep + '</span><span>' + c.score.toFixed(2) + '</span>' + (c.tokens ? '<span class="tok">' + fmt(c.tokens) + ' tok</span>' : '') + '<span class="tag ' + status + '">' + status.toUpperCase() + '</span></div>'
    + body + (c.screenshot && failure ? '<div class="note' + tone(failure) + '">' + esc(failure) + '</div>' : '') + a11yLine(c) + '</button>';
}
function title(info) {
  return '<div class="title"><h2>' + esc(info.label) + '</h2>' + (info.explain
    ? '<button type="button" class="info" aria-label="What is ' + esc(info.label) + '?"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><span class="tip" role="tooltip">' + esc(info.explain) + '</span></button>'
    : '') + '</div>';
}
// Score badge: the row's mean score on the scale of its answers — a mean of 80 over 5 answers reads 4/5.
// Red at ≤ 1 in 5, orange at 2–3, green at 4–5. Scored, not counted: an answer at 80 that misses one
// criterion still counts as 80, not as a fail.
const scoreOutOf = (mean, total) => Math.round(mean / 100 * total);
const scoreTone = (outOf, total) => outOf / total < 0.4 ? 'danger' : outOf / total < 0.8 ? 'warning' : 'success';
// The row's most common problem — the badge beside the score already gives the count. On a tie the
// build-breaking one wins.
function rowStatus(cells) {
  const failing = cells.filter(c => !c.passed);
  if (!failing.length) return 'Every answer passes its checks.';
  const counts = new Map();
  for (const c of failing) for (const issue of new Set(c.issues)) counts.set(issue, (counts.get(issue) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] + '.' : 'Answers fail their checks.';
}
function a11ySummary(cells) {
  const checked = cells.filter(c => c.a11y);
  return checked.length ? '<div class="meta">a11y clean ' + checked.filter(c => !c.a11y.length).length + '/' + checked.length + ' rendered</div>' : '';
}
function a11yLine(c) {
  if (!c.a11y) return '';
  return c.a11y.length ? '<div class="a11y bad">a11y · ' + c.a11y.length + ' issue' + (c.a11y.length > 1 ? 's' : '') + '</div>' : '<div class="a11y">a11y · no issues</div>';
}
// "Needs props" isn't the agent's fault — shown muted, not as a failure.
const tone = failure => failure?.startsWith('Needs props') ? ' info' : '';

$('rows').addEventListener('click', e => {
  const el = e.target.closest('.card'); if (!el) return;
  const c = G.cells.find(x => x.id === el.dataset.id);
  const failure = c.buildError ? 'Build failed: ' + c.buildError : c.renderError;
  $('d-title').textContent = c.task + ' · ' + (G.variants[c.variant]?.label ?? c.variant) + ' · rep' + c.rep + ' · ' + c.score.toFixed(2) + (c.model ? ' · ' + c.model : '');
  $('d-body').innerHTML = (failure ? '<p class="note' + tone(failure) + '">' + esc(failure) + '</p>' : '')
    + (c.screenshot ? '<img alt="" src="data:image/jpeg;base64,' + c.screenshot + '">' : '')
    + (c.a11y ? (c.a11y.length ? '<h3>Accessibility (axe, WCAG 2.2 AA)</h3><ul>' + c.a11y.map(v => '<li><b>' + esc(v.id) + '</b> (' + esc(v.impact ?? '') + ', ' + v.nodes + ' element' + (v.nodes > 1 ? 's' : '') + ') — ' + esc(v.help) + '</li>').join('') + '</ul>' : '<p class="a11y">Accessibility (axe, WCAG 2.2 AA): no issues</p>') : '')
    + '<pre><code>' + esc(c.code || '(no code)') + '</code></pre>';
  $('detail').showModal();
});
$('close').onclick = () => $('detail').close();
$('gate').addEventListener('change', render);
$('size').addEventListener('input', e => document.documentElement.style.setProperty('--card', e.target.value + 'px'));
setTask(currentTask);

// "Run evals" — only when served by proof --serve with a runner configured; a plain file has no backend.
let runner = null;
fetch('/api/runner').then(r => r.ok ? r.json() : null).then(info => {
  if (!info) return;
  runner = info;
  $('run').hidden = false;
  $('r-levels').innerHTML = info.levels.map(l => '<label><input type="checkbox" value="' + esc(l.variant) + '" checked> ' + esc(l.label) + '</label>').join('');
  $('r-runs').value = info.runs;
  $('r-all').textContent = (info.tasks.length || tasks.length) + '';
}).catch(() => {});

function selection() {
  const all = document.querySelector('input[name="r-tasks"]:checked').value === 'all';
  return {
    levels: [...$('r-levels').querySelectorAll('input:checked')].map(i => i.value),
    tasks: all ? (runner.tasks.length ? runner.tasks : tasks) : [currentTask],
    runs: Number($('r-runs').value),
  };
}

let estimateTimer;
function estimate() {
  clearTimeout(estimateTimer);
  $('r-go').disabled = true;
  $('r-estimate').textContent = 'Estimating…';
  estimateTimer = setTimeout(async () => {
    const res = await fetch('/api/plan', { method: 'POST', body: JSON.stringify(selection()) });
    const plan = await res.json();
    if (!res.ok) { $('r-estimate').textContent = plan.error; return; }
    $('r-estimate').innerHTML = '<strong>' + plan.answers + ' answer' + (plan.answers === 1 ? '' : 's') + '</strong> · '
      + (plan.estTokens == null ? 'token cost unknown — no answer has recorded tokens yet, so this round will measure it'
        : '~<strong>' + fmt(plan.estTokens) + ' tokens</strong>' + (plan.complete ? '' : ' (some levels not measured yet)'));
    $('r-go').textContent = 'Run ' + plan.answers + ' answer' + (plan.answers === 1 ? '' : 's');
    $('r-go').disabled = !plan.answers;
  }, 250);
}

$('run').onclick = () => {
  $('r-current').textContent = currentTask;
  $('r-form').hidden = false; $('r-log').hidden = true; $('r-log').textContent = '';
  $('r-cancel').textContent = 'Cancel'; $('r-cancel').disabled = false;
  $('r-go').hidden = false;
  $('runner').showModal();
  estimate();
};
$('r-form').addEventListener('change', estimate);
$('r-cancel').onclick = () => $('runner').close();
$('runner').addEventListener('cancel', e => { if ($('r-cancel').disabled) e.preventDefault(); });
$('r-go').onclick = async () => {
  const body = JSON.stringify(selection());
  $('r-form').hidden = true; $('r-go').hidden = true; $('r-log').hidden = false;
  $('r-cancel').disabled = true; $('r-cancel').textContent = 'Running…';
  const res = await fetch('/api/run', { method: 'POST', body });
  if (!res.ok) { $('r-log').textContent = (await res.json()).error; $('r-cancel').disabled = false; $('r-cancel').textContent = 'Close'; return; }
  const reader = res.body.getReader(), decoder = new TextDecoder();
  let log = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    log += decoder.decode(value, { stream: true });
    $('r-log').textContent = log.replace(/\\n__PROOF_DONE__ \\d+\\n?$/, '');
    $('r-log').scrollTop = $('r-log').scrollHeight;
  }
  const ok = /__PROOF_DONE__ 0\\s*$/.test(log);
  $('r-cancel').disabled = false;
  $('r-cancel').textContent = ok ? 'Reload' : 'Close';
  $('r-cancel').onclick = ok ? () => location.reload() : () => $('runner').close();
};
</script>
</body>
</html>
`;
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

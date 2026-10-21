import * as React from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { cn } from '../../lib/utils';
import type { ChartProps } from './Chart.types';
echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);
const token = (style: CSSStyleDeclaration, name: string) => style.getPropertyValue(name).trim();
// A duration token resolved to milliseconds ("700ms" or "0.7s").
const ms = (value: string) => (value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000) || 0;
// A cubic-bezier() easing token as a function — the canvas can't read CSS easings, ECharts takes a function.
const bezier = (css: string) => {
  const points = (css.match(/-?[\d.]+/g) ?? []).map(Number);
  if (points.length !== 4 || points.some(Number.isNaN)) return 'cubicOut' as const;
  const [x1, y1, x2, y2] = points as [number, number, number, number];
  const at = (a: number, b: number, t: number) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
  const slope = (a: number, b: number, t: number) => 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) { const dx = at(x1, x2, t) - x; const d = slope(x1, x2, t); if (Math.abs(dx) < 1e-5 || !d) break; t -= dx / d; }
    return at(y1, y2, Math.min(1, Math.max(0, t)));
  };
};
// The inverse of an easing: at what share of the time it reaches a given share of the way. Used to pop each
// line point in exactly when an eased line reveal reaches it.
const timeAt = (ease: (x: number) => number, progress: number) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (ease(mid) < progress) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
// A hex color with an alpha, for the area gradient (the canvas reads plain color strings, not color-mix()).
const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', ''); const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
// The canvas can't follow CSS variables or media queries on its own — tokens are read once per render. Re-render
// whenever they can change: the data-theme/class attribute on <html>, the OS color scheme, or reduced motion.
const useThemeVersion = () => {
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    const observer = new MutationObserver(bump);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const queries = ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)'].map(q => window.matchMedia(q));
    queries.forEach(q => q.addEventListener('change', bump));
    return () => { observer.disconnect(); queries.forEach(q => q.removeEventListener('change', bump)); };
  }, []);
  return version;
};
const Chart = ({ variant, categories, series, label, description, height = 280, className }: ChartProps) => {
  const root = React.useRef<HTMLDivElement>(null); const instance = React.useRef<echarts.ECharts | null>(null);
  const themeVersion = useThemeVersion();
  // The legend is HTML, not the canvas's own: real buttons (hover, focus, aria-pressed) that show and hide
  // a series. Its entries are the series — or the categories, for a donut. With one entry there's nothing
  // to toggle, so it's a plain label.
  const entries = variant === 'donut' ? categories : series.map(item => item.name);
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set());
  const toggle = (name: string) => setHidden(current => { const next = new Set(current); if (next.has(name)) next.delete(name); else next.add(name); return next; });
  const interactive = entries.length > 1;
  // What was last drawn in: a new variant or new data draws in again from scratch; a legend toggle or a theme
  // change only updates what's there. Without this, React rendering twice on mount turns the first draw-in
  // into a plain update and the line just appears.
  const drawn = React.useRef('');
  // The donut's shape (its categories) when it was last drawn: new values for the same categories morph
  // the slices into place instead of drawing in from scratch.
  const drawnShape = React.useRef('');
  // Everything the option depends on: an identical re-render (React runs effects twice on mount) must not
  // call setOption again — a second setOption, even an identical one, redraws the line in full mid draw-in.
  const applied = React.useRef('');
  React.useEffect(() => {
    if (!root.current) return;
    const chart = instance.current && !instance.current.isDisposed() ? instance.current : echarts.init(root.current); instance.current = chart;
    const style = getComputedStyle(root.current);
    const palette = [1,2,3,4,5,6].map(n => token(style,`--helix-color-chart-series-${n}`));
    const text = token(style,'--helix-color-text-neutral-light'); const border = token(style,'--helix-color-border-neutral');
    const page = token(style,'--helix-color-fill-page'); const fontFamily = token(style,'--helix-textStyle-body-s-regular-fontFamily');
    // Draw-in motion: lines sweep in over duration.draw and each point appears as the line reaches it; bars
    // grow one category after another (duration.stagger apart); each series starts after the previous one.
    // Reduced motion shows the finished chart straight away.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = ms(token(style,'--helix-duration-draw')); const stagger = ms(token(style,'--helix-duration-stagger'));
    const gentle = bezier(token(style,'--helix-easing-gentle')); const easeOut = bezier(token(style,'--helix-easing-out'));
    const motion = reduced ? { animation: false } : { animation: true, animationEasing: gentle, animationDuration: draw };
    const areaOpacity = parseFloat(token(style,'--helix-chart-area-opacity')) || 0;
    const base = { color: palette, textStyle: { color: text, fontFamily }, tooltip: { trigger: variant === 'donut' ? 'item' : 'axis', axisPointer: { type: 'line', lineStyle: { color: border, width: 1, type: 'dashed' } }, borderRadius: parseFloat(token(style,'--helix-radius-l')), padding: parseFloat(token(style,'--helix-spacing-s')), extraCssText: 'box-shadow: var(--helix-shadow-s);', backgroundColor: token(style,'--helix-color-fill-page'), borderColor: border, borderWidth: 1, textStyle: { color: token(style,'--helix-color-text-neutral'), fontFamily } }, legend: { show: false, selected: Object.fromEntries(entries.map(name => [name, !hidden.has(name)])) }, ...motion };
    // Lines start fast and ease out (easing.out). ECharts pops each point in with the series' animationDelay(index)
    // and reveals the line with animationDelay(null), so each point waits until the eased reveal reaches it
    // (category points sit at (i + 0.5) / n of the width).
    const n = Math.max(categories.length, 1);
    const lineMotion = (start: number) => typeof easeOut === 'function'
      ? { symbol: 'circle', animationEasing: easeOut, animationDelay: (point: number | null) => point == null ? start : start + timeAt(easeOut, (point + 0.5) / n) * draw }
      : { symbol: 'circle', animationDelay: start };
    // Bars: the tallest grows first, then the next tallest… (ranked across every series).
    const ranked = series.flatMap((item, si) => item.data.map((v, point) => ({ si, point, v: Math.abs(v ?? 0) }))).sort((a, b) => b.v - a.v);
    const rank = (si: number, point: number) => ranked.findIndex(r => r.si === si && r.point === point);
    const barMotion = (si: number) => ({ animationDelay: (point: number) => Math.max(rank(si, point), 0) * stagger });
    // Stacked bars fill up level by level: each segment starts when the one below it ends and takes time in
    // proportion to its height, so the tallest column takes the full duration.draw.
    const totals = categories.map((_, point) => series.reduce((sum, item) => sum + Math.abs(item.data[point] ?? 0), 0));
    const tallest = Math.max(...totals, 1);
    const below = (si: number, point: number) => series.slice(0, si).reduce((sum, item) => sum + Math.abs(item.data[point] ?? 0), 0);
    const stackMotion = (si: number, value: (point: number) => number) => ({
      animationEasing: 'linear',
      animationDuration: (point: number) => (value(point) / tallest) * draw,
      animationDelay: (point: number) => (below(si, point) / tallest) * draw,
    });
    // Neighbouring blues are under 3:1 apart, so stacked segments and donut slices are separated by a
    // page-colored gap instead (WCAG 1.4.11).
    const gap = { borderColor: page };

    // Donut update (transitions.dev "donut chart"): when only the values change, each slice eases from
    // its old angle to its new one over component.chart.duration-update with easing-update — the gaps
    // between slices stay even the whole way.
    const update = { animationDurationUpdate: ms(token(style,'--helix-chart-duration-update')), animationEasingUpdate: bezier(token(style,'--helix-chart-easing-update')) };
    const option = variant === 'donut'
      ? { ...base, ...update, series: [{ type: 'pie', radius: ['56%','78%'], animationType: 'expansion', animationEasing: easeOut, ...update, itemStyle: { ...gap, borderWidth: 2 }, data: categories.map((name,index) => ({ name, value: series[0]?.data[index] ?? 0 })) }] }
      : { ...base, grid: { left: 8,right: 16,top: 24,bottom: 8,containLabel: true }, xAxis: { type: 'category',data: categories,axisLine:{lineStyle:{color:border}},axisLabel:{color:text,fontFamily} }, yAxis: { type:'value',splitLine:{lineStyle:{color:border}},axisLabel:{color:text,fontFamily} },
        series: series.map((item, index) => {
          const value = (point: number) => Math.abs(item.data[point] ?? 0);
          const line = variant === 'line' || variant === 'timeline' || variant === 'area';
          const start = index * stagger * 2;
          // A line is revealed left to right at a constant pace and ECharts shows each point as the reveal
          // reaches it — the points follow the reveal linearly, so the line must be linear too or it runs ahead of
          // them. Bars keep easing.gentle.
          return { name:item.name, type: line ? 'line' : 'bar', stack: variant === 'stacked-bar' ? 'total' : undefined, smooth: variant === 'line' || variant === 'area', data:item.data,
            ...(line ? lineMotion(start) : variant === 'stacked-bar' ? stackMotion(index, value) : barMotion(index)),
            itemStyle: variant === 'stacked-bar' ? { ...gap, borderWidth: 1 } : undefined,
            areaStyle: variant === 'area' ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: withAlpha(palette[index % 6] ?? '', areaOpacity) }, { offset: 1, color: withAlpha(palette[index % 6] ?? '', 0) }]) } : undefined };
        }) };
    const signature = JSON.stringify([variant, categories, series]);
    // New data draws in from scratch; anything else merges into what's on screen, so an identical re-render
    // (React's double effect on mount) doesn't cut the draw-in short.
    // A donut whose categories didn't change only morphs to its new values.
    const shape = JSON.stringify([variant, categories]);
    const morph = variant === 'donut' && drawnShape.current === shape;
    const fresh = drawn.current !== signature && !morph;
    const key = JSON.stringify([signature, themeVersion, [...hidden], height, label, description]);
    if (fresh) chart.clear();
    drawn.current = signature; drawnShape.current = shape;
    if (applied.current !== key) { chart.setOption(option, fresh); applied.current = key; }
    // ResizeObserver always fires once when it starts observing; resizing then would redraw the line in full
    // mid draw-in, so only resize when the size really changed.
    const el = root.current;
    const observer = new ResizeObserver(() => { if (el.clientWidth !== chart.getWidth() || el.clientHeight !== chart.getHeight()) chart.resize(); });
    observer.observe(el); return () => observer.disconnect();
  }, [variant,categories,series,label,description,height,themeVersion,hidden]);
  React.useEffect(() => () => { instance.current?.dispose(); instance.current = null; drawn.current = ''; drawnShape.current = ''; applied.current = ''; }, []);
  return <div data-helix-part="chart-root" data-variant={variant} className={cn(className)}><div ref={root} data-helix-part="chart-canvas" role="img" aria-label={description ? `${label}. ${description}` : label} style={{ height }} /><div data-helix-part="chart-legend" role={interactive ? 'group' : undefined} aria-label={interactive ? `${label} — show or hide series` : undefined}>{entries.map((name, index) => { const swatch = <span data-helix-part="chart-legend-swatch" aria-hidden="true" style={{ '--chart-swatch': `var(--helix-color-chart-series-${(index % 6) + 1})` } as React.CSSProperties} />; return interactive ? <button key={name} type="button" data-helix-part="chart-legend-item" aria-pressed={!hidden.has(name)} onClick={() => toggle(name)}>{swatch}{name}</button> : <span key={name} data-helix-part="chart-legend-item">{swatch}{name}</span>; })}</div><div data-helix-part="chart-data"><table><caption>{label}</caption><tbody>{categories.map((category,index) => <tr key={category}><th scope="row">{category}</th>{series.map(item => <td key={item.name}>{item.data[index] ?? 'No data'}</td>)}</tr>)}</tbody></table></div></div>;
};
Chart.displayName = 'Chart'; export { Chart };

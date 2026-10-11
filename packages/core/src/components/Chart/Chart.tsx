import * as React from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { cn } from '../../lib/utils';
import type { ChartProps } from './Chart.types';
echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);
const token = (style: CSSStyleDeclaration, name: string) => style.getPropertyValue(name).trim();
// The canvas can't follow CSS variables on its own — colors are read once per render. Re-render whenever
// the theme can change: the data-theme/class attribute on <html>, or the OS color-scheme preference.
const useThemeVersion = () => {
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    const observer = new MutationObserver(bump);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', bump);
    return () => { observer.disconnect(); scheme.removeEventListener('change', bump); };
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
  React.useEffect(() => { if (!root.current) return; const chart = instance.current ?? echarts.init(root.current); instance.current = chart; const style = getComputedStyle(root.current); const palette = [1,2,3,4,5,6].map(n => token(style,`--helix-color-chart-series-${n}`)); const text = token(style,'--helix-color-text-neutral-light'); const border = token(style,'--helix-color-border-neutral'); const fontFamily = token(style,'--helix-textStyle-body-s-regular-fontFamily'); const base = { color: palette, textStyle: { color: text, fontFamily }, tooltip: { trigger: variant === 'donut' ? 'item' : 'axis', backgroundColor: token(style,'--helix-color-fill-page'), borderColor: border, borderWidth: 1, textStyle: { color: token(style,'--helix-color-text-neutral'), fontFamily } }, legend: { show: false, selected: Object.fromEntries(entries.map(name => [name, !hidden.has(name)])) } }; const option = variant === 'donut' ? { ...base, series: [{ type: 'pie', radius: ['56%','78%'], data: categories.map((name,index) => ({ name, value: series[0]?.data[index] ?? 0 })) }] } : { ...base, grid: { left: 8,right: 16,top: 24,bottom: 8,containLabel: true }, xAxis: { type: 'category',data: categories,axisLine:{lineStyle:{color:border}},axisLabel:{color:text,fontFamily} }, yAxis: { type:'value',splitLine:{lineStyle:{color:border}},axisLabel:{color:text,fontFamily} }, series: series.map(item => ({ name:item.name,type: variant === 'line' || variant === 'timeline' || variant === 'area' ? 'line' : 'bar',stack: variant === 'stacked-bar' ? 'total' : undefined,smooth: variant === 'line' || variant === 'area',areaStyle: variant === 'area' ? {} : undefined,data:item.data })) }; chart.setOption(option, true); const observer = new ResizeObserver(() => chart.resize()); observer.observe(root.current); return () => observer.disconnect(); }, [variant,categories,series,label,description,height,themeVersion,hidden]);
  React.useEffect(() => () => instance.current?.dispose(), []);
  return <div data-helix-part="chart-root" data-variant={variant} className={cn(className)}><div ref={root} data-helix-part="chart-canvas" role="img" aria-label={description ? `${label}. ${description}` : label} style={{ height }} /><div data-helix-part="chart-legend" role={interactive ? 'group' : undefined} aria-label={interactive ? `${label} — show or hide series` : undefined}>{entries.map((name, index) => { const swatch = <span data-helix-part="chart-legend-swatch" aria-hidden="true" style={{ '--chart-swatch': `var(--helix-color-chart-series-${(index % 6) + 1})` } as React.CSSProperties} />; return interactive ? <button key={name} type="button" data-helix-part="chart-legend-item" aria-pressed={!hidden.has(name)} onClick={() => toggle(name)}>{swatch}{name}</button> : <span key={name} data-helix-part="chart-legend-item">{swatch}{name}</span>; })}</div><div data-helix-part="chart-data"><table><caption>{label}</caption><tbody>{categories.map((category,index) => <tr key={category}><th scope="row">{category}</th>{series.map(item => <td key={item.name}>{item.data[index] ?? 'No data'}</td>)}</tr>)}</tbody></table></div></div>;
};
Chart.displayName = 'Chart'; export { Chart };

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
  React.useEffect(() => { if (!root.current) return; const chart = instance.current ?? echarts.init(root.current); instance.current = chart; const style = getComputedStyle(root.current); const palette = [1,2,3,4,5].map(n => token(style,`--helix-color-chart-series-${n}`)); const text = token(style,'--helix-color-text-neutral-light'); const border = token(style,'--helix-color-border-neutral'); const fontFamily = token(style,'--helix-textStyle-body-s-regular-fontFamily'); const base = { color: palette, textStyle: { color: text, fontFamily }, tooltip: { trigger: variant === 'donut' ? 'item' : 'axis', backgroundColor: token(style,'--helix-color-fill-page'), borderColor: border, borderWidth: 1, textStyle: { color: token(style,'--helix-color-text-neutral'), fontFamily } }, legend: { bottom: 0, textStyle: { color: text, fontFamily } } }; const option = variant === 'donut' ? { ...base, series: [{ type: 'pie', radius: ['56%','78%'], data: categories.map((name,index) => ({ name, value: series[0]?.data[index] ?? 0 })) }] } : { ...base, grid: { left: 8,right: 16,top: 24,bottom: 48,containLabel: true }, xAxis: { type: 'category',data: categories,axisLine:{lineStyle:{color:border}},axisLabel:{color:text,fontFamily} }, yAxis: { type:'value',splitLine:{lineStyle:{color:border}},axisLabel:{color:text,fontFamily} }, series: series.map(item => ({ name:item.name,type: variant === 'line' || variant === 'timeline' || variant === 'area' ? 'line' : 'bar',stack: variant === 'stacked-bar' ? 'total' : undefined,smooth: variant === 'line' || variant === 'area',areaStyle: variant === 'area' ? {} : undefined,data:item.data })) }; chart.setOption(option, true); const observer = new ResizeObserver(() => chart.resize()); observer.observe(root.current); return () => observer.disconnect(); }, [variant,categories,series,label,description,height,themeVersion]);
  React.useEffect(() => () => instance.current?.dispose(), []);
  return <div data-helix-part="chart-root" data-variant={variant} className={cn(className)}><div ref={root} data-helix-part="chart-canvas" role="img" aria-label={description ? `${label}. ${description}` : label} style={{ height }} /><table data-helix-part="chart-data"><caption>{label}</caption><tbody>{categories.map((category,index) => <tr key={category}><th scope="row">{category}</th>{series.map(item => <td key={item.name}>{item.data[index] ?? 0}</td>)}</tr>)}</tbody></table></div>;
};
Chart.displayName = 'Chart'; export { Chart };

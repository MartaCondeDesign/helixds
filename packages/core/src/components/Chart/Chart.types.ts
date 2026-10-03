export type ChartVariant = 'line' | 'area' | 'bar' | 'stacked-bar' | 'donut' | 'timeline';
export interface ChartSeries { name: string; data: Array<number | null>; }
export interface ChartProps {
  variant: ChartVariant;
  categories: string[];
  series: ChartSeries[];
  label: string;
  description?: string;
  height?: number;
  className?: string;
}

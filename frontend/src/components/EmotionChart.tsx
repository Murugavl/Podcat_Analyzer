import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { EmotionRow } from '../lib/types';
import { useTheme } from '../hooks/useTheme';

interface EmotionChartProps {
  emotions: EmotionRow[];
}

export function EmotionChart({ emotions }: EmotionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axis = isDark ? '#a1a1aa' : '#52525b';
  const grid = isDark ? '#27272a' : '#e4e4e7';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipText = isDark ? '#fafafa' : '#18181b';
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  // Aggregate averages
  const aggregated = emotions.reduce((acc, curr) => {
    const key = curr.emotion;
    if (!acc[key]) {
      acc[key] = { total: 0, count: 0 };
    }
    acc[key].total += curr.score;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const data = Object.keys(aggregated)
    .map((emotion) => ({
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      score: parseFloat((aggregated[emotion].total / aggregated[emotion].count).toFixed(3)),
    }))
    .sort((a, b) => b.score - a.score);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-ink-faint border border-hairline/10 bg-hairline/10 rounded-2xl">
        No emotions detected to display.
      </div>
    );
  }

  return (
    <div className="w-full glass-card border border-hairline/10 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-ink mb-6">Average Emotion Scores Across Podcast</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke={axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '12px',
                color: tooltipText,
                fontSize: '12px'
              }}
              formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Average Score']}
              labelStyle={{ fontWeight: 'bold', color: tooltipText }}
              cursor={{ fill: cursorFill }}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill="url(#colorIndigo)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

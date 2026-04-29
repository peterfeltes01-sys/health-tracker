import { PieChart, Pie, Cell } from 'recharts'

interface Props {
  kcal: number
  goalKcal: number
  carbs: number
  fat: number
  protein: number
  size?: number
}

const MACRO_COLORS = {
  carbs: '#3b82f6',
  fat: '#f59e0b',
  protein: '#ef4444',
  rest: '#e5e7eb',
}

export function MacroDonut({ kcal, goalKcal, carbs, fat, protein, size = 140 }: Props) {
  const carbsKcal = carbs * 4
  const fatKcal = fat * 9
  const proteinKcal = protein * 4
  const consumed = carbsKcal + fatKcal + proteinKcal
  const remaining = Math.max(0, goalKcal - consumed)

  const data = consumed > 0
    ? [
        { name: 'Carbs', value: carbsKcal, color: MACRO_COLORS.carbs },
        { name: 'Fett', value: fatKcal, color: MACRO_COLORS.fat },
        { name: 'Eiweiß', value: proteinKcal, color: MACRO_COLORS.protein },
        ...(remaining > 0 ? [{ name: 'Rest', value: remaining, color: MACRO_COLORS.rest }] : []),
      ]
    : [{ name: 'Leer', value: 1, color: MACRO_COLORS.rest }]

  const pct = goalKcal > 0 ? Math.min(100, Math.round((kcal / goalKcal) * 100)) : 0
  const cx = size / 2
  const cy = size / 2
  const inner = size * 0.38
  const outer = size * 0.48

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={cx}
          cy={cy}
          innerRadius={inner}
          outerRadius={outer}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{pct}%</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{kcal} kcal</span>
      </div>
    </div>
  )
}

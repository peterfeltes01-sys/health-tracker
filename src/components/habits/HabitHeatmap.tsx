import { useMemo, useRef, useEffect } from 'react'
import { subDays } from 'date-fns'
import type { Habit, HabitEntry } from '../../types/habits'
import { toISODate } from '../../utils/calculations'
import { getCompletionLevel } from '../../lib/habitStats'

const CELL = 11
const GAP = 2
const STEP = CELL + GAP
const DAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']

interface HabitHeatmapProps {
  habit: Habit
  entries: HabitEntry[]
  today: string
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function HabitHeatmap({ habit, entries, today }: HabitHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const entryMap = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])
  const rgb = useMemo(() => hexToRgb(habit.color), [habit.color])
  const createdDate = habit.createdAt.slice(0, 10)

  // 365-day grid ending today
  const cells = useMemo(() => {
    const result: { date: string; level: number; beforeCreation: boolean }[] = []
    for (let i = 364; i >= 0; i--) {
      const date = toISODate(subDays(new Date(), i))
      const beforeCreation = date < createdDate
      const entry = entryMap.get(date)
      result.push({
        date,
        level: beforeCreation ? 0 : getCompletionLevel(entry, habit),
        beforeCreation,
      })
    }
    return result
  }, [entries, habit, today, createdDate])

  // Offset to align first cell to Monday (row=0)
  const firstDow = new Date(cells[0].date + 'T12:00:00').getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1 // Mon=0 … Sun=6

  const numWeeks = Math.ceil((cells.length + startOffset) / 7)
  const svgWidth = numWeeks * STEP
  const svgHeight = 7 * STEP + 14 // extra for month labels

  // Build flat grid array (col-major: col * 7 + row)
  const grid: ({ date: string; level: number; beforeCreation: boolean } | null)[] = Array(
    numWeeks * 7
  ).fill(null)
  cells.forEach((cell, i) => {
    grid[startOffset + i] = cell
  })

  // Month labels: collect first week-col per month
  const monthLabels = useMemo(() => {
    const seen = new Set<string>()
    const labels: { col: number; label: string }[] = []
    cells.forEach((cell, i) => {
      const col = Math.floor((startOffset + i) / 7)
      const month = cell.date.slice(0, 7)
      if (!seen.has(month)) {
        seen.add(month)
        labels.push({ col, label: new Date(cell.date + 'T12:00:00').toLocaleString('de', { month: 'short' }) })
      }
    })
    return labels
  }, [cells, startOffset])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex gap-1 items-start">
        {/* Day-of-week labels */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{ gap: GAP, marginTop: 18 }}
        >
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              style={{ height: CELL, width: 18, fontSize: 9 }}
              className="text-gray-400 flex items-center justify-end pr-1 leading-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Scrollable SVG */}
        <div ref={scrollRef} className="overflow-x-auto flex-1" style={{ paddingBottom: 4 }}>
          <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
            {/* Month labels */}
            {monthLabels.map(({ col, label }) => (
              <text
                key={`${col}-${label}`}
                x={col * STEP}
                y={10}
                fontSize={9}
                fill="#9ca3af"
                className="select-none"
              >
                {label}
              </text>
            ))}

            {/* Cells */}
            {grid.map((cell, idx) => {
              const col = Math.floor(idx / 7)
              const row = idx % 7
              const x = col * STEP
              const y = row * STEP + 14

              if (!cell) {
                return <rect key={idx} x={x} y={y} width={CELL} height={CELL} rx={2} fill="transparent" />
              }

              if (cell.beforeCreation) {
                return <rect key={idx} x={x} y={y} width={CELL} height={CELL} rx={2} fill="transparent" />
              }

              const alpha =
                cell.level === 0 ? 0 : Math.max(0.15, Math.min(1, 0.15 + cell.level * 0.85))
              const fill =
                alpha === 0
                  ? 'rgb(229,231,235)'
                  : `rgba(${rgb},${alpha.toFixed(2)})`

              return (
                <rect key={idx} x={x} y={y} width={CELL} height={CELL} rx={2} fill={fill}>
                  <title>
                    {cell.date}: {Math.round(cell.level * 100)}%
                  </title>
                </rect>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 justify-end pr-1">
        <span className="text-[10px] text-gray-400">weniger</span>
        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <div
            key={level}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 2,
              backgroundColor:
                level === 0
                  ? 'rgb(229,231,235)'
                  : `rgba(${rgb},${(0.15 + level * 0.85).toFixed(2)})`,
            }}
          />
        ))}
        <span className="text-[10px] text-gray-400">mehr</span>
      </div>
    </div>
  )
}

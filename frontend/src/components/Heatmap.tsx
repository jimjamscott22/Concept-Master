import type { HeatmapDay } from "../types"

interface HeatmapProps {
  days: HeatmapDay[]
  goal: number
}

/** GitHub-style 12-week activity heatmap. Days flow top-to-bottom (Mon→Sun),
 *  weeks left-to-right. The most recent day is the bottom-right cell. */
export function Heatmap({ days, goal }: HeatmapProps) {
  if (days.length === 0) return null

  // Pad the front so the first column starts on the correct weekday.
  // We treat Sunday as the first row (cell index 0).
  const first = new Date(days[0].date + "T00:00:00")
  const leadingPad = first.getDay()  // 0..6 (Sun..Sat)

  const cells: (HeatmapDay | null)[] = [
    ...Array(leadingPad).fill(null),
    ...days,
  ]

  // Group into columns of 7 (each column = one week, Sun..Sat)
  const weeks: (HeatmapDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const intensity = (day: HeatmapDay | null): string => {
    if (!day || day.reviewed_count === 0) return "bg-code"
    const ratio = day.reviewed_count / Math.max(goal, 1)
    if (ratio >= 1)    return "bg-green"
    if (ratio >= 0.66) return "bg-green/70"
    if (ratio >= 0.33) return "bg-green/40"
    return "bg-green/20"
  }

  return (
    <div className="flex gap-1 overflow-x-auto py-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.concat(Array(7 - week.length).fill(null)).map((day, di) => (
            <div
              key={di}
              title={
                day
                  ? `${day.date}: ${day.reviewed_count} review${day.reviewed_count === 1 ? "" : "s"}` +
                    (day.reviewed_count > 0
                      ? ` (${day.correct_count} correct)`
                      : "")
                  : ""
              }
              className={`w-3 h-3 rounded-sm ${intensity(day)} ${day ? "" : "opacity-30"}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

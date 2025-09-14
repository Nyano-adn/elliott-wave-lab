// src/utils/hitTest.ts
import { Wave } from '../store/waves'

export function hitTestSegment(
  wave: Wave,
  mouse: { x: number; y: number },
  xScale: (t: number) => number,
  yScale: (p: number) => number,
  tolPx = 6
): null | { aId: string; bId: string } {
  let best: null | { aId: string; bId: string } = null
  let bestDist = tolPx
  for (let i = 0; i < wave.points.length - 1; i++) {
    const a = wave.points[i]
    const b = wave.points[i + 1]
    const ax = xScale(a.t), ay = yScale(a.p)
    const bx = xScale(b.t), by = yScale(b.p)
    // distance point-segment
    const dx = bx - ax, dy = by - ay
    const len2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((mouse.x - ax) * dx + (mouse.y - ay) * dy) / len2))
    const px = ax + t * dx, py = ay + t * dy
    const d = Math.hypot(mouse.x - px, mouse.y - py)
    if (d <= bestDist) {
      bestDist = d
      best = { aId: a.id, bId: b.id }
    }
  }
  return best
}

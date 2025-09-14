// src/components/FiboOverlay.tsx
import React from 'react'
import { useWaves } from '../store/waves'

type Props = {
  xScale: (t: number) => number
  yScale: (p: number) => number
}

export default function FiboOverlay({ xScale, yScale }: Props) {
  const { fibos, waves } = useWaves()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)

    fibos.filter(f => f.visible && f.anchor).forEach((f) => {
      const w = waves.find((x) => x.id === f.anchor!.waveId)
      const a = w?.points.find((p) => p.id === f.anchor!.aId)
      const b = w?.points.find((p) => p.id === f.anchor!.bId)
      if (!a || !b) return
      const ax = xScale(a.t), ay = yScale(a.p)
      const bx = xScale(b.t), by = yScale(b.p)
      const minx = Math.min(ax, bx), maxx = Math.max(ax, bx)
      const miny = Math.min(ay, by), maxy = Math.max(ay, by)
      const dy = by - ay

      ctx.save()
      ctx.globalAlpha = f.opacity
      ctx.strokeStyle = f.color
      f.ratios.forEach((r) => {
        const y = ay + dy * r
        ctx.beginPath()
        ctx.moveTo(minx, y)
        ctx.lineTo(maxx, y)
        ctx.stroke()
      })
      ctx.restore()
    })
  }, [fibos, waves, xScale, yScale])

  return <canvas ref={canvasRef} width={800 * devicePixelRatio} height={500 * devicePixelRatio} style={{ width: 800, height: 500, pointerEvents: 'none' }} />
}

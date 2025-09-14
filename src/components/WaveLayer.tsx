// src/components/WaveLayer.tsx
import React, { useMemo, useRef } from 'react'
import { useWaves, Wave } from '../store/waves'
import { hitTestSegment } from '../utils/hitTest'

type Props = {
  waves: Wave[]
  xScale: (t: number) => number
  yScale: (p: number) => number
  invX: (x: number) => number
  invY: (y: number) => number
  snap?: (pt: { t: number; p: number }) => { t: number; p: number }
}

export default function WaveLayer({ waves, xScale, yScale, invX, invY, snap }: Props) {
  const { selection, setSelection, movePoint, moveSegment, insertPointOnSegment, duplicateWave } = useWaves()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dragging = useRef<null | { kind: 'point' | 'segment'; waveId: string; pointId?: string; aId?: string; bId?: string; start: { x: number; y: number } }>(null)

  // rendering (ex: via canvas 2D)
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    waves.forEach((w) => {
      ctx.strokeStyle = w.color
      ctx.lineWidth = 2
      ctx.beginPath()
      w.points.forEach((p, i) => {
        const x = xScale(p.t), y = yScale(p.p)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      // points
      w.points.forEach((p) => {
        const x = xScale(p.t), y = yScale(p.p)
        ctx.fillStyle = '#1f2937'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    })
    // selection highlight
    if (selection.type === 'segment') {
      const w = waves.find((x) => x.id === selection.waveId)
      const a = w?.points.find((p) => p.id === selection.aId)
      const b = w?.points.find((p) => p.id === selection.bId)
      if (a && b) {
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(xScale(a.t), yScale(a.p))
        ctx.lineTo(xScale(b.t), yScale(b.p))
        ctx.stroke()
      }
    }
  }

  React.useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const render = () => draw(ctx)
    render()
  }, [waves, selection])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        const sel = useWaves.getState().selection
        const wId =
          sel.type === 'wave' ? sel.waveId : sel.type === 'point' || sel.type === 'segment' ? sel.waveId : null
        if (wId) {
          e.preventDefault()
          duplicateWave(wId)
        }
      }
      if (e.key.toLowerCase() === 'i') {
        const sel = useWaves.getState().selection
        if (sel.type === 'segment') {
          // insert au milieu
          const w = useWaves.getState().waves.find((x) => x.id === sel.waveId)
          const a = w?.points.find((p) => p.id === sel.aId)
          const b = w?.points.find((p) => p.id === sel.bId)
          if (a && b) {
            const mid = { t: (a.t + b.t) / 2, p: (a.p + b.p) / 2 }
            insertPointOnSegment(sel.waveId, sel.aId, sel.bId, snap ? snap(mid) : mid)
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [duplicateWave, insertPointOnSegment, snap])

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // priorité: points (petite tolérance), sinon segments
    for (const w of waves) {
      for (const p of w.points) {
        const dx = x - xScale(p.t)
        const dy = y - yScale(p.p)
        if (Math.hypot(dx, dy) <= 6) {
          setSelection({ type: 'point', waveId: w.id, pointId: p.id })
          dragging.current = { kind: 'point', waveId: w.id, pointId: p.id, start: { x, y } }
          return
        }
      }
    }
    // segments
    for (const w of waves) {
      const seg = hitTestSegment(w, { x, y }, xScale, yScale, 6)
      if (seg) {
        setSelection({ type: 'segment', waveId: w.id, aId: seg.aId, bId: seg.bId })
        dragging.current = { kind: 'segment', waveId: w.id, aId: seg.aId, bId: seg.bId, start: { x, y } }
        return
      }
    }
    // clic vide => désélection
    setSelection({ type: 'none' })
  }

  const onMouseMove: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!dragging.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (dragging.current.kind === 'point') {
      const to = { t: invX(x), p: invY(y) }
      const s = snap ? snap(to) : to
      movePoint(dragging.current.waveId, dragging.current.pointId!, s)
    } else {
      // segment => déplacer les 2 points d’un delta
      const prev = dragging.current.start
      const dt = invX(x) - invX(prev.x)
      const dp = invY(y) - invY(prev.y)
      dragging.current.start = { x, y }
      const s = snap ? snap({ t: dt, p: dp }) : { t: dt, p: dp }
      moveSegment(dragging.current.waveId, dragging.current.aId!, dragging.current.bId!, s)
    }
  }

  const onMouseUp: React.MouseEventHandler<HTMLCanvasElement> = () => {
    dragging.current = null
  }

  const onDoubleClick: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // si un segment est sous la souris, insérer un point
    for (const w of waves) {
      const seg = hitTestSegment(w, { x, y }, xScale, yScale, 6)
      if (seg) {
        insertPointOnSegment(w.id, seg.aId, seg.bId, snap ? snap({ t: invX(x), p: invY(y) }) : { t: invX(x), p: invY(y) })
        return
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={window.devicePixelRatio * 800}
      height={window.devicePixelRatio * 500}
      style={{ width: 800, height: 500, cursor: 'crosshair' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
    />
  )
}

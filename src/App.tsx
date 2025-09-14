// src/App.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { createChart, UTCTimestamp } from 'lightweight-charts'
import WaveLayer from './components/WaveLayer'
import FiboOverlay from './components/FiboOverlay'
import Toolbar from './components/Toolbar'

type Scales = {
  xScale: (t: number) => number | null
  yScale: (p: number) => number | null
  invX: (x: number) => number | null
  invY: (y: number) => number | null
}

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scales, setScales] = useState<Scales | null>(null)

  // Données de test stables
  const data = useMemo(() => {
    const now = Math.floor(Date.now() / 1000) as UTCTimestamp
    return Array.from({ length: 300 }, (_, i) => ({
      time: (now - (300 - i) * 60) as UTCTimestamp,
      open: 10000 + i * 5,
      high: 10020 + i * 5,
      low: 9980 + i * 5,
      close: 10010 + i * 5,
    }))
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const root = containerRef.current

    const chart = createChart(root, {
      autoSize: true,
      layout: { background: { color: '#0b0f14' }, textColor: '#d6dee7' },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 1 },
    })

    const candle = chart.addCandlestickSeries()
    candle.setData(data)

    const tScale = chart.timeScale()
    const pScale = candle.priceScale()

    const xScale = (t: number) => tScale.timeToCoordinate(t as UTCTimestamp)
    const yScale = (p: number) => pScale.priceToCoordinate(p)
    const invX = (x: number) => {
      const v = tScale.coordinateToTime(x)
      if (v == null) return null
      if (typeof v === 'number') return v // UTCTimestamp (sec)
      // BusinessDay → timestamp (sec)
      const ts = Date.UTC(v.year, v.month - 1, v.day) / 1000
      return ts as number
    }
    const invY = (y: number) => pScale.coordinateToPrice(y)

    setScales({ xScale, yScale, invX, invY })

    // Optionnel: si tu veux forcer sur resize, utilise chart.resize
    const ro = new ResizeObserver(() => {
      chart.resize(root.clientWidth, root.clientHeight)
    })
    ro.observe(root)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [data])

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0b0f14' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          minHeight: 320
        }}
      >
        {scales && (
          <>
            <FiboOverlay
              xScale={scales.xScale}
              yScale={scales.yScale}
              invX={scales.invX}
              invY={scales.invY}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
            <WaveLayer
              xScale={scales.xScale}
              yScale={scales.yScale}
              invX={scales.invX}
              invY={scales.invY}
              style={{ position: 'absolute', inset: 0 }}
            />
            <Toolbar style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} />
          </>
        )}
      </div>
    </div>
  )
}

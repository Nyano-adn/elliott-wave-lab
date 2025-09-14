// src/components/Toolbar.tsx
import React from 'react'
import { useWaves } from '../store/waves'

export default function Toolbar() {
  const { selection, duplicateWave, fibos, toggleFibo, setFiboAnchor } = useWaves()
  const waveId = selection.type === 'wave' ? selection.waveId : selection.type === 'segment' || selection.type === 'point' ? selection.waveId : null
  const canAnchor = selection.type === 'segment'

  return (
    <div className="toolbar" style={{ display: 'flex', gap: 8 }}>
      <button disabled={!waveId} onClick={() => waveId && duplicateWave(waveId)}>Dupliquer (Ctrl/Cmd+D)</button>
      {fibos.map((f) => (
        <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={f.visible} onChange={() => toggleFibo(f.id)} />
          {f.name}
        </label>
      ))}
      <button disabled={!canAnchor} onClick={() => {
        if (selection.type === 'segment') {
          setFiboAnchor(fibos[0].id, { waveId: selection.waveId, aId: selection.aId, bId: selection.bId })
        }
      }}>Set as Fibo anchor</button>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { FieldConfig, FieldRow, FormItem, isRow, FIELD_PRESETS, DropZone } from '../lib/types'

interface FieldCardProps {
  item: FormItem
  index: number
  isSelected: boolean
  dropZone: DropZone
  isDragging: boolean
  draggedItem: FormItem | null
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onDragStart: (index: number, fieldId?: string) => void
  onDragOver: (index: number, zone: DropZone) => void
  onDrop: (index: number, zone: DropZone) => void
  onDragEnd: () => void
  onReorderInRow: (rowId: string, fromIdx: number, toIdx: number) => void
  onDropIntoRow: (rowId: string, fieldIndex: number) => void
  onRemoveFromRow: (rowId: string, fieldId: string) => void
}

const activeDrag = {
  fieldId: null as string | null,
  rowIdx: null as number | null,
  colIdx: null as number | null,
}

const FieldIcon = ({ type }: { type: string }) => {
  const preset = FIELD_PRESETS.find(p => p.config.type === type)
  return <span className="field-card-icon">{preset?.icon ?? '📝'}</span>
}

const getDropZone = (e: React.DragEvent, el: HTMLElement): DropZone => {
  const rect = el.getBoundingClientRect()
  const pct = (e.clientY - rect.top) / rect.height
  if (pct < 0.28) return 'above'
  if (pct > 0.72) return 'below'
  return 'merge'
}

const getHalfZone = (e: React.DragEvent, el: HTMLElement): 'above' | 'below' => {
  const rect = el.getBoundingClientRect()
  return (e.clientY - rect.top) < rect.height / 2 ? 'above' : 'below'
}

const GhostField: React.FC<{ field: FieldConfig }> = ({ field }) => {
  const preset = FIELD_PRESETS.find(p => p.config.type === field.type)
  return (
    <div className="ghost-field">
      <span className="ghost-icon">{preset?.icon ?? '📝'}</span>
      <span className="ghost-label">{field.label}</span>
    </div>
  )
}

const MergeZoneOverlay: React.FC<{ active: boolean }> = ({ active }) => (
  active ? <div className="merge-zone-overlay" /> : null
)

export const FieldCard: React.FC<FieldCardProps> = ({
  item, index, isSelected, dropZone, isDragging, draggedItem, selectedId,
  onSelect, onDelete, onDuplicate,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onReorderInRow,
}) => {
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingMerge, setPendingMerge] = useState(false)
  const [colDragOver, setColDragOver] = useState<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const insideRef = useRef(false)

  useEffect(() => () => { if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current) }, [])

  const clearMerge = () => {
    if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null }
  }

  if (!isRow(item)) {
    const showAbove = dropZone === 'above'
    const showBelow = dropZone === 'below'
    const showMerge = dropZone === 'merge' && pendingMerge
    const draggedField = (draggedItem && !isRow(draggedItem)) ? draggedItem as FieldConfig : null

    return (
      <div className="field-card-wrapper">
        {showAbove && <div className="drop-line drop-line-above" />}
        {showMerge && draggedField && (
          <div className="merge-preview">
            <GhostField field={draggedField} />
            <div className="merge-preview-divider">+</div>
            <GhostField field={item as FieldConfig} />
          </div>
        )}
        <div
          ref={cardRef}
          className={['field-card', isSelected && 'is-selected', isDragging && 'is-dragging', showMerge && 'is-merge-target'].filter(Boolean).join(' ')}
          draggable
          onDragStart={e => {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', String(index))
            activeDrag.fieldId = null; activeDrag.rowIdx = null; activeDrag.colIdx = null
            console.log('[DRAG] standalone start, index:', index)
            onDragStart(index)
          }}
          onDragEnter={e => { e.preventDefault(); insideRef.current = true }}
          onDragOver={e => {
            e.preventDefault()
            insideRef.current = true
            if (!cardRef.current) return
            const zone = getDropZone(e, cardRef.current)
            if (zone === 'merge') {
              if (!mergeTimerRef.current) {
                mergeTimerRef.current = setTimeout(() => {
                  if (insideRef.current) { setPendingMerge(true); onDragOver(index, 'merge') }
                }, 300)
              }
            } else {
              clearMerge(); setPendingMerge(false); onDragOver(index, zone)
            }
          }}
          onDragLeave={e => {
            if (cardRef.current && !cardRef.current.contains(e.relatedTarget as Node)) {
              insideRef.current = false; clearMerge(); setPendingMerge(false)
            }
          }}
          onDrop={e => {
            e.preventDefault(); e.stopPropagation()
            insideRef.current = false; clearMerge(); setPendingMerge(false)
            const zone = cardRef.current ? getDropZone(e, cardRef.current) : 'above'
            console.log('[DROP] on standalone card index:', index, 'zone:', zone, 'activeDrag.fieldId:', activeDrag.fieldId)
            onDrop(index, zone)
          }}
          onDragEnd={() => { insideRef.current = false; clearMerge(); setPendingMerge(false); onDragEnd() }}
          onClick={() => onSelect(item.id)}
        >
          <span className="drag-handle">⠿</span>
          <FieldIcon type={item.type} />
          <div className="field-card-meta">
            <span className="field-card-label">{item.label}</span>
            <span className="field-card-name">{item.fieldName}</span>
          </div>
          <span className="field-card-type">{item.type}</span>
          {item.required && <span className="badge-required">*</span>}
          <div className="field-card-actions">
            <button title="Duplicate" onClick={e => { e.stopPropagation(); onDuplicate(item.id) }}>⧉</button>
            <button title="Remove" className="danger" onClick={e => { e.stopPropagation(); onDelete(item.id) }}>×</button>
          </div>
          {dropZone === 'merge' && !isDragging && <MergeZoneOverlay active={true} />}
        </div>
        {showBelow && <div className="drop-line drop-line-below" />}
      </div>
    )
  }

  const row = item as FieldRow

  return (
    <div className="field-card-wrapper">
      {dropZone === 'above' && <div className="drop-line drop-line-above" />}
      <div
        ref={cardRef}
        className={`field-row-card ${isDragging ? 'is-dragging' : ''}`}
        draggable
        onDragStart={e => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', String(index))
          activeDrag.fieldId = null; activeDrag.rowIdx = null; activeDrag.colIdx = null
          console.log('[DRAG] row start, index:', index)
          onDragStart(index)
        }}
        onDragEnter={e => e.preventDefault()}
        onDragOver={e => {
          e.preventDefault()
          if (activeDrag.fieldId !== null) {
            console.log('[DRAGOVER] row card skipping — column drag in progress, fieldId:', activeDrag.fieldId)
            return
          }
          if (!cardRef.current) return
          onDragOver(index, getHalfZone(e, cardRef.current))
        }}
        onDrop={e => {
          e.preventDefault(); e.stopPropagation()
          setColDragOver(null)
          console.log('[DROP] on ROW card index:', index, 'activeDrag.fieldId:', activeDrag.fieldId)
          if (!cardRef.current) { onDrop(index, 'above'); return }
          onDrop(index, getHalfZone(e, cardRef.current))
        }}
        onDragEnd={() => {
          console.log('[DRAGEND] row card')
          activeDrag.fieldId = null; activeDrag.rowIdx = null; activeDrag.colIdx = null
          setColDragOver(null); onDragEnd()
        }}
      >
        <div className="field-row-header">
          <span className="drag-handle">⠿</span>
          <span className="field-row-label">Row — {row.columns.length} cols</span>
          <button className="option-remove" title="Delete row" onClick={() => onDelete(row.id)}>×</button>
        </div>
        <div className="field-row-columns">
          {row.columns.map((col, colIdx) => (
            <div
              key={col.id}
              className={`field-card field-card-col ${selectedId === col.id ? 'is-selected' : ''} ${colDragOver === colIdx ? 'drag-over-col' : ''}`}
              draggable
              onDragStart={e => {
                e.stopPropagation()
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', col.id)
                activeDrag.fieldId = col.id
                activeDrag.rowIdx = index
                activeDrag.colIdx = colIdx
                console.log('[DRAG] column start, col.id:', col.id, 'rowIdx:', index, 'colIdx:', colIdx)
                onDragStart(index, col.id)
              }}
              onDragOver={e => {
                e.preventDefault()
                e.stopPropagation()
                if (activeDrag.fieldId && activeDrag.rowIdx === index) {
                  setColDragOver(colIdx)
                }
              }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation()
                const fromCol = activeDrag.colIdx
                const wasInsideThisRow = activeDrag.rowIdx === index && activeDrag.fieldId !== null
                console.log('[DROP] on COLUMN colIdx:', colIdx, 'fromCol:', fromCol, 'wasInsideThisRow:', wasInsideThisRow)
                activeDrag.fieldId = null; activeDrag.rowIdx = null; activeDrag.colIdx = null
                setColDragOver(null)
                if (wasInsideThisRow && fromCol !== null && fromCol !== colIdx) {
                  onReorderInRow(row.id, fromCol, colIdx)
                } else if (!wasInsideThisRow) {
                  const zone = cardRef.current ? getHalfZone(e, cardRef.current) : 'above'
                  onDrop(index, zone)
                }
              }}
              onDragEnd={() => {
                console.log('[DRAGEND] column colIdx:', colIdx, 'activeDrag.fieldId was:', activeDrag.fieldId)
                activeDrag.fieldId = null; activeDrag.rowIdx = null; activeDrag.colIdx = null
                setColDragOver(null); onDragEnd()
              }}
              onClick={e => { e.stopPropagation(); onSelect(col.id) }}
            >
              <span className="drag-handle">⠿</span>
              <FieldIcon type={col.type} />
              <div className="field-card-meta">
                <span className="field-card-label">{col.label}</span>
                <span className="field-card-name">{col.fieldName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {dropZone === 'below' && <div className="drop-line drop-line-below" />}
    </div>
  )
}
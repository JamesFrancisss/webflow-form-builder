import React, { useState, useRef, useCallback } from 'react'
import { FieldConfig, FieldRow, FormItem, isRow, FIELD_PRESETS, DropZone } from '../lib/types'

interface FieldCardProps {
  item: FormItem
  index: number
  isSelected: boolean
  dropZone: DropZone          // what zone is being hovered
  isDragging: boolean          // this card is being dragged
  draggedItem: FormItem | null // what's being dragged (for ghost preview)
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

const FieldIcon = ({ type }: { type: string }) => {
  const preset = FIELD_PRESETS.find(p => p.config.type === type)
  return <span className="field-card-icon">{preset?.icon ?? '📝'}</span>
}

const getDropZone = (e: React.DragEvent, el: HTMLElement): DropZone => {
  const rect = el.getBoundingClientRect()
  const y = e.clientY - rect.top
  const pct = y / rect.height
  if (pct < 0.25) return 'above'
  if (pct > 0.75) return 'below'
  return 'merge'
}

// Ghost preview of a field (dimmed, mini)
const GhostField: React.FC<{ field: FieldConfig }> = ({ field }) => {
  const preset = FIELD_PRESETS.find(p => p.config.type === field.type)
  return (
    <div className="ghost-field">
      <span className="ghost-icon">{preset?.icon ?? '📝'}</span>
      <span className="ghost-label">{field.label}</span>
    </div>
  )
}

export const FieldCard: React.FC<FieldCardProps> = ({
  item, index, isSelected, dropZone, isDragging, draggedItem, selectedId,
  onSelect, onDelete, onDuplicate,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onReorderInRow,
}) => {
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingMerge, setPendingMerge] = useState(false)
  const [colDragOver, setColDragOver] = useState<number | null>(null)
  const colDragIdx = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!cardRef.current || isRow(item)) { onDragOver(index, 'above'); return }
    const zone = getDropZone(e, cardRef.current)

    if (zone === 'merge') {
      if (!mergeTimerRef.current) {
        mergeTimerRef.current = setTimeout(() => {
          setPendingMerge(true)
          onDragOver(index, 'merge')
        }, 300)
      }
    } else {
      if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null }
      setPendingMerge(false)
      onDragOver(index, zone)
    }
  }, [index, item, onDragOver])

  const handleDragLeave = useCallback(() => {
    if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null }
    setPendingMerge(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null }
    setPendingMerge(false)
    const zone = cardRef.current && !isRow(item) ? getDropZone(e, cardRef.current) : 'above'
    onDrop(index, zone)
  }, [index, item, onDrop])

  // Determine visual state
  const showLineAbove = dropZone === 'above'
  const showLineBelow = dropZone === 'below'
  const showMergePreview = dropZone === 'merge' && pendingMerge

  // Get dragged field for ghost preview
  const getDraggedField = (): FieldConfig | null => {
    if (!draggedItem) return null
    if (isRow(draggedItem)) return null
    return draggedItem as FieldConfig
  }
  const draggedField = getDraggedField()
  const thisField = !isRow(item) ? item as FieldConfig : null

  if (!isRow(item)) {
    return (
      <div className="field-card-wrapper">
        {showLineAbove && <div className="drop-line drop-line-above" />}

        {/* Merge ghost preview */}
        {showMergePreview && draggedField && thisField && (
          <div className="merge-preview">
            <GhostField field={draggedField} />
            <GhostField field={thisField} />
          </div>
        )}

        <div
          ref={cardRef}
          className={`field-card ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${showMergePreview ? 'is-merge-target' : ''}`}
          draggable
          onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); onDragStart(index) }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={onDragEnd}
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
        </div>

        {showLineBelow && <div className="drop-line drop-line-below" />}
      </div>
    )
  }

  // Row card
  const row = item as FieldRow
  return (
    <div className="field-card-wrapper">
      {showLineAbove && <div className="drop-line drop-line-above" />}
      <div
        ref={cardRef}
        className={`field-row-card ${dropZone === 'above' || dropZone === 'below' ? '' : ''} ${isDragging ? 'is-dragging' : ''}`}
        draggable
        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); onDragStart(index) }}
        onDragOver={e => { e.preventDefault(); onDragOver(index, 'above') }}
        onDrop={e => { e.preventDefault(); onDrop(index, 'above') }}
        onDragEnd={e => { onDragEnd(); setColDragOver(null); colDragIdx.current = null }}
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
                colDragIdx.current = colIdx
                onDragStart(index, col.id)
              }}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setColDragOver(colIdx) }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation()
                const from = colDragIdx.current
                if (from !== null && from !== colIdx) {
                  onReorderInRow(row.id, from, colIdx)
                } else {
                  onDrop(index, 'above')
                }
                setColDragOver(null); colDragIdx.current = null
              }}
              onDragEnd={() => { setColDragOver(null); colDragIdx.current = null; onDragEnd() }}
              onClick={e => { e.stopPropagation(); onSelect(col.id) }}
            >
              <span className="drag-handle" title="Drag to reorder">⠿</span>
              <FieldIcon type={col.type} />
              <div className="field-card-meta">
                <span className="field-card-label">{col.label}</span>
                <span className="field-card-name">{col.fieldName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showLineBelow && <div className="drop-line drop-line-below" />}
    </div>
  )
}
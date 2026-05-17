import React from 'react'
import { FieldConfig, FIELD_PRESETS } from '../lib/types'

interface FieldCardProps {
  field: FieldConfig
  isSelected: boolean
  index: number
  isDragOver: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  onDrop: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

export const FieldCard: React.FC<FieldCardProps> = ({
  field, isSelected, index, isDragOver, onSelect, onDelete, onDuplicate,
  onDragStart, onDragOver, onDragEnd, onDrop
}) => {
  const preset = FIELD_PRESETS.find(p => p.config.type === field.type)
  const icon = preset?.icon ?? '📝'

  return (
    <div
      className={`field-card ${isSelected ? 'is-selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(index))
        onDragStart(index)
      }}
      onDragOver={e => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(index)
      }}
      onDrop={e => {
        e.preventDefault()
        onDrop(index)
      }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      <span className="drag-handle" title="Drag to reorder">⠿</span>
      <span className="field-card-icon">{icon}</span>
      <div className="field-card-meta">
        <span className="field-card-label">{field.label}</span>
        <span className="field-card-name">{field.fieldName}</span>
      </div>
      <span className="field-card-type">{field.type}</span>
      {field.required && <span className="badge-required">*</span>}
      <div className="field-card-actions">
        <button title="Duplicate" onClick={e => { e.stopPropagation(); onDuplicate() }}>⧉</button>
        <button title="Remove" className="danger" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
      </div>
    </div>
  )
}
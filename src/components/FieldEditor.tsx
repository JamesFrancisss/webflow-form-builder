import React from 'react'
import {
  FieldConfig, INPUT_TYPE_OPTIONS, AUTOCOMPLETE_OPTIONS,
  inferInputMode, inferAutoComplete
} from '../lib/types'

interface Props { field: FieldConfig; onChange: (f: FieldConfig) => void }

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }

export const FieldEditor: React.FC<Props> = ({ field, onChange }) => {
  const set = (p: Partial<FieldConfig>) => onChange({ ...field, ...p })
  const needsOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
  const hasPlaceholder = !['checkbox', 'radio', 'hidden', 'date', 'toggle'].includes(field.type)

  return (
    <div className="field-editor">

      <div className="editor-section-label">Content</div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Label</span></div>
        <input className="prop-input" value={field.label}
          onChange={e => set({ label: e.target.value })} placeholder="Field label" />
      </div>

      <div className="prop-row">
        <div className="prop-label-wrap">
          <span className="prop-label">Field Name</span>
          <span className="prop-hint">Used in form submissions</span>
        </div>
        <input className="prop-input prop-input-mono" value={field.fieldName}
          onChange={e => set({ fieldName: slugify(e.target.value) })} placeholder="field_name" />
      </div>

      {hasPlaceholder && (
        <div className="prop-row">
          <div className="prop-label-wrap"><span className="prop-label">Placeholder</span></div>
          <input className="prop-input" value={field.placeholder}
            onChange={e => set({ placeholder: e.target.value })} placeholder="Placeholder text…" />
        </div>
      )}

      <div className="prop-row">
        <div className="prop-label-wrap">
          <span className="prop-label">Helper Text</span>
          <span className="prop-hint">Shown below the field</span>
        </div>
        <input className="prop-input" value={field.helpText}
          onChange={e => set({ helpText: e.target.value })} placeholder="e.g. We'll never share your email" />
      </div>

      <div className="editor-section-label">Validation</div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Required</span></div>
        <div className="segment-control">
          {(['Yes', 'No'] as const).map(v => (
            <button key={v} className={`segment-btn ${(field.required ? 'Yes' : 'No') === v ? 'active' : ''}`}
              onClick={() => set({ required: v === 'Yes' })}>{v}</button>
          ))}
        </div>
      </div>

      {field.required && (
        <div className="prop-row">
          <div className="prop-label-wrap">
            <span className="prop-label">Error Message</span>
            <span className="prop-hint">Shown when left empty</span>
          </div>
          <input className="prop-input" value={field.validationMessage}
            onChange={e => set({ validationMessage: e.target.value })}
            placeholder="This field is required" />
        </div>
      )}

      <div className="editor-section-label">Label Style</div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Label Visibility</span></div>
        <div className="segment-control">
          {(['visible', 'hidden', 'floating'] as const).map(v => (
            <button key={v} className={`segment-btn ${field.labelVariant === v ? 'active' : ''}`}
              onClick={() => set({ labelVariant: v })}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-section-label">Advanced</div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Field Type</span></div>
        <select className="prop-select" value={field.type}
          onChange={e => {
            const t = e.target.value as FieldConfig['type']
            set({ type: t, inputMode: inferInputMode(t), autoComplete: inferAutoComplete(t) })
          }}>
          {INPUT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Auto Complete</span></div>
        <select className="prop-select" value={field.autoComplete}
          onChange={e => set({ autoComplete: e.target.value as any })}>
          {AUTOCOMPLETE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {needsOptions && (
        <>
          <div className="editor-section-label">Options</div>
          <div className="options-editor">
            {field.options.map((opt, i) => (
              <div key={i} className="option-row">
                <input className="prop-input" value={opt.label}
                  onChange={e => {
                    const next = field.options.map((o, idx) =>
                      idx === i ? { label: e.target.value, value: slugify(e.target.value) || `option_${i + 1}` } : o)
                    set({ options: next })
                  }} placeholder="Option label" />
                <span className="option-value">{opt.value}</span>
                <button className="option-remove"
                  onClick={() => set({ options: field.options.filter((_, idx) => idx !== i) })}>×</button>
              </div>
            ))}
            <button className="btn-add-option"
              onClick={() => {
                const n = field.options.length + 1
                set({ options: [...field.options, { label: `Option ${n}`, value: `option_${n}` }] })
              }}>+ Add option</button>
          </div>
        </>
      )}
    </div>
  )
}
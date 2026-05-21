import React from 'react'
import {
FieldConfig, INPUT_TYPE_OPTIONS, AUTOCOMPLETE_OPTIONS,
DATE_FORMAT_OPTIONS, DateFormat, DateMode, CheckboxMode,
inferInputMode, inferAutoComplete
} from '../lib/types'

interface Props { field: FieldConfig; onChange: (f: FieldConfig) => void }

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }

export const FieldEditor: React.FC<Props> = ({ field, onChange }) => {
const set = (p: Partial<FieldConfig>) => onChange({ ...field, ...p })
const isCheckbox = field.type === 'checkbox'
const checkboxMode = field.checkboxMode ?? 'single'
const isCheckboxGroup = isCheckbox && checkboxMode === 'group'
const needsOptions = field.type === 'select' || field.type === 'radio' || isCheckboxGroup
const hasPlaceholder = !['checkbox', 'radio', 'hidden', 'date', 'toggle'].includes(field.type)
const isDate = field.type === 'date'

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

{/* ── Checkbox-specific options ── */}
    {isCheckbox && (
    <>
        <div className="editor-section-label">Checkbox Settings</div>
        <div className="prop-row">
        <div className="prop-label-wrap">
            <span className="prop-label">Selection type</span>
            <span className="prop-hint">Single consent or multiple choices</span>
        </div>
        <div className="segment-control">
            {(['single', 'group'] as CheckboxMode[]).map(v => (
            <button key={v} className={`segment-btn ${checkboxMode === v ? 'active' : ''}`}
                onClick={() => {
                const next: Partial<FieldConfig> = { checkboxMode: v }
                if (v === 'group' && field.options.length <= 1) {
                    next.options = [
                    { label: 'Option 1', value: 'option_1' },
                    { label: 'Option 2', value: 'option_2' },
                    ]
                }
                set(next)
                }}>
                {v === 'single' ? 'Single' : 'Group'}
            </button>
            ))}
        </div>
        </div>
    </>
    )}
    
    {/* ── Date-specific options ── */}
    {isDate && (
    <>
        <div className="editor-section-label">Date Settings</div>

        <div className="prop-row">
        <div className="prop-label-wrap">
            <span className="prop-label">Selection Mode</span>
            <span className="prop-hint">Single date or a start/end range</span>
        </div>
        <div className="segment-control">
            {(['single', 'range'] as DateMode[]).map(v => (
            <button key={v} className={`segment-btn ${(field.dateMode ?? 'single') === v ? 'active' : ''}`}
                onClick={() => set({ dateMode: v })}>
                {v === 'single' ? 'Single' : 'Range'}
            </button>
            ))}
        </div>
        </div>

        <div className="prop-row">
        <div className="prop-label-wrap">
            <span className="prop-label">Date Format</span>
            <span className="prop-hint">Display format for the placeholder</span>
        </div>
        <select className="prop-select" value={field.dateFormat ?? 'DD/MM/YYYY'}
            onChange={e => set({ dateFormat: e.target.value as DateFormat })}>
            {DATE_FORMAT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
        </div>
    </>
    )}

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

    {!isDate && (
    <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Auto Complete</span></div>
        <select className="prop-select" value={field.autoComplete}
        onChange={e => set({ autoComplete: e.target.value as any })}>
        {AUTOCOMPLETE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
    )}

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
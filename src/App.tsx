import React, { useState, useCallback, useRef, useEffect } from 'react'
import { FieldCard } from './components/FieldCard'
import { FieldEditor } from './components/FieldEditor'
import { FormSettings } from './components/FormSettings'
import { StyleSettings } from './components/StyleSettings'
import {
FIELD_PRESETS, createField, createRow, createDefaultForm,
FieldConfig, FormItem, FormConfig,
PADDING_VALUES, BUTTON_PADDING_VALUES,
isRow, saveTheme, loadTheme, DropZone,
} from './lib/types'

declare const webflow: any

// ─── Style helpers ────────────────────────────────────────────────────────────
async function ensureStyle(name: string, props: Record<string, string>) {
try {
const existing = await webflow.getStyleByName(name)
if (existing) return existing
} catch {}
const style = await webflow.createStyle(name)
await style.setProperties(props)
return style
}

// ─── Build a single field into a parent builder element ───────────────────────
function buildFieldEl(field: FieldConfig, parent: any, styles: Record<string, any>) {
const wrapper = parent.append(webflow.elementPresets.DOM)
wrapper.setTag('div')
wrapper.setStyles([styles.fbField])

if (field.labelVariant !== 'hidden') {
const label = wrapper.append(webflow.elementPresets.DOM)
label.setTag('label')
label.setTextContent(field.label + (field.required ? ' *' : ''))
label.setStyles([styles.fbLabel])
}

if (field.type === 'date' && field.dateMode === 'range') {
// Date range: two inputs in a flex row
const rangeRow = wrapper.append(webflow.elementPresets.DOM)
rangeRow.setTag('div')
rangeRow.setAttribute('style', 'display:flex;gap:8px;width:100%;')

const startWrap = rangeRow.append(webflow.elementPresets.DOM)
startWrap.setTag('div')
startWrap.setAttribute('style', 'flex:1;display:flex;flex-direction:column;gap:4px;')
const startLabel = startWrap.append(webflow.elementPresets.DOM)
startLabel.setTag('label')
startLabel.setTextContent('Start date')
startLabel.setStyles([styles.fbLabel])
const startInput = startWrap.append(webflow.elementPresets.DOM)
startInput.setTag('input')
startInput.setAttribute('type', 'date')
startInput.setAttribute('name', field.fieldName + '_start')
startInput.setAttribute('placeholder', field.dateFormat ?? 'DD/MM/YYYY')
if (field.required) startInput.setAttribute('required', 'true')
startInput.setStyles([styles.fbInput])

const endWrap = rangeRow.append(webflow.elementPresets.DOM)
endWrap.setTag('div')
endWrap.setAttribute('style', 'flex:1;display:flex;flex-direction:column;gap:4px;')
const endLabel = endWrap.append(webflow.elementPresets.DOM)
endLabel.setTag('label')
endLabel.setTextContent('End date')
endLabel.setStyles([styles.fbLabel])
const endInput = endWrap.append(webflow.elementPresets.DOM)
endInput.setTag('input')
endInput.setAttribute('type', 'date')
endInput.setAttribute('name', field.fieldName + '_end')
endInput.setAttribute('placeholder', field.dateFormat ?? 'DD/MM/YYYY')
endInput.setStyles([styles.fbInput])
} else if (field.type === 'textarea') {
const ta = wrapper.append(webflow.elementPresets.DOM)
ta.setTag('textarea')
ta.setAttribute('name', field.fieldName)
ta.setAttribute('placeholder', field.placeholder)
if (field.required) ta.setAttribute('required', 'true')
ta.setStyles([styles.fbTextarea])
} else if (field.type === 'select') {
const sel = wrapper.append(webflow.elementPresets.DOM)
sel.setTag('select')
sel.setAttribute('name', field.fieldName)
if (field.required) sel.setAttribute('required', 'true')
sel.setStyles([styles.fbInput])
for (const o of field.options) {
const opt = sel.append(webflow.elementPresets.DOM)
opt.setTag('option')
opt.setAttribute('value', o.value)
opt.setTextContent(o.label)
}
} else if (field.type === 'checkbox' || field.type === 'radio') {
const isGroup = field.type === 'radio' || (field.type === 'checkbox' && field.checkboxMode === 'group')
if (isGroup) {
for (const o of field.options) {
const row = wrapper.append(webflow.elementPresets.DOM)
row.setTag('div')
row.setAttribute('style', 'display:flex;align-items:center;gap:8px;margin-bottom:4px;')
const inp = row.append(webflow.elementPresets.DOM)
inp.setTag('input')
inp.setAttribute('type', field.type)
inp.setAttribute('name', field.fieldName)
inp.setAttribute('value', o.value)
const lbl = row.append(webflow.elementPresets.DOM)
lbl.setTag('label')
lbl.setTextContent(o.label)
lbl.setStyles([styles.fbLabel])
}
} else {
const row = wrapper.append(webflow.elementPresets.DOM)
row.setTag('div')
row.setAttribute('style', 'display:flex;align-items:center;gap:8px;')
const inp = row.append(webflow.elementPresets.DOM)
inp.setTag('input')
inp.setAttribute('type', 'checkbox')
inp.setAttribute('name', field.fieldName)
inp.setAttribute('value', field.options[0]?.value ?? field.fieldName)
if (field.required) inp.setAttribute('required', 'true')
const lbl = row.append(webflow.elementPresets.DOM)
lbl.setTag('label')
lbl.setTextContent(field.options[0]?.label ?? field.label)
lbl.setStyles([styles.fbLabel])
}
} else if (field.type !== 'hidden') {
const input = wrapper.append(webflow.elementPresets.DOM)
input.setTag('input')
input.setAttribute('type', field.type === 'toggle' ? 'checkbox' : field.type)
input.setAttribute('name', field.fieldName)
input.setAttribute('placeholder', field.type === 'date' ? (field.dateFormat ?? 'DD/MM/YYYY') : field.placeholder)
if (field.required) input.setAttribute('required', 'true')
if (field.defaultValue) input.setAttribute('value', field.defaultValue)
input.setAttribute('inputmode', field.inputMode)
input.setAttribute('autocomplete', field.autoComplete)
input.setStyles([styles.fbInput])
}

if (field.helpText) {
const help = wrapper.append(webflow.elementPresets.DOM)
help.setTag('p')
help.setTextContent(field.helpText)
help.setStyles([styles.fbHelp])
}
}

// ─── Build and insert form ────────────────────────────────────────────────────
async function buildForm(items: FormItem[], formConfig: FormConfig) {
const selected = await webflow.getSelectedElement()
if (!selected) throw new Error('Please select an element on the canvas first.')

const t = formConfig.theme
const inputProps = {
'width': '100%',
'padding': PADDING_VALUES[t.inputPadding],
'font-size': `${t.inputFontSize}px`,
'border-width': '1px', 'border-style': 'solid',
'border-color': t.inputBorderColor,
'border-radius': `${t.inputBorderRadius}px`,
'background-color': t.inputBgColor,
'color': t.inputTextColor,
'outline': 'none', 'box-sizing': 'border-box',
}

const fbField    = await ensureStyle('fb-field', { 'display': 'flex', 'flex-direction': 'column', 'row-gap': '6px', 'width': '100%' })
const fbColField = await ensureStyle('fb-col-field', { 'display': 'flex', 'flex-direction': 'column', 'row-gap': '6px', 'flex': '1', 'min-width': '0' })
const fbLabel    = await ensureStyle('fb-label', { 'font-size': `${t.labelFontSize}px`, 'font-weight': t.labelFontWeight, 'color': t.labelColor, 'display': 'block', 'margin-bottom': '4px' })
const fbInput    = await ensureStyle('fb-input', inputProps)
const fbTextarea = await ensureStyle('fb-textarea', { ...inputProps, 'min-height': '120px', 'resize': 'vertical' })
const fbSubmit   = await ensureStyle('fb-submit', { 'padding': BUTTON_PADDING_VALUES[t.buttonPadding], 'font-size': `${t.inputFontSize}px`, 'font-weight': '600', 'background-color': t.primaryColor, 'color': t.buttonTextColor, 'border-width': '0px', 'border-radius': `${t.buttonBorderRadius}px`, 'cursor': 'pointer', 'width': '100%', 'text-align': 'center', 'display': 'block' })
const fbHelp     = await ensureStyle('fb-help', { 'font-size': '12px', 'color': t.placeholderColor, 'margin-top': '4px' })
const fbRow      = await ensureStyle('fb-row', { 'display': 'flex', 'flex-direction': 'row', 'gap': `${t.columnGap}px`, 'width': '100%' })
// Padding applied ONLY to fb-form, not fb-wrapper
const fbForm     = await ensureStyle('fb-form', {
'display': 'flex', 'flex-direction': 'column',
'row-gap': `${t.fieldGap}px`, 'width': '100%',
'padding': PADDING_VALUES[t.inputPadding],
'background-color': t.formBgColor,
'border-radius': `${t.wrapperBorderRadius}px`,
'box-sizing': 'border-box',
})
// fb-wrapper: no padding — just a shell
const fbWrapper  = await ensureStyle('fb-wrapper', { 'width': '100%', 'padding': '0px', 'margin': '0px' })

const styles = { fbField, fbColField, fbLabel, fbInput, fbTextarea, fbSubmit, fbHelp, fbRow, fbForm }

const formWrapper = await selected.after(webflow.elementPresets.FormForm)
const wrapperChildren = await formWrapper.getChildren()
const formEl = wrapperChildren[0]

await formEl.setSettings({ name: formConfig.formName, method: 'post', redirect: formConfig.redirectUrl || '' })
await formWrapper.setStyles([fbWrapper])

const defaultChildren = await formEl.getChildren()
const submitBtn = defaultChildren[defaultChildren.length - 1]
for (const child of defaultChildren.slice(0, -1)) await child.remove()

const formBody = webflow.elementBuilder(webflow.elementPresets.DOM)
formBody.setTag('div')
formBody.setStyles([fbForm])

for (const item of items) {
if (isRow(item)) {
const rowEl = formBody.append(webflow.elementPresets.DOM)
rowEl.setTag('div')
rowEl.setStyles([fbRow])
for (const col of item.columns) {
const colWrapper = rowEl.append(webflow.elementPresets.DOM)
colWrapper.setTag('div')
colWrapper.setStyles([fbColField])
if (col.labelVariant !== 'hidden') {
    const label = colWrapper.append(webflow.elementPresets.DOM)
    label.setTag('label')
    label.setTextContent(col.label + (col.required ? ' *' : ''))
    label.setStyles([fbLabel])
}
if (col.type === 'textarea') {
    const ta = colWrapper.append(webflow.elementPresets.DOM)
    ta.setTag('textarea'); ta.setAttribute('name', col.fieldName); ta.setAttribute('placeholder', col.placeholder)
    if (col.required) ta.setAttribute('required', 'true'); ta.setStyles([fbTextarea])
} else if (col.type === 'checkbox' || col.type === 'radio') {
        const isGroup = col.type === 'radio' || (col.type === 'checkbox' && col.checkboxMode === 'group')
        if (isGroup) {
        for (const o of col.options) {
            const row = colWrapper.append(webflow.elementPresets.DOM)
            row.setTag('div')
            row.setAttribute('style', 'display:flex;align-items:center;gap:8px;margin-bottom:4px;')
            const inp = row.append(webflow.elementPresets.DOM)
            inp.setTag('input'); inp.setAttribute('type', col.type)
            inp.setAttribute('name', col.fieldName); inp.setAttribute('value', o.value)
            const lbl = row.append(webflow.elementPresets.DOM)
            lbl.setTag('label'); lbl.setTextContent(o.label); lbl.setStyles([fbLabel])
        }
        } else {
        const row = colWrapper.append(webflow.elementPresets.DOM)
        row.setTag('div'); row.setAttribute('style', 'display:flex;align-items:center;gap:8px;')
        const inp = row.append(webflow.elementPresets.DOM)
        inp.setTag('input'); inp.setAttribute('type', 'checkbox')
        inp.setAttribute('name', col.fieldName)
        inp.setAttribute('value', col.options[0]?.value ?? col.fieldName)
        if (col.required) inp.setAttribute('required', 'true')
        const lbl = row.append(webflow.elementPresets.DOM)
        lbl.setTag('label'); lbl.setTextContent(col.options[0]?.label ?? col.label); lbl.setStyles([fbLabel])
        }
    } else if (col.type !== 'hidden') {
        const input = colWrapper.append(webflow.elementPresets.DOM)
        input.setTag('input'); input.setAttribute('type', col.type === 'toggle' ? 'checkbox' : col.type)
        input.setAttribute('name', col.fieldName); input.setAttribute('placeholder', col.placeholder)
        if (col.required) input.setAttribute('required', 'true')
        input.setAttribute('inputmode', col.inputMode); input.setAttribute('autocomplete', col.autoComplete)
        input.setStyles([fbInput])
    }
if (col.helpText) {
    const help = colWrapper.append(webflow.elementPresets.DOM)
    help.setTag('p'); help.setTextContent(col.helpText); help.setStyles([fbHelp])
}
}
} else {
buildFieldEl(item, formBody, styles)
}
}

const btn = formBody.append(webflow.elementPresets.DOM)
btn.setTag('button'); btn.setAttribute('type', 'submit')
btn.setTextContent(formConfig.buttonLabel); btn.setStyles([fbSubmit])

await submitBtn.before(formBody)
await submitBtn.remove()
}

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: { label: string; icon: string; items: FormItem[] }[] = [
{
label: 'Contact', icon: '✉️',
items: [
createRow([
createField({ label: 'First Name', fieldName: 'first_name', placeholder: 'First name', type: 'text', autoComplete: 'given-name', inputMode: 'text' }),
createField({ label: 'Last Name', fieldName: 'last_name', placeholder: 'Last name', type: 'text', autoComplete: 'family-name', inputMode: 'text' }),
]),
createField({ label: 'Email', fieldName: 'email', placeholder: 'you@example.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' }),
createField({ label: 'Message', fieldName: 'message', placeholder: 'Your message…', type: 'textarea', autoComplete: 'off', inputMode: 'text' }),
],
},
{
label: 'Lead Gen', icon: '🎯',
items: [
createRow([
createField({ label: 'Full Name', fieldName: 'full_name', placeholder: 'Your name', type: 'text', autoComplete: 'name', inputMode: 'text' }),
createField({ label: 'Work Email', fieldName: 'email', placeholder: 'you@company.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' }),
]),
createRow([
createField({ label: 'Company', fieldName: 'company', placeholder: 'Company name', type: 'text', autoComplete: 'organization', inputMode: 'text' }),
createField({ label: 'Phone', fieldName: 'phone', placeholder: '+44 7700 000000', type: 'tel', autoComplete: 'tel', inputMode: 'tel' }),
]),
],
},
{
label: 'Newsletter', icon: '📧',
items: [
createRow([
createField({ label: 'First Name', fieldName: 'first_name', placeholder: 'First name', type: 'text', autoComplete: 'given-name', inputMode: 'text' }),
createField({ label: 'Email', fieldName: 'email', placeholder: 'you@example.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' }),
]),
],
},
]

type Panel = 'fields' | 'style' | 'form'

// ─── Preview Field ────────────────────────────────────────────────────────────
const PreviewField: React.FC<{
field: FieldConfig; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties
placeholderColor: string; isSelected: boolean; onSelect: () => void
}> = ({ field, inputStyle, labelStyle, placeholderColor, isSelected, onSelect }) => (
<div className={`preview-field ${isSelected ? 'is-selected' : ''}`} onClick={onSelect} title="Click to edit">
{field.labelVariant !== 'hidden' && (
<label style={labelStyle}>{field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}</label>
)}
{field.type === 'textarea' && <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder={field.placeholder} readOnly />}
{field.type === 'select' && (
<select style={{ ...inputStyle, appearance: 'auto' }}>
<option>{field.placeholder || 'Select…'}</option>
{field.options.map((o, i) => <option key={i}>{o.label}</option>)}
</select>
)}
{(field.type === 'checkbox' || field.type === 'radio') && (() => {
const isGroup = field.type === 'radio' || (field.type === 'checkbox' && field.checkboxMode === 'group')
if (isGroup) {
return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {field.options.map((o, i) => (
        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 400 }}>
        <input type={field.type} readOnly /> {o.label}
        </label>
    ))}
    </div>
)
}
return (
<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 400 }}>
    <input type="checkbox" readOnly /> {field.options[0]?.label ?? field.label}
</label>
)
})()}
{field.type === 'toggle' && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 400 }}><input type="checkbox" readOnly /> {field.label}</label>}
{field.type === 'hidden' && <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Hidden: <code>{field.fieldName}</code></div>}
{field.type === 'date' && field.dateMode === 'range' ? (
<div style={{ display: 'flex', gap: 8 }}>
<div style={{ flex: 1 }}>
    <label style={{ ...labelStyle, fontSize: 11, marginBottom: 3 }}>Start date</label>
    <input style={inputStyle} type="date" readOnly placeholder={field.dateFormat ?? 'DD/MM/YYYY'} />
</div>
<div style={{ flex: 1 }}>
    <label style={{ ...labelStyle, fontSize: 11, marginBottom: 3 }}>End date</label>
    <input style={inputStyle} type="date" readOnly placeholder={field.dateFormat ?? 'DD/MM/YYYY'} />
</div>
</div>
) : field.type === 'date' ? (
<input style={inputStyle} type="date" readOnly />
) : null}
{!['textarea','select','checkbox','radio','toggle','hidden','date'].includes(field.type) && (
<input style={inputStyle} type={field.type} placeholder={field.placeholder} readOnly />
)}
{field.helpText && <p style={{ fontSize: 12, color: placeholderColor, margin: '4px 0 0' }}>{field.helpText}</p>}
</div>
)

// ─── Live Preview ─────────────────────────────────────────────────────────────
const LivePreview: React.FC<{
items: FormItem[]; formConfig: FormConfig; selectedId: string | null; onSelect: (id: string) => void
}> = ({ items, formConfig, selectedId, onSelect }) => {
const t = formConfig.theme
const inputStyle: React.CSSProperties = {
width: '100%',
padding: PADDING_VALUES[t.inputPadding],
fontSize: t.inputFontSize,
border: `1px solid ${t.inputBorderColor}`,
borderRadius: t.inputBorderRadius,
background: t.inputBgColor,
color: t.inputTextColor,
outline: 'none',
boxSizing: 'border-box',
fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
fontSize: t.labelFontSize,
fontWeight: t.labelFontWeight as any,
color: t.labelColor,
display: 'block',
marginBottom: 4,
}
return (
<div className="preview-pane">
<div className="preview-label">Preview <span className="preview-hint">Click a field to edit</span></div>
<div className="preview-scroll">
{/* Preview form: padding from theme, applied inline — matches fb-form */}
<div
    className="preview-form"
    style={{
    gap: t.fieldGap,
    background: t.formBgColor && t.formBgColor !== 'transparent' ? t.formBgColor : '#fff',
    borderRadius: t.wrapperBorderRadius,
    padding: PADDING_VALUES[t.inputPadding],
    }}
>
    {items.length === 0 && <div className="preview-empty">Add fields to see a preview</div>}
    {items.map(item => isRow(item) ? (
    <div key={item.id} style={{ display: 'flex', gap: t.columnGap, width: '100%' }}>
        {item.columns.map(col => (
        <div key={col.id} style={{ flex: 1, minWidth: 0 }}>
            <PreviewField field={col} inputStyle={inputStyle} labelStyle={labelStyle}
            placeholderColor={t.placeholderColor} isSelected={selectedId === col.id}
            onSelect={() => onSelect(col.id)} />
        </div>
        ))}
    </div>
    ) : (
    <PreviewField key={item.id} field={item} inputStyle={inputStyle} labelStyle={labelStyle}
        placeholderColor={t.placeholderColor} isSelected={selectedId === item.id}
        onSelect={() => onSelect(item.id)} />
    ))}
    {items.length > 0 && (
    <button style={{
        padding: BUTTON_PADDING_VALUES[t.buttonPadding],
        fontSize: t.inputFontSize,
        fontWeight: 600,
        background: t.primaryColor,
        color: t.buttonTextColor,
        border: 'none',
        borderRadius: t.buttonBorderRadius,
        cursor: 'default',
        width: '100%',
        fontFamily: 'inherit',
    }}>
        {formConfig.buttonLabel}
    </button>
    )}
</div>
</div>
</div>
)
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────
const IntroScreen: React.FC<{ onTemplate: (items: FormItem[]) => void; onAddField: () => void }> = ({ onTemplate, onAddField }) => (
<div className="intro-screen">
<div className="intro-hero">
<div className="intro-icon">⊞</div>
<h2 className="intro-title">Native Form Builder</h2>
<p className="intro-subtitle">Build beautiful, accessible forms directly inside Webflow.</p>
<button className="btn-primary" onClick={onAddField}>+ Add your first field</button>
</div>
<div className="intro-templates">
<div className="intro-templates-label">Or start with a template</div>
<div className="intro-template-grid">
{TEMPLATES.map((t, i) => (
    <button key={i} className="template-btn" onClick={() => onTemplate(t.items)}>
        <span className="template-icon">{t.icon}</span>
        <span className="template-label">{t.label}</span>
        <span className="template-count">{t.items.length} rows</span>
    </button>
))}
</div>
</div>
</div>
)

// ─── Split layout (Style/Form tabs) ─────────────────────────────────────────
// Defined OUTSIDE App so it has a stable identity across renders.
// If defined inside App, every state change (slider, color picker) would
// recreate the component, unmount the scroll container, and reset scroll position.
const SplitWithPreview: React.FC<{
children: React.ReactNode
items: FormItem[]
formConfig: FormConfig
onSelectPanel: () => void
}> = ({ children, items, formConfig, onSelectPanel }) => (
<div className="split-layout">
<div className="left-panel form-panel">
<div className="style-scroll-panel">{children}</div>
</div>
<div className="right-panel">
<LivePreview items={items} formConfig={formConfig} selectedId={null} onSelect={onSelectPanel} />
</div>
</div>
)

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
const [items, setItems] = useState<FormItem[]>([])
const [formConfig, setFormConfig] = useState<FormConfig>(createDefaultForm)
const [selectedId, setSelectedId] = useState<string | null>(null)
const [panel, setPanel] = useState<Panel>('fields')
const [building, setBuilding] = useState(false)
const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
const [showPresets, setShowPresets] = useState(false)
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
const [dropZone, setDropZone] = useState<DropZone>(null)
const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
// Drop zone indicator above the list (for dragging to index 0)
const [dropBeforeFirst, setDropBeforeFirst] = useState(false)
const dragIndex = useRef<number | null>(null)
const dragFieldId = useRef<string | null>(null)
const fieldListRef = useRef<HTMLDivElement>(null)

const hasItems = items.length > 0

const findSelected = (): FieldConfig | null => {
for (const item of items) {
if (!isRow(item) && item.id === selectedId) return item
if (isRow(item)) { const col = item.columns.find(c => c.id === selectedId); if (col) return col }
}
return null
}
const selectedField = findSelected()

useEffect(() => {
const init = async () => {
try { const info = await webflow.getSiteInfo(); const saved = loadTheme(info.siteId); if (saved) setFormConfig(prev => ({ ...prev, theme: saved })) } catch {}
}
init()
}, [])

useEffect(() => {
const save = async () => {
try { const info = await webflow.getSiteInfo(); saveTheme(info.siteId, formConfig.theme) } catch {}
}
save()
}, [formConfig.theme])

// ── Drag handlers ──────────────────────────────────────────────────────────
const handleDragStart = (index: number, fieldId?: string) => {
dragIndex.current = index
dragFieldId.current = fieldId ?? null
// Defer the state update so the drag ghost renders before React re-renders.
// Critically: do NOT set draggedIndex synchronously — it triggers a re-render
// that can cause the browser to cancel the drag before it begins.
requestAnimationFrame(() => setDraggedIndex(index))
}
const handleDragOver = (index: number, zone: DropZone) => {
setDragOverIndex(index)
setDropZone(zone)
setDropBeforeFirst(false)
}
const handleDragEnd = () => {
dragIndex.current = null; dragFieldId.current = null
setDragOverIndex(null); setDropZone(null); setDraggedIndex(null)
setDropBeforeFirst(false)
}

// Handle drag over the field list container (catches top area above first card)
const handleListDragOver = (e: React.DragEvent) => {
e.preventDefault()
if (!fieldListRef.current || items.length === 0) return
const firstCard = fieldListRef.current.firstElementChild as HTMLElement | null
if (!firstCard) return
const rect = firstCard.getBoundingClientRect()
if (e.clientY < rect.top + 8) {
setDropBeforeFirst(true)
setDragOverIndex(null)
setDropZone(null)
}
}

const handleListDrop = (e: React.DragEvent) => {
e.preventDefault()
if (!dropBeforeFirst) return
setDropBeforeFirst(false)
const from = dragIndex.current
if (from === null || from === 0) return
setItems(prev => {
const next = [...prev]
const [moved] = next.splice(from, 1)
next.splice(0, 0, moved)
return next
})
dragIndex.current = null
dragFieldId.current = null
setDraggedIndex(null)
}

const handleDrop = (dropIndex: number, zone: DropZone) => {
const from = dragIndex.current
const fId = dragFieldId.current

setDragOverIndex(null); setDropZone(null); setDraggedIndex(null)
setDropBeforeFirst(false)

// Dragging a field OUT of a row
if (fId) {
setItems(prev => {
let extracted: FieldConfig | null = null
const next = prev.flatMap((item): FormItem[] => {
    if (!isRow(item)) return [item]
    const col = item.columns.find(c => c.id === fId)
    if (!col) return [item]
    extracted = col
    const remaining = item.columns.filter(c => c.id !== fId)
    if (remaining.length === 1) return [remaining[0]]
    if (remaining.length === 0) return []
    return [{ ...item, columns: remaining }]
})
if (extracted) {
    const insertAt = zone === 'below' ? dropIndex + 1 : dropIndex
    next.splice(insertAt, 0, extracted)
}
return next
})
dragFieldId.current = null; dragIndex.current = null
return
}

if (from === null) return

// Merge into row
if (zone === 'merge' && from !== dropIndex) {
setItems(prev => {
const next = [...prev]
const dragged = next[from]
const target = next[dropIndex]
if (!isRow(dragged) && !isRow(target)) {
    const fromFirst = from < dropIndex
    const ordered = fromFirst ? [dragged, target] : [target, dragged]
    const minIdx = Math.min(from, dropIndex)
    const maxIdx = Math.max(from, dropIndex)
    next.splice(maxIdx, 1)
    next.splice(minIdx, 1)
    const newRow = createRow(ordered as FieldConfig[])
    next.splice(minIdx, 0, newRow)
}
return next
})
dragIndex.current = null
return
}

if (from === dropIndex) { dragIndex.current = null; return }

// Regular reorder — above or below
setItems(prev => {
const next = [...prev]
const [moved] = next.splice(from, 1)
let insertAt: number
if (zone === 'below') {
insertAt = from < dropIndex ? dropIndex : dropIndex + 1
} else {
insertAt = from < dropIndex ? dropIndex - 1 : dropIndex
}
next.splice(Math.max(0, insertAt), 0, moved)
return next
})
dragIndex.current = null
}

const handleSelectField = (id: string) => { setSelectedId(id); setShowPresets(false) }
const handleCloseDrawer = () => { setSelectedId(null) }
const handleReset = () => { setItems([]); setSelectedId(null); setStatus(null); setPanel('fields') }

const addField = (presetIndex: number) => {
const field = createField(FIELD_PRESETS[presetIndex].config)
setItems(prev => [...prev, field]); setSelectedId(field.id); setShowPresets(false)
}

const updateField = useCallback((updated: FieldConfig) => {
setItems(prev => prev.map(item => {
if (!isRow(item) && item.id === updated.id) return updated
if (isRow(item)) return { ...item, columns: item.columns.map(c => c.id === updated.id ? updated : c) }
return item
}))
}, [])

const duplicateItem = (id: string) => {
const idx = items.findIndex(item => !isRow(item) && item.id === id)
if (idx === -1) return
const field = items[idx] as FieldConfig
const dupe = createField({ ...JSON.parse(JSON.stringify(field)), id: undefined, label: field.label + ' Copy', fieldName: field.fieldName + '_copy' })
setItems(prev => { const next = [...prev]; next.splice(idx + 1, 0, dupe); return next })
setSelectedId(dupe.id)
}

const deleteItem = (id: string) => {
setItems(prev => prev.filter(item => item.id !== id))
if (selectedId === id) setSelectedId(null)
}

const reorderInRow = (rowId: string, fromIdx: number, toIdx: number) => {
setItems(prev => prev.map(item => {
if (!isRow(item) || item.id !== rowId) return item
const cols = [...item.columns]
const [moved] = cols.splice(fromIdx, 1)
cols.splice(toIdx, 0, moved)
return { ...item, columns: cols }
}))
}

const handleBuild = async () => {
if (!hasItems) { setStatus({ ok: false, msg: 'Add at least one field first.' }); return }
setBuilding(true); setStatus(null)
try {
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out. Please try again.')), 15000))
await Promise.race([buildForm(items, formConfig), timeout])
setStatus({ ok: true, msg: 'Form inserted onto canvas!' })
} catch (err: any) {
setStatus({ ok: false, msg: err.message ?? 'Failed to build form.' })
} finally { setBuilding(false) }
}

// SplitWithPreview is defined outside App to keep a stable reference across renders.
// Defining it inside App would recreate it on every state change, unmounting the scroll
// container and resetting scroll position whenever a slider or color input fires onChange.

const showEditor = !!selectedField

return (
<div className="app">
<div className="topbar">
<div className="topbar-left">
    {hasItems && <button className="btn-back" onClick={handleReset}>← Back</button>}
    <span className="topbar-title">Form Builder</span>
</div>
{hasItems && (
    <div className="topbar-tabs">
    <button className={`topbar-tab ${panel === 'fields' ? 'active' : ''}`} onClick={() => setPanel('fields')}>
        Fields <span className="count-badge">{items.length}</span>
    </button>
    <button className={`topbar-tab ${panel === 'style' ? 'active' : ''}`} onClick={() => setPanel('style')}>Style</button>
    <button className={`topbar-tab ${panel === 'form' ? 'active' : ''}`} onClick={() => setPanel('form')}>Form</button>
    </div>
)}
</div>

<div className="main">
{panel === 'style' ? (
    <SplitWithPreview items={items} formConfig={formConfig} onSelectPanel={() => setPanel('fields')}><StyleSettings config={formConfig} onChange={setFormConfig} /></SplitWithPreview>
) : panel === 'form' ? (
    <SplitWithPreview items={items} formConfig={formConfig} onSelectPanel={() => setPanel('fields')}><FormSettings config={formConfig} onChange={setFormConfig} /></SplitWithPreview>
) : !hasItems ? (
    <>
    <IntroScreen onTemplate={setItems} onAddField={() => setShowPresets(true)} />
    {showPresets && (
        <div className="floating-presets">
        <div className="floating-presets-header">
            <span>Choose a field type</span>
            <button onClick={() => setShowPresets(false)}>✕</button>
        </div>
        <div className="preset-grid padded">
            {FIELD_PRESETS.map((p, i) => (
            <button key={i} className="preset-btn" onClick={() => addField(i)}>
                <span className="preset-icon">{p.icon}</span>
                <span className="preset-label">{p.label}</span>
            </button>
            ))}
        </div>
        </div>
    )}
    </>
) : (
    /* ── 3-column layout ── */
    <div className="three-col-layout">
    {/* Col 1 — field list */}
    <div className="left-panel">
        <div className="preset-section">
        <button className="preset-toggle" onClick={() => setShowPresets(v => !v)}>
            <span>+ Add field</span>
            <span className={`chevron ${showPresets ? 'open' : ''}`}>›</span>
        </button>
        {showPresets && (
            <div className="preset-grid">
            {FIELD_PRESETS.map((p, i) => (
                <button key={i} className="preset-btn" onClick={() => addField(i)}>
                <span className="preset-icon">{p.icon}</span>
                <span className="preset-label">{p.label}</span>
                </button>
            ))}
            </div>
        )}
        </div>
        <div
        className="field-list"
        ref={fieldListRef}
        onDragOver={handleListDragOver}
        onDrop={handleListDrop}
        onDragLeave={() => setDropBeforeFirst(false)}
        >
        {/* Drop zone indicator above first card */}
        {dropBeforeFirst && <div className="drop-line drop-line-first" />}
        {items.map((item, idx) => (
            <FieldCard key={item.id} item={item} index={idx}
            isSelected={!isRow(item) && selectedId === item.id}
            dropZone={dragOverIndex === idx ? dropZone : null}
            isDragging={draggedIndex === idx}
            draggedItem={draggedIndex !== null ? items[draggedIndex] : null}
            selectedId={selectedId}
            onSelect={handleSelectField}
            onDuplicate={duplicateItem}
            onDelete={deleteItem}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onDropIntoRow={() => {}}
            onRemoveFromRow={() => {}}
            onReorderInRow={reorderInRow} />
        ))}
        </div>
        {hasItems && (
        <div className="row-hint">💡 Drag onto another field to create a 2-col row</div>
        )}
    </div>

    {/* Col 2 — preview */}
    <div className={`middle-panel ${showEditor ? 'has-editor' : ''}`}>
        <LivePreview items={items} formConfig={formConfig} selectedId={selectedId} onSelect={handleSelectField} />
    </div>

    {/* Col 3 — field editor */}
    {showEditor && selectedField && (
        <div className="editor-panel">
        <div className="editor-panel-header">
            <span className="editor-panel-title">{selectedField.label}</span>
            <button className="drawer-close" onClick={handleCloseDrawer}>✕</button>
        </div>
        <div className="scroll-area">
            <FieldEditor field={selectedField} onChange={updateField} />
        </div>
        </div>
    )}
    </div>
)}
</div>

{status && (
<div className={`status-bar ${status.ok ? 'ok' : 'err'}`}>
    {status.ok ? '✓' : '⚠'} {status.msg}
</div>
)}
<div className="footer">
<button className="btn-build" onClick={handleBuild} disabled={building || !hasItems}>
    {building ? 'Building…' : 'Insert Form → Canvas'}
</button>
{!hasItems && <span className="footer-hint">Add fields to get started</span>}
</div>
</div>
)
}

export default App
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { FieldCard } from './components/FieldCard'
import { FieldEditor } from './components/FieldEditor'
import { FormSettings } from './components/FormSettings'
import { StyleSettings } from './components/StyleSettings'
import {
  FIELD_PRESETS, createField, createDefaultForm,
  FieldConfig, FormConfig, FormTheme,
  PADDING_VALUES, BUTTON_PADDING_VALUES,
  saveTheme, loadTheme,
} from './lib/types'

declare const webflow: any

// ─── Get existing style or create new one — never update existing ────────────
async function ensureStyle(name: string, props: Record<string, string>) {
  try {
    const existing = await webflow.getStyleByName(name)
    if (existing) return existing
  } catch {}
  const style = await webflow.createStyle(name)
  await style.setProperties(props)
  return style
}

// ─── Build the form using native Webflow form presets ────────────────────────
async function buildForm(fields: FieldConfig[], formConfig: FormConfig) {
  const selected = await webflow.getSelectedElement()
  if (!selected) throw new Error('Please select an element on the canvas first.')

  const t = formConfig.theme
  const inputProps = {
    'width': '100%',
    'padding': PADDING_VALUES[t.inputPadding],
    'font-size': `${t.inputFontSize}px`,
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': t.inputBorderColor,
    'border-radius': `${t.inputBorderRadius}px`,
    'background-color': t.inputBgColor,
    'color': t.inputTextColor,
    'outline': 'none',
    'box-sizing': 'border-box',
  }

  const fbForm = await ensureStyle('fb-form', {
    'display': 'flex', 'flex-direction': 'column',
    'row-gap': `${t.fieldGap}px`, 'width': '100%',
    'background-color': t.formBgColor,
    'border-radius': `${t.wrapperBorderRadius}px`,
    'padding': PADDING_VALUES[t.inputPadding],
  })
  const fbField = await ensureStyle('fb-field', {
    'display': 'flex', 'flex-direction': 'column', 'row-gap': '6px', 'width': '100%',
  })
  const fbLabel = await ensureStyle('fb-label', {
    'font-size': `${t.labelFontSize}px`,
    'font-weight': t.labelFontWeight,
    'color': t.labelColor,
    'display': 'block', 'margin-bottom': '4px',
  })
  const fbInput = await ensureStyle('fb-input', inputProps)
  const fbTextarea = await ensureStyle('fb-textarea', {
    ...inputProps, 'min-height': '120px', 'resize': 'vertical',
  })
  const fbSubmit = await ensureStyle('fb-submit', {
    'padding': BUTTON_PADDING_VALUES[t.buttonPadding],
    'font-size': `${t.inputFontSize}px`, 'font-weight': '600',
    'background-color': t.primaryColor, 'color': t.buttonTextColor,
    'border-width': '0px', 'border-radius': `${t.buttonBorderRadius}px`,
    'cursor': 'pointer', 'width': '100%',
    'text-align': 'center', 'display': 'block',
  })
  const fbHelp = await ensureStyle('fb-help', {
    'font-size': '12px', 'color': t.placeholderColor, 'margin-top': '4px',
  })

  // Insert native Webflow Form Block — this gives us native form submission
  const formWrapper = await selected.after(webflow.elementPresets.FormForm)
  const wrapperChildren = await formWrapper.getChildren()
  const formEl = wrapperChildren[0] // FormForm element

  // Set form name and apply styles to wrapper
  await formEl.setName(formConfig.formName)
  await formWrapper.setStyles([fbForm])

  // Remove Webflow's default fields, keep submit button
  const defaultChildren = await formEl.getChildren()
  const submitBtn = defaultChildren[defaultChildren.length - 1]
  for (const child of defaultChildren.slice(0, -1)) {
    await child.remove()
  }

  // Build our fields as DOM elements inside the native form
  // Webflow's form handler reads name attributes on any input — native or DOM
  const formBody = webflow.elementBuilder(webflow.elementPresets.DOM)
  formBody.setTag('div')
  formBody.setStyles([fbForm])

  for (const field of fields) {
    const wrapper = formBody.append(webflow.elementPresets.DOM)
    wrapper.setTag('div')
    wrapper.setStyles([fbField])

    // Label
    if (field.labelVariant !== 'hidden') {
      const label = wrapper.append(webflow.elementPresets.DOM)
      label.setTag('label')
      label.setTextContent(field.label + (field.required ? ' *' : ''))
      label.setStyles([fbLabel])
    }

    // Input — full DOM control, all field types supported
    if (field.type === 'textarea') {
      const ta = wrapper.append(webflow.elementPresets.DOM)
      ta.setTag('textarea')
      ta.setAttribute('name', field.fieldName)
      ta.setAttribute('placeholder', field.placeholder)
      if (field.required) ta.setAttribute('required', 'true')
      ta.setStyles([fbTextarea])
    } else if (field.type === 'select') {
      const sel = wrapper.append(webflow.elementPresets.DOM)
      sel.setTag('select')
      sel.setAttribute('name', field.fieldName)
      if (field.required) sel.setAttribute('required', 'true')
      sel.setStyles([fbInput])
      for (const o of field.options) {
        const opt = sel.append(webflow.elementPresets.DOM)
        opt.setTag('option')
        opt.setAttribute('value', o.value)
        opt.setTextContent(o.label)
      }
    } else if (field.type === 'checkbox' || field.type === 'radio') {
      for (const o of field.options) {
        const row = wrapper.append(webflow.elementPresets.DOM)
        row.setTag('div')
        row.setAttribute('style', 'display:flex;align-items:center;gap:8px;')
        const inp = row.append(webflow.elementPresets.DOM)
        inp.setTag('input')
        inp.setAttribute('type', field.type)
        inp.setAttribute('name', field.fieldName)
        inp.setAttribute('value', o.value)
        const lbl = row.append(webflow.elementPresets.DOM)
        lbl.setTag('label')
        lbl.setTextContent(o.label)
        lbl.setStyles([fbLabel])
      }
    } else if (field.type !== 'hidden') {
      const input = wrapper.append(webflow.elementPresets.DOM)
      input.setTag('input')
      input.setAttribute('type', field.type === 'toggle' ? 'checkbox' : field.type)
      input.setAttribute('name', field.fieldName)
      input.setAttribute('placeholder', field.placeholder)
      if (field.required) input.setAttribute('required', 'true')
      if (field.defaultValue) input.setAttribute('value', field.defaultValue)
      input.setAttribute('inputmode', field.inputMode)
      input.setAttribute('autocomplete', field.autoComplete)
      input.setStyles([fbInput])
    }

    if (field.helpText) {
      const help = wrapper.append(webflow.elementPresets.DOM)
      help.setTag('p')
      help.setTextContent(field.helpText)
      help.setStyles([fbHelp])
    }
  }

  // Insert our DOM fields before the submit button
  await submitBtn.before(formBody)

  // Style the submit button
  await submitBtn.setStyles([fbSubmit])
}



// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: { label: string; icon: string; fields: Partial<FieldConfig>[] }[] = [
  {
    label: 'Contact', icon: '✉️',
    fields: [
      { label: 'First Name', fieldName: 'first_name', placeholder: 'First name', type: 'text', autoComplete: 'given-name', inputMode: 'text' },
      { label: 'Last Name', fieldName: 'last_name', placeholder: 'Last name', type: 'text', autoComplete: 'family-name', inputMode: 'text' },
      { label: 'Email', fieldName: 'email', placeholder: 'you@example.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' },
      { label: 'Message', fieldName: 'message', placeholder: 'Your message…', type: 'textarea', autoComplete: 'off', inputMode: 'text' },
    ],
  },
  {
    label: 'Lead Gen', icon: '🎯',
    fields: [
      { label: 'Full Name', fieldName: 'full_name', placeholder: 'Your name', type: 'text', autoComplete: 'name', inputMode: 'text' },
      { label: 'Work Email', fieldName: 'email', placeholder: 'you@company.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' },
      { label: 'Company', fieldName: 'company', placeholder: 'Company name', type: 'text', autoComplete: 'organization', inputMode: 'text' },
      { label: 'Phone', fieldName: 'phone', placeholder: '+44 7700 000000', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
    ],
  },
  {
    label: 'Newsletter', icon: '📧',
    fields: [
      { label: 'First Name', fieldName: 'first_name', placeholder: 'First name', type: 'text', autoComplete: 'given-name', inputMode: 'text' },
      { label: 'Email', fieldName: 'email', placeholder: 'you@example.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' },
    ],
  },
]

type Panel = 'fields' | 'style' | 'form'

// ─── Live Preview ─────────────────────────────────────────────────────────────
const LivePreview: React.FC<{
  fields: FieldConfig[]
  formConfig: FormConfig
  selectedId: string | null
  onSelect: (id: string) => void
}> = ({ fields, formConfig, selectedId, onSelect }) => {
  const t = formConfig.theme
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: PADDING_VALUES[t.inputPadding], fontSize: t.inputFontSize,
    border: `1px solid ${t.inputBorderColor}`, borderRadius: t.inputBorderRadius,
    background: t.inputBgColor, color: t.inputTextColor,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: t.labelFontSize, fontWeight: t.labelFontWeight as any,
    color: t.labelColor, display: 'block', marginBottom: 4,
  }

  return (
    <div className="preview-pane">
      <div className="preview-label">Preview <span className="preview-hint">Click a field to edit</span></div>
      <div className="preview-scroll">
        <div className="preview-form" style={{
          gap: t.fieldGap,
          background: t.formBgColor || '#fff',
          borderRadius: t.wrapperBorderRadius,
        }}>
          {fields.length === 0 && <div className="preview-empty">Add fields to see a preview</div>}
          {fields.map(field => (
            <div key={field.id}
              className={`preview-field ${selectedId === field.id ? 'is-selected' : ''}`}
              onClick={() => onSelect(field.id)}>
              {field.labelVariant !== 'hidden' && (
                <label style={labelStyle}>
                  {field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}
                </label>
              )}
              {field.type === 'textarea' && (
                <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                  placeholder={field.placeholder} readOnly />
              )}
              {field.type === 'select' && (
                <select style={{ ...inputStyle, appearance: 'auto' }}>
                  <option>{field.placeholder || 'Select…'}</option>
                  {field.options.map((o, i) => <option key={i}>{o.label}</option>)}
                </select>
              )}
              {(field.type === 'checkbox' || field.type === 'radio') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {field.options.map((o, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: t.inputTextColor, fontWeight: 400 }}>
                      <input type={field.type} readOnly /> {o.label}
                    </label>
                  ))}
                </div>
              )}
              {field.type === 'toggle' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: t.inputTextColor, fontWeight: 400 }}>
                  <input type="checkbox" readOnly /> {field.label}
                </label>
              )}
              {field.type === 'hidden' && (
                <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>
                  Hidden field: <code>{field.fieldName}</code>
                </div>
              )}
              {!['textarea', 'select', 'checkbox', 'radio', 'toggle', 'hidden'].includes(field.type) && (
                <input style={inputStyle} type={field.type} placeholder={field.placeholder} readOnly />
              )}
              {field.helpText && (
                <p style={{ fontSize: 12, color: t.placeholderColor, margin: '4px 0 0' }}>{field.helpText}</p>
              )}
            </div>
          ))}
          {fields.length > 0 && (
            <button style={{
              padding: BUTTON_PADDING_VALUES[t.buttonPadding],
              fontSize: t.inputFontSize, fontWeight: 600,
              background: t.primaryColor, color: t.buttonTextColor,
              border: 'none', borderRadius: t.buttonBorderRadius,
              cursor: 'default', width: '100%', fontFamily: 'inherit',
            }}>{formConfig.buttonLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────
const IntroScreen: React.FC<{
  onTemplate: (f: FieldConfig[]) => void
  onAddField: () => void
}> = ({ onTemplate, onAddField }) => (
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
          <button key={i} className="template-btn"
            onClick={() => onTemplate(t.fields.map(f => createField(f)))}>
            <span className="template-icon">{t.icon}</span>
            <span className="template-label">{t.label}</span>
            <span className="template-count">{t.fields.length} fields</span>
          </button>
        ))}
      </div>
    </div>
  </div>
)

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [formConfig, setFormConfig] = useState<FormConfig>(createDefaultForm)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('fields')
  const [building, setBuilding] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndex = useRef<number | null>(null)

  const selectedField = fields.find(f => f.id === selectedId) ?? null
  const hasFields = fields.length > 0

  // Load saved theme silently on startup
  useEffect(() => {
    const init = async () => {
      try {
        const info = await webflow.getSiteInfo()
        const saved = loadTheme(info.siteId)
        if (saved) setFormConfig(prev => ({ ...prev, theme: saved }))
      } catch {}
    }
    init()
  }, [])

  // Auto-save theme whenever it changes
  useEffect(() => {
    const save = async () => {
      try {
        const info = await webflow.getSiteInfo()
        saveTheme(info.siteId, formConfig.theme)
      } catch {}
    }
    save()
  }, [formConfig.theme])

  useEffect(() => { setDrawerOpen(!!selectedId) }, [selectedId])

  // Drag handlers
  const handleDragStart = (index: number) => { dragIndex.current = index }
  const handleDragOver = (index: number) => { setDragOverIndex(index) }
  const handleDrop = (dropIndex: number) => {
    const from = dragIndex.current
    if (from === null || from === dropIndex) { dragIndex.current = null; setDragOverIndex(null); return }
    setFields(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    dragIndex.current = null
    setDragOverIndex(null)
  }
  const handleDragEnd = () => { dragIndex.current = null; setDragOverIndex(null) }

  const handleSelectField = (id: string) => { setSelectedId(id); setShowPresets(false) }
  const handleCloseDrawer = () => { setSelectedId(null); setDrawerOpen(false) }
  const handleReset = () => {
    setFields([]); setSelectedId(null)
    setDrawerOpen(false); setStatus(null)
    setPanel('fields')
  }

  const addField = (presetIndex: number) => {
    const field = createField(FIELD_PRESETS[presetIndex].config)
    setFields(prev => [...prev, field])
    setSelectedId(field.id)
    setShowPresets(false)
  }

  const updateField = useCallback((updated: FieldConfig) => {
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
  }, [])

  const duplicateField = (id: string) => {
    const field = fields.find(f => f.id === id); if (!field) return
    const dupe = createField({
      ...JSON.parse(JSON.stringify(field)),
      label: field.label + ' Copy',
      fieldName: field.fieldName + '_copy',
      id: undefined,
    })
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id)
      const next = [...prev]; next.splice(idx + 1, 0, dupe); return next
    })
    setSelectedId(dupe.id)
  }

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
    if (selectedId === id) { setSelectedId(null); setDrawerOpen(false) }
  }

  const handleBuild = async () => {
    if (!hasFields) { setStatus({ ok: false, msg: 'Add at least one field first.' }); return }
    setBuilding(true); setStatus(null)
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out. Please try again.')), 15000))
      await Promise.race([buildForm(fields, formConfig), timeout])
      setStatus({ ok: true, msg: 'Form inserted onto canvas!' })
    } catch (err: any) {
      setStatus({ ok: false, msg: err.message ?? 'Failed to build form.' })
    } finally { setBuilding(false) }
  }

  const SplitWithPreview = ({ children }: { children: React.ReactNode }) => (
    <div className="split-layout">
      <div className="left-panel form-panel">
        <div className="scroll-area">{children}</div>
      </div>
      <div className="right-panel">
        <LivePreview fields={fields} formConfig={formConfig}
          selectedId={null} onSelect={() => setPanel('fields')} />
      </div>
    </div>
  )

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-left">
          {hasFields && <button className="btn-back" onClick={handleReset}>← Back</button>}
          <span className="topbar-title">Form Builder</span>
        </div>
        {hasFields && (
          <div className="topbar-tabs">
            <button className={`topbar-tab ${panel === 'fields' ? 'active' : ''}`}
              onClick={() => setPanel('fields')}>
              Fields <span className="count-badge">{fields.length}</span>
            </button>
            <button className={`topbar-tab ${panel === 'style' ? 'active' : ''}`}
              onClick={() => setPanel('style')}>Style</button>
            <button className={`topbar-tab ${panel === 'form' ? 'active' : ''}`}
              onClick={() => setPanel('form')}>Form</button>
          </div>
        )}
      </div>

      <div className="main">
        {panel === 'style' ? (
          <SplitWithPreview>
            <StyleSettings config={formConfig} onChange={setFormConfig} />
          </SplitWithPreview>
        ) : panel === 'form' ? (
          <SplitWithPreview>
            <FormSettings config={formConfig} onChange={setFormConfig} />
          </SplitWithPreview>
        ) : !hasFields ? (
          <>
            <IntroScreen
              onTemplate={f => { setFields(f); setSelectedId(null) }}
              onAddField={() => setShowPresets(true)} />
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
          <div className="split-layout">
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
              <div className="field-list">
                {fields.map((field, idx) => (
                  <FieldCard key={field.id} field={field} index={idx}
                    isSelected={selectedId === field.id}
                    isFirst={idx === 0} isLast={idx === fields.length - 1}
                    isDragOver={dragOverIndex === idx}
                    onSelect={() => handleSelectField(field.id)}
                    onDuplicate={() => duplicateField(field.id)}
                    onDelete={() => deleteField(field.id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd} />
                ))}
              </div>
            </div>
            <div className="right-panel">
              <LivePreview fields={fields} formConfig={formConfig}
                selectedId={selectedId} onSelect={handleSelectField} />
              {drawerOpen && selectedField && (
                <div className="drawer">
                  <div className="drawer-header">
                    <span className="drawer-title">{selectedField.label}</span>
                    <button className="drawer-close" onClick={handleCloseDrawer}>✕</button>
                  </div>
                  <div className="drawer-body">
                    <FieldEditor field={selectedField} onChange={updateField} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {status && (
        <div className={`status-bar ${status.ok ? 'ok' : 'err'}`}>
          {status.ok ? '✓' : '⚠'} {status.msg}
        </div>
      )}

      <div className="footer">
        <button className="btn-build" onClick={handleBuild} disabled={building || !hasFields}>
          {building ? 'Building…' : 'Insert Form → Canvas'}
        </button>
        {!hasFields && <span className="footer-hint">Add fields to get started</span>}
      </div>
    </div>
  )
}

export default App
import React from 'react'
import { FormConfig, FormTheme, PaddingSize } from '../lib/types'

interface Props { config: FormConfig; onChange: (c: FormConfig) => void }

const setTheme = (config: FormConfig, onChange: (c: FormConfig) => void) =>
  (p: Partial<FormTheme>) => onChange({ ...config, theme: { ...config.theme, ...p } })

const ColorRow: React.FC<{
  label: string; hint?: string; value: string; onChange: (v: string) => void
}> = ({ label, hint, value, onChange }) => (
  <div className="prop-row">
    <div className="prop-label-wrap">
      <span className="prop-label">{label}</span>
      {hint && <span className="prop-hint">{hint}</span>}
    </div>
    <div className="color-row">
      <input type="color" className="color-swatch" value={value}
        onChange={e => onChange(e.target.value)} />
      <input className="prop-input prop-input-mono" value={value} maxLength={7}
        onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }} />
    </div>
  </div>
)

const SliderRow: React.FC<{
  label: string; value: number; min: number; max: number; unit?: string
  leftLabel?: string; rightLabel?: string; onChange: (v: number) => void
}> = ({ label, value, min, max, unit = 'px', leftLabel, rightLabel, onChange }) => (
  <div className="prop-row">
    <div className="prop-label-wrap">
      <span className="prop-label">{label}</span>
      <span className="prop-hint">{value}{unit}</span>
    </div>
    <input type="range" className="prop-slider" min={min} max={max} step={1}
      value={value} onChange={e => onChange(Number(e.target.value))} />
    {(leftLabel || rightLabel) && (
      <div className="slider-labels"><span>{leftLabel}</span><span>{rightLabel}</span></div>
    )}
  </div>
)

const PaddingRow: React.FC<{
  label: string; value: PaddingSize; onChange: (v: PaddingSize) => void
}> = ({ label, value, onChange }) => (
  <div className="prop-row">
    <div className="prop-label-wrap"><span className="prop-label">{label}</span></div>
    <div className="segment-control">
      {(['sm', 'md', 'lg'] as PaddingSize[]).map(v => (
        <button key={v} className={`segment-btn ${value === v ? 'active' : ''}`}
          onClick={() => onChange(v)}>
          {v === 'sm' ? 'Small' : v === 'md' ? 'Medium' : 'Large'}
        </button>
      ))}
    </div>
  </div>
)

export const StyleSettings: React.FC<Props> = ({ config, onChange }) => {
  const t = config.theme
  const ST = setTheme(config, onChange)

  return (
    <div className="field-editor">

      {/* ── Button ── */}
      <div className="editor-section-label">Button</div>
      <ColorRow label="Background" hint="Primary colour" value={t.primaryColor} onChange={v => ST({ primaryColor: v })} />
      <ColorRow label="Text" value={t.buttonTextColor} onChange={v => ST({ buttonTextColor: v })} />
      <SliderRow label="Border Radius" value={t.buttonBorderRadius} min={0} max={24}
        leftLabel="Square" rightLabel="Pill" onChange={v => ST({ buttonBorderRadius: v })} />
      <PaddingRow label="Padding" value={t.buttonPadding} onChange={v => ST({ buttonPadding: v })} />

      {/* ── Inputs ── */}
      <div className="editor-section-label">Inputs</div>
      <ColorRow label="Background" value={t.inputBgColor} onChange={v => ST({ inputBgColor: v })} />
      <ColorRow label="Text" value={t.inputTextColor} onChange={v => ST({ inputTextColor: v })} />
      <ColorRow label="Border" value={t.inputBorderColor} onChange={v => ST({ inputBorderColor: v })} />
      <ColorRow label="Placeholder" value={t.placeholderColor} onChange={v => ST({ placeholderColor: v })} />
      <SliderRow label="Border Radius" value={t.inputBorderRadius} min={0} max={24}
        leftLabel="Square" rightLabel="Pill" onChange={v => ST({ inputBorderRadius: v })} />
      <PaddingRow label="Padding" value={t.inputPadding} onChange={v => ST({ inputPadding: v })} />

      {/* ── Labels ── */}
      <div className="editor-section-label">Labels</div>
      <ColorRow label="Colour" value={t.labelColor} onChange={v => ST({ labelColor: v })} />
      <SliderRow label="Font Size" value={t.labelFontSize} min={10} max={20}
        onChange={v => ST({ labelFontSize: v })} />
      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Font Weight</span></div>
        <div className="segment-control">
          {(['400', '500', '600', '700'] as const).map(v => (
            <button key={v} className={`segment-btn ${t.labelFontWeight === v ? 'active' : ''}`}
              onClick={() => ST({ labelFontWeight: v })}>
              {v === '400' ? 'Regular' : v === '500' ? 'Medium' : v === '600' ? 'Semi' : 'Bold'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Form wrapper ── */}
      <div className="editor-section-label">Form Wrapper</div>
      <ColorRow label="Background" value={t.formBgColor} onChange={v => ST({ formBgColor: v })} />
      <SliderRow label="Border Radius" value={t.wrapperBorderRadius} min={0} max={24}
        leftLabel="Square" rightLabel="Rounded" onChange={v => ST({ wrapperBorderRadius: v })} />
      <SliderRow label="Field Gap" value={t.fieldGap} min={4} max={48}
        unit="px" onChange={v => ST({ fieldGap: v })} />
      <SliderRow label="Input Font Size" value={t.inputFontSize} min={10} max={20}
        onChange={v => ST({ inputFontSize: v })} />

    </div>
  )
}
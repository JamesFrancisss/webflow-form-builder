import React from 'react'
import { FormConfig } from '../lib/types'

interface Props { config: FormConfig; onChange: (c: FormConfig) => void }

export const FormSettings: React.FC<Props> = ({ config, onChange }) => {
  const set = (p: Partial<FormConfig>) => onChange({ ...config, ...p })

  return (
    <div className="field-editor">

      <div className="editor-section-label">📝 Form Details</div>

      <div className="prop-row">
        <div className="prop-label-wrap">
          <span className="prop-label">Form Name</span>
          <span className="prop-hint">Shows in Webflow's Forms dashboard</span>
        </div>
        <input className="prop-input" value={config.formName}
          onChange={e => set({ formName: e.target.value })} placeholder="Contact Form" />
      </div>

      <div className="prop-row">
        <div className="prop-label-wrap">
          <span className="prop-label">Redirect URL</span>
          <span className="prop-hint">Optional — redirect after submission</span>
        </div>
        <input className="prop-input" value={config.redirectUrl}
          onChange={e => set({ redirectUrl: e.target.value })}
          placeholder="https://yoursite.com/thank-you" />
      </div>

      <div className="editor-section-label">✅ Submit Button</div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Button Label</span></div>
        <input className="prop-input" value={config.buttonLabel}
          onChange={e => set({ buttonLabel: e.target.value })} placeholder="Submit" />
      </div>

      <div className="editor-section-label">💬 Messages</div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Success Message</span></div>
        <input className="prop-input" value={config.successMessage}
          onChange={e => set({ successMessage: e.target.value })} placeholder="Thank you!" />
      </div>

      <div className="prop-row">
        <div className="prop-label-wrap"><span className="prop-label">Error Message</span></div>
        <input className="prop-input" value={config.errorMessage}
          onChange={e => set({ errorMessage: e.target.value })} placeholder="Something went wrong." />
      </div>

    </div>
  )
}
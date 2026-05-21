export type DropZone = 'above' | 'merge' | 'below' | null

export type InputType =
  | 'text' | 'email' | 'tel' | 'number' | 'password' | 'url' | 'search'
  | 'textarea' | 'select' | 'checkbox' | 'radio' | 'toggle' | 'date' | 'hidden'

export type LabelVariant = 'visible' | 'hidden' | 'floating'
export type PaddingSize = 'sm' | 'md' | 'lg'
export type DateMode = 'single' | 'range'
export type CheckboxMode = 'single' | 'group'
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

export type AutocompleteValue =
  | 'off' | 'name' | 'given-name' | 'family-name' | 'email' | 'tel'
  | 'street-address' | 'postal-code' | 'country' | 'username'
  | 'current-password' | 'new-password' | 'bday' | 'organization'

// ─── Theme ────────────────────────────────────────────────────────────────────
export interface FormTheme {
  primaryColor: string
  inputBgColor: string
  inputTextColor: string
  inputBorderColor: string
  labelColor: string
  placeholderColor: string
  formBgColor: string
  inputBorderRadius: number
  buttonBorderRadius: number
  wrapperBorderRadius: number
  inputPadding: PaddingSize
  fieldGap: number
  columnGap: number
  labelFontSize: number
  labelFontWeight: '400' | '500' | '600' | '700'
  inputFontSize: number
  buttonTextColor: string
  buttonPadding: PaddingSize
}

export const DEFAULT_THEME: FormTheme = {
  primaryColor: '#2563eb',
  inputBgColor: '#ffffff',
  inputTextColor: '#111827',
  inputBorderColor: '#d1d5db',
  labelColor: '#111827',
  placeholderColor: '#9ca3af',
  formBgColor: 'transparent',
  inputBorderRadius: 6,
  buttonBorderRadius: 6,
  wrapperBorderRadius: 0,
  inputPadding: 'md',
  fieldGap: 16,
  columnGap: 16,
  labelFontSize: 14,
  labelFontWeight: '500',
  inputFontSize: 14,
  buttonTextColor: '#ffffff',
  buttonPadding: 'md',
}

export const PADDING_VALUES: Record<PaddingSize, string> = {
  sm: '6px 10px',
  md: '10px 14px',
  lg: '14px 20px',
}

export const BUTTON_PADDING_VALUES: Record<PaddingSize, string> = {
  sm: '8px 16px',
  md: '12px 24px',
  lg: '16px 32px',
}

// ─── Field ────────────────────────────────────────────────────────────────────
export interface FieldConfig {
  id: string
  label: string
  fieldName: string
  placeholder: string
  helpText: string
  validationMessage: string
  required: boolean
  defaultValue: string
  type: InputType
  inputMode: string
  autoComplete: AutocompleteValue
  cssClasses: string
  labelVariant: LabelVariant
  options: { label: string; value: string }[]
  // Date-specific
  dateMode?: DateMode
  dateFormat?: DateFormat
  // Checkbox-specific
  checkboxMode?: CheckboxMode
}

// ─── Row (multi-column) ───────────────────────────────────────────────────────
export interface FieldRow {
  id: string
  type: 'row'
  columns: FieldConfig[]
}

// A form item is either a standalone field or a row of fields
export type FormItem = FieldConfig | FieldRow

export const isRow = (item: FormItem): item is FieldRow =>
  (item as FieldRow).type === 'row'

// ─── Form ─────────────────────────────────────────────────────────────────────
export type SubmitMode = 'webflow' | 'webhook' | 'both'

export interface FormConfig {
  formName: string
  redirectUrl: string
  buttonLabel: string
  submitMode: SubmitMode
  webhookUrl: string
  successMessage: string
  errorMessage: string
  theme: FormTheme
}

// ─── Options ──────────────────────────────────────────────────────────────────
export const INPUT_TYPE_OPTIONS: { label: string; value: InputType }[] = [
  { label: 'Text', value: 'text' }, { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'tel' }, { label: 'Number', value: 'number' },
  { label: 'Password', value: 'password' }, { label: 'URL', value: 'url' },
  { label: 'Search', value: 'search' }, { label: 'Textarea', value: 'textarea' },
  { label: 'Select', value: 'select' }, { label: 'Checkbox', value: 'checkbox' },
  { label: 'Radio', value: 'radio' }, { label: 'Toggle', value: 'toggle' },
  { label: 'Date', value: 'date' }, { label: 'Hidden', value: 'hidden' },
]

export const DATE_FORMAT_OPTIONS: { label: string; value: DateFormat }[] = [
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
]

export const AUTOCOMPLETE_OPTIONS: { label: string; value: AutocompleteValue }[] = [
  { label: 'Off', value: 'off' }, { label: 'Full Name', value: 'name' },
  { label: 'First Name', value: 'given-name' }, { label: 'Last Name', value: 'family-name' },
  { label: 'Email', value: 'email' }, { label: 'Phone', value: 'tel' },
  { label: 'Street Address', value: 'street-address' }, { label: 'Postal Code', value: 'postal-code' },
  { label: 'Country', value: 'country' }, { label: 'Username', value: 'username' },
  { label: 'Current Password', value: 'current-password' }, { label: 'New Password', value: 'new-password' },
  { label: 'Birthday', value: 'bday' }, { label: 'Organisation', value: 'organization' },
]

export const inferInputMode = (type: InputType): string => {
  switch (type) {
    case 'email': return 'email'; case 'tel': return 'tel'
    case 'number': return 'numeric'; case 'url': return 'url'
    case 'search': return 'search'; default: return 'text'
  }
}

export const inferAutoComplete = (type: InputType): AutocompleteValue => {
  switch (type) {
    case 'email': return 'email'; case 'tel': return 'tel'
    case 'password': return 'current-password'; default: return 'off'
  }
}

export const FIELD_PRESETS: { label: string; icon: string; config: Partial<FieldConfig> }[] = [
  { label: 'First Name', icon: '👤', config: { label: 'First Name', fieldName: 'first_name', placeholder: 'First name', type: 'text', autoComplete: 'given-name', inputMode: 'text' } },
  { label: 'Last Name', icon: '👤', config: { label: 'Last Name', fieldName: 'last_name', placeholder: 'Last name', type: 'text', autoComplete: 'family-name', inputMode: 'text' } },
  { label: 'Email', icon: '✉️', config: { label: 'Email', fieldName: 'email', placeholder: 'you@example.com', type: 'email', required: true, autoComplete: 'email', inputMode: 'email' } },
  { label: 'Phone', icon: '📞', config: { label: 'Phone', fieldName: 'phone', placeholder: '+44 7700 000000', type: 'tel', autoComplete: 'tel', inputMode: 'tel' } },
  { label: 'Message', icon: '💬', config: { label: 'Message', fieldName: 'message', placeholder: 'Your message…', type: 'textarea', autoComplete: 'off', inputMode: 'text' } },
  { label: 'Company', icon: '🏢', config: { label: 'Company', fieldName: 'company', placeholder: 'Company name', type: 'text', autoComplete: 'organization', inputMode: 'text' } },
  { label: 'Website', icon: '🌐', config: { label: 'Website', fieldName: 'website', placeholder: 'https://', type: 'url', autoComplete: 'off', inputMode: 'url' } },
  { label: 'Date', icon: '📅', config: { label: 'Date', fieldName: 'date', placeholder: '', type: 'date', autoComplete: 'off', inputMode: 'text', dateMode: 'single', dateFormat: 'DD/MM/YYYY' } },
  { label: 'Dropdown', icon: '▾', config: { label: 'Option', fieldName: 'option', placeholder: 'Select…', type: 'select', autoComplete: 'off', inputMode: 'text', options: [{ label: 'Option 1', value: 'option_1' }, { label: 'Option 2', value: 'option_2' }] } },
  { label: 'Checkbox', icon: '☑', config: { label: 'I agree', fieldName: 'agree', placeholder: '', type: 'checkbox', autoComplete: 'off', inputMode: 'text', checkboxMode: 'single', options: [{ label: 'I agree to the terms', value: 'agree' }] } },  { label: 'Radio', icon: '◉', config: { label: 'Choose one', fieldName: 'choice', placeholder: '', type: 'radio', autoComplete: 'off', inputMode: 'text', options: [{ label: 'Option A', value: 'a' }, { label: 'Option B', value: 'b' }] } },
  { label: 'Toggle', icon: '⏻', config: { label: 'Toggle', fieldName: 'toggle', placeholder: '', type: 'toggle', autoComplete: 'off', inputMode: 'text' } },
  { label: 'Hidden', icon: '👁', config: { label: 'Hidden Field', fieldName: 'hidden_field', placeholder: '', type: 'hidden', autoComplete: 'off', inputMode: 'text' } },
]

let _idCounter = 0

export const createField = (preset: Partial<FieldConfig>): FieldConfig => {
  const { id: _ignored, ...rest } = preset as any
  return {
    id: `field_${Date.now()}_${++_idCounter}_${Math.random().toString(36).slice(2, 9)}`,
    label: 'Field', fieldName: 'field', placeholder: '', helpText: '',
    validationMessage: '', required: false, defaultValue: '', type: 'text',
    inputMode: 'text', autoComplete: 'off', cssClasses: '', labelVariant: 'visible',
    options: [],
    dateMode: 'single',
    dateFormat: 'DD/MM/YYYY',
    checkboxMode: 'single',
    ...rest,
  }
}

export const createRow = (fields: FieldConfig[]): FieldRow => ({
  id: `row_${Date.now()}_${++_idCounter}`,
  type: 'row',
  columns: fields,
})

export const createDefaultForm = (): FormConfig => ({
  formName: `Form ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
  redirectUrl: '',
  buttonLabel: 'Submit', submitMode: 'webflow', webhookUrl: '',
  successMessage: 'Thank you! Your submission has been received.',
  errorMessage: 'Something went wrong. Please try again.',
  theme: { ...DEFAULT_THEME },
})

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
export const saveTheme = (siteId: string, theme: FormTheme) => {
  try { localStorage.setItem(`fb_theme_${siteId}`, JSON.stringify(theme)) } catch {}
}

export const loadTheme = (siteId: string): FormTheme | null => {
  try {
    const raw = localStorage.getItem(`fb_theme_${siteId}`)
    if (!raw) return null
    return { ...DEFAULT_THEME, ...JSON.parse(raw) }
  } catch { return null }
}

// ─── Template field descriptors ───────────────────────────────────────────────
export const TEMPLATE_FIELD_DESCRIPTIONS: Record<string, string[]> = {
  'Contact': ['First Name + Last Name (row)', 'Email (required)', 'Message (textarea)'],
  'Lead Gen': ['Full Name + Work Email (row)', 'Company + Phone (row)'],
  'Newsletter': ['First Name + Email (row)'],
}
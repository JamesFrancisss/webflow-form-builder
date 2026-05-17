import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

declare const webflow: any

// Set the extension to a larger size on load
webflow.setExtensionSize('large')

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
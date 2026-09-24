import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNativeUI } from '@/lib/native'

// Native (iOS/Android) startup polish — no-op on web.
initNativeUI()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

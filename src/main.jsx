import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Library files
import './lib/api.js'
// UI Components
import './components/ui/UIPrimitives.jsx'
import './components/ui/UIForm.jsx'
import './components/ui/UIOverlay.jsx'
import './components/ui/DateRangePicker.jsx'
// Layout
import './components/layout/Layout.jsx'
// Pages
import './components/pages/LoginPage.jsx'
import './components/pages/DashboardPage.jsx'
import './components/pages/IssuesPage.jsx'
import './components/pages/IssuesInboxPage.jsx'
import './components/pages/ReportsPage.jsx'
import './components/pages/AdminPages.jsx'
// App
import { App } from './app.jsx'

createRoot(document.getElementById('root')).render(<App />)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './static/css_styles/index.css'
import DmeExplorer from "./App.jsx"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* The DmeExplorer is a render component from the function */}
    <DmeExplorer/>
  </StrictMode>,
)

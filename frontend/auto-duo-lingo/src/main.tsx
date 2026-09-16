import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LessonProvider } from './context/LessonContext'
import { ThemeModeProvider } from './context/ThemeModeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <LessonProvider>
        <App />
      </LessonProvider>
    </ThemeModeProvider>
  </StrictMode>,
)

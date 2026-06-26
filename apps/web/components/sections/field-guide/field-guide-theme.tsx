'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'fg-theme'

interface FieldGuideThemeValue {
  theme: Theme
  toggle: () => void
}

const FieldGuideThemeContext = createContext<FieldGuideThemeValue | null>(null)

/**
 * Holds the Field Guide's Paper/Ink theme. Mounted in the field-guide layout
 * so the choice persists across chapter navigations (the layout does not
 * remount), which keeps client-side chapter transitions flash-free. Stored
 * under `fg-theme`, independent of the site-wide theme.
 */
export function FieldGuideThemeProvider({
  children,
}: {
  children: ReactNode
}) {
  const [theme, setTheme] = useState<Theme>('light')

  // Restore the stored theme on mount (SSR renders light to avoid mismatch).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') setTheme(stored)
    } catch {
      // localStorage unavailable — keep the light default.
    }
  }, [])

  const toggle = () => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Ignore persistence failures.
      }
      return next
    })
  }

  return (
    <FieldGuideThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </FieldGuideThemeContext.Provider>
  )
}

export function useFieldGuideTheme(): FieldGuideThemeValue {
  const value = useContext(FieldGuideThemeContext)
  if (!value) {
    throw new Error(
      'useFieldGuideTheme must be used within a FieldGuideThemeProvider'
    )
  }
  return value
}

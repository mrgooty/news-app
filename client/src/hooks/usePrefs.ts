import { useState, useEffect } from 'react'
import { getPrefs, setPrefs, clearPrefs, Prefs } from '../lib/prefs'

export function usePrefs() {
  const [prefs, setLocalPrefs] = useState<Prefs | null>(null)

  useEffect(() => {
    setLocalPrefs(getPrefs())
  }, [])

  const save = (newPrefs: Prefs) => {
    setPrefs(newPrefs)
    setLocalPrefs(newPrefs)
  }

  const clear = () => {
    clearPrefs()
    setLocalPrefs(null)
  }

  return { prefs, save, clear }
}

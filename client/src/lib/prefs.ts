export interface Prefs {
  categories: string[]
  locations: string[]
}

const STORAGE_KEY = 'newsAppPrefs'

export const getPrefs = (): Prefs | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) as Prefs : null
}

export const setPrefs = (p: Prefs) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export const clearPrefs = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  sessionStorage.removeItem(STORAGE_KEY)
}

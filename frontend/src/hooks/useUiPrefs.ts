import { useEffect, useState } from "react"

export type Theme = "midnight" | "paper" | "sepia" | "ocean" | "contrast"
export type Layout = "three" | "two" | "center"
export type TypeMode = "hybrid" | "mono"

const THEME_KEY = "concept-master.theme"
const LAYOUT_KEY = "concept-master.layout"
const TYPE_KEY = "concept-master.typeMode"

const VALID_THEMES: Theme[] = ["midnight", "paper", "sepia", "ocean", "contrast"]
const VALID_LAYOUTS: Layout[] = ["three", "two", "center"]
const VALID_TYPES: TypeMode[] = ["hybrid", "mono"]

function readStored<T extends string>(key: string, valid: T[], fallback: T): T {
  const stored = localStorage.getItem(key)
  return (valid as string[]).includes(stored ?? "") ? (stored as T) : fallback
}

export function useUiPrefs() {
  const [theme, setTheme] = useState<Theme>(() => readStored(THEME_KEY, VALID_THEMES, "midnight"))
  const [layout, setLayout] = useState<Layout>(() => readStored(LAYOUT_KEY, VALID_LAYOUTS, "three"))
  const [typeMode, setTypeMode] = useState<TypeMode>(() => readStored(TYPE_KEY, VALID_TYPES, "hybrid"))

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layout)
  }, [layout])

  useEffect(() => {
    document.documentElement.setAttribute("data-type", typeMode)
    localStorage.setItem(TYPE_KEY, typeMode)
  }, [typeMode])

  return { theme, setTheme, layout, setLayout, typeMode, setTypeMode }
}

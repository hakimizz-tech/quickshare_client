import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

/**
 * ThemeToggle switches between light and dark modes.
 */
export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const current = theme === "system" ? systemTheme : theme
  const isDark = current === "dark"

  const handleToggle = () => setTheme(isDark ? "light" : "dark")

  if (!mounted) return null

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-white/10 text-black dark:text-white transition hover:bg-white/90 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50 dark:focus-visible:ring-white/50"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

export default ThemeToggle

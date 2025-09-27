import { useState } from "react"
import { Menu, X } from "lucide-react"
import BrandLockup from "@/components/Brand"
import ThemeToggle from "@/components/ThemeToggle"

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "FAQ’s", href: "#faqs" },
]

/**
 * Global site header with brand, primary navigation and a mobile drawer.
 */
function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="relative top-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <BrandLockup />

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-black/40 bg-white/70 p-2 text-black transition-colors hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 md:hidden dark:border-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:ring-white/60"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden items-center gap-4 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="metamorphous-regular text-xs md:text-sm uppercase tracking-wide text-black/80 dark:text-white/80 transition-colors hover:text-black dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#upload"
            className="metamorphous-regular text-xs md:text-sm rounded-full bg-white/70 dark:bg-white/10 px-3 py-1.5 text-black dark:text-white ring-1 ring-black/10 dark:ring-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition"
          >
            Start upload
          </a>
        </nav>
      </div>

      {isOpen && (
        <nav id="mobile-nav" className="md:hidden animate-fade-in-up">
          <div className="space-y-2 border-t border-black/10 dark:border-white/15 bg-white/60 dark:bg-black/60 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-black dark:text-white transition-colors hover:bg-white/70 dark:hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#upload"
              className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-black dark:text-white bg-white/70 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 hover:bg-white dark:hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              Start upload
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header

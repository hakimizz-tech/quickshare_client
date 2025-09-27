import { useState } from "react"
import { Menu, Share2, X } from "lucide-react"

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "FAQ’s", href: "#faqs" },
]

function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="relative top-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <a href="#" className="flex items-center gap-2">
          <span className="rounded-full bg-white/80 p-2 text-primary shadow-md">
            <Share2 className="h-5 w-5 text-primary" strokeWidth={1.8} />
          </span>
          <span className="merriweather-heading text-xl font-semibold text-gray-900 md:text-2xl">
            QuickShare
          </span>
        </a>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/40 p-2 text-gray-800 transition-colors hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="metamorphous-regular text-sm uppercase tracking-wide text-gray-800 transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {isOpen && (
        <nav className="md:hidden">
          <div className="space-y-2 border-t border-white/30 bg-white/60 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-gray-800 transition-colors hover:bg-white/70"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
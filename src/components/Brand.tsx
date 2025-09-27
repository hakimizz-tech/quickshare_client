import { Share2 } from "lucide-react"

/**
 * BrandLockup renders the QuickShare wordmark with a minimal monochrome mark.
 */
export function BrandLockup() {
  return (
    <a href="#" className="flex items-center gap-2 group" aria-label="QuickShare home">
      <span className="inline-flex items-center justify-center rounded-full bg-white/80 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 p-2 shadow-sm">
        <Share2 className="h-5 w-5 text-black dark:text-white transition-transform group-hover:scale-105" strokeWidth={1.8} />
      </span>
      <span className="flex flex-col">
        <span className="merriweather-heading text-xl md:text-2xl font-semibold text-black dark:text-white">QuickShare</span>
        <span className="metamorphous-regular text-[10px] md:text-xs uppercase tracking-wider text-black/60 dark:text-white/60 hidden sm:block">Fast file transfers</span>
      </span>
    </a>
  )
}

export default BrandLockup

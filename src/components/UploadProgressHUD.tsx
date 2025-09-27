import { useEffect, useMemo, useRef } from "react"
import gsap from "gsap"

export interface UploadProgressHUDProps {
  /** Percentage [0-100]. If null/undefined, the HUD should not render. */
  percent: number | null | undefined
  /** Whether an upload is currently active. */
  isUploading: boolean
}

/**
 * Fixed, top-right progress HUD for global upload feedback with GSAP animations.
 */
export default function UploadProgressHUD({ percent, isUploading }: UploadProgressHUDProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  const safePercent = useMemo(() => Math.max(0, Math.min(100, Math.round(percent ?? 0))), [percent])

  useEffect(() => {
    if (!containerRef.current) return
    gsap.fromTo(
      containerRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
    )
  }, [])

  useEffect(() => {
    if (!barRef.current) return
    gsap.to(barRef.current, {
      width: `${safePercent}%`,
      duration: 0.3,
      ease: "power1.out",
    })
  }, [safePercent])

  // Optional subtle pulsing when finishing
  useEffect(() => {
    if (!containerRef.current) return
    if (!isUploading && safePercent >= 100) {
      const tl = gsap.timeline()
      tl.to(containerRef.current, { scale: 1.02, duration: 0.12, ease: "power1.out" })
        .to(containerRef.current, { scale: 1, duration: 0.12, ease: "power1.out" })
      return () => tl.kill()
    }
  }, [isUploading, safePercent])

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-4 z-50 min-w-[220px] rounded-xl bg-white/90 dark:bg-black/70 ring-1 ring-black/10 dark:ring-white/10 shadow-sm backdrop-blur px-4 py-3 text-black dark:text-white"
      role="region"
      aria-label="Upload progress"
    >
      <div className="flex items-center justify-between text-xs font-medium">
        <span>{safePercent >= 100 ? "Finalising" : "Uploading"}</span>
        <span>{safePercent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
        className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/20"
      >
        <div
          ref={barRef}
          className="h-full w-0 rounded-full bg-black dark:bg-white"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}

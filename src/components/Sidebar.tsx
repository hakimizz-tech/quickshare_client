import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import { MoveRight, Search } from "lucide-react"
import { axios_instance } from "@/lib/api"

// Cached fallback data and memoized values to limit API calls
const FALLBACK_EXTENSIONS = ["pdf", "docx"]
let extensionCache: string[] | null = null
let extensionPromise: Promise<string[]> | null = null

// Enable GSAP's ScrollTrigger once on the client for fading the list header
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// Presentation-only component for the search bar and animated extension list
const SidebarContent = ({ extensions }: { extensions: string[] }) => {
  const listWrapperRef = useRef<HTMLDivElement | null>(null)

  // Fade the top of the list underneath the sticky search bar using ScrollTrigger
  useEffect(() => {
    if (!listWrapperRef.current) return

    const scroller = listWrapperRef.current.closest("[data-scroll-container]") as HTMLElement | null
    if (!scroller) return

    const ctx = gsap.context(() => {
      const overlay = listWrapperRef.current!.querySelector<HTMLElement>(".sidebar-fade-overlay")
      if (!overlay) return

      gsap.fromTo(
        overlay,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: listWrapperRef.current!,
            scroller,
            start: "top top",
            end: "+=24",
            scrub: true,
          },
        },
      )
    }, listWrapperRef)

    return () => ctx.revert()
  }, [extensions])

  return (
    <>
      {/* Sticky search/filter header */}
      <div className="sticky top-0 z-10 bg-white pb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-[#EDEDED]">
            <Search className="h-5 w-5 text-gray-600" />
          </span>
          <input
            type="search"
            placeholder="Check for uploadable files"
            className="w-full rounded-full border border-black bg-[#EDEDED] py-3 pl-14 pr-4 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Extension list fades under the header as users scroll */}
      <div ref={listWrapperRef} className="relative mt-8">
        <div className="pointer-events-none sidebar-fade-overlay absolute inset-x-0 top-0 h-16 bg-white opacity-0" />
        <ul className="mt-6 flex flex-col gap-2">
          {extensions.map((type) => (
            <li
              key={type}
              className="metamorphous-regular py-2 text-left text-sm uppercase tracking-wide text-black"
            >
              {type}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

// Interactive sidebar shell: loads extension data, handles GSAP drawer motion, and renders layouts
function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const hintRef = useRef<HTMLSpanElement | null>(null)
  const dragState = useRef({ dragging: false, startX: 0 })

  // Initialize extension list from cache/localStorage before requesting fresh data
  const [extensions, setExtensions] = useState<string[]>(() => {
    if (extensionCache) return extensionCache

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("quickshare.supportedExtensions")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const sanitized = parsed.filter((item): item is string => typeof item === "string")
            extensionCache = sanitized
            return sanitized
          }
        } catch (error) {
          console.warn("Unable to parse cached extensions", error)
        }
      }
    }

    return FALLBACK_EXTENSIONS
  })

  // Fetch supported extensions once, caching results for later mounts
  useEffect(() => {
    if (extensionCache && extensionCache.length) return

    if (!extensionPromise) {
      extensionPromise = axios_instance({
        url: "supported-extensions",
        method: "get",
      })
        .then((response) => {
          const list = Array.isArray(response.data?.extensions)
            ? response.data.extensions.filter((item: unknown): item is string => typeof item === "string")
            : []

          const values = list.length ? list : FALLBACK_EXTENSIONS
          extensionCache = values

          if (typeof window !== "undefined") {
            window.localStorage.setItem("quickshare.supportedExtensions", JSON.stringify(values))
          }

          return values
        })
        .catch((error) => {
          console.error("Failed to load supported extensions", error)
          extensionCache = FALLBACK_EXTENSIONS
          return FALLBACK_EXTENSIONS
        })
        .finally(() => {
          extensionPromise = null
        })
    }

    extensionPromise?.then((values) => {
      setExtensions(values)
    })
  }, [])

  // Animate the arrow hint and its label for the mobile drawer
  useEffect(() => {
    if (!arrowRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(arrowRef.current, {
        x: 8,
        duration: 1.4,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
      })

      if (hintRef.current) {
        gsap.fromTo(
          hintRef.current,
          { opacity: 0.2 },
          {
            opacity: 1,
            duration: 1.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          },
        )
      }
    }, arrowRef)

    return () => ctx.revert()
  }, [])

  // Prime the mobile drawer to stay hidden until opened
  useEffect(() => {
    if (!drawerRef.current) return

    gsap.set(drawerRef.current, { x: "-100%" })
  }, [])

  // Slide the mobile drawer in/out as the open state changes
  useEffect(() => {
    if (!drawerRef.current) return

    gsap.to(drawerRef.current, {
      x: isOpen ? 0 : "-100%",
      duration: 0.5,
      ease: "power3.out",
    })
  }, [isOpen])

  const startDrag = (clientX: number) => {
    dragState.current = { dragging: true, startX: clientX }
  }

  const stopDrag = () => {
    dragState.current = { dragging: false, startX: 0 }
  }

  const updateDrag = (clientX: number) => {
    if (!dragState.current.dragging) return
    const delta = clientX - dragState.current.startX

    if (!isOpen && delta > 40) {
      setIsOpen(true)
      stopDrag()
    } else if (isOpen && delta < -40) {
      setIsOpen(false)
      stopDrag()
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    startDrag(event.clientX)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    updateDrag(event.clientX)
  }

  const handlePointerUp = () => {
    stopDrag()
  }

  return (
    <>
      <div className="hidden md:block md:w-full md:max-w-sm">
        <aside data-scroll-container className="sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto bg-white p-6 shadow-xl shadow-black/10">
          <SidebarContent extensions={extensions} />
        </aside>
      </div>

      <div className="md:hidden">
        <div
          ref={drawerRef}
          data-scroll-container
          className="fixed left-0 top-[72px] z-40 h-[calc(100vh-72px)] w-72 overflow-y-auto rounded-tr-3xl rounded-br-3xl bg-white p-6 shadow-2xl shadow-black/20"
        >
          <SidebarContent extensions={extensions} />
        </div>

        <div className="fixed left-3 top-1/2 z-50 -translate-y-1/2 flex flex-col items-center space-y-2">
          <div
            ref={arrowRef}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-black/15 bg-white/80 shadow-lg shadow-black/20 backdrop-blur"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <MoveRight className={`h-6 w-6 text-black transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
          <span
            ref={hintRef}
            className="metamorphous-regular rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-wide text-black shadow"
          >
            drag me
          </span>
        </div>
      </div>
    </>
  )
}

export default Sidebar
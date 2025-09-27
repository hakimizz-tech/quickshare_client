import Header from "@/components/Header"
import UploadForm from "@/components/UploadForm"
import { Toaster } from "@/components/ui/sonner"
import { ShieldCheck, Lock, Rocket, Share2, Zap } from "lucide-react"

/**
 * Home page shell: orchestrates the global layout, hero section, sidebar, and
 * the upload form. Visuals are enhanced with subtle animations and spacing
 * while preserving the existing API and business logic.
 */
function Home() {
  return (
    <div className="relative min-h-screen">
      <div className="min-h-[100vh] w-full bg-white dark:bg-black transition-colors flex flex-col">
        <Header />
        <Toaster position="top-center" closeButton />

        <div className="w-full max-w-4xl mx-auto px-4 md:px-6">
          <main className="rounded-3xl bg-transparent flex flex-col justify-start items-center py-8 md:py-12 text-black dark:text-white">
            {/* Hero copy */}
            <section className="flex w-full max-w-2xl flex-col items-center text-center gap-4 animate-fade-in-up">
              <h1 className="merriweather-heading text-3xl md:text-4xl font-semibold text-black dark:text-white">
                Share Large Files. Simply
              </h1>
              <p className="metamorphous-regular text-base md:text-lg text-black/80 dark:text-white/80 leading-relaxed">
                Transfer files too big for email or messages. Fast, secure, and no registration required.
              </p>
            </section>

            {/* Upload form anchor */}
            <section id="upload" className="mt-8 md:mt-10 w-full flex justify-center">
              <UploadForm />
            </section>

            {/* Value props */}
            <section className="mt-12 md:mt-16 w-full max-w-3xl">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <li className="group rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/10 hover:shadow-md transition animate-fade-in-up [animation-delay:120ms]">
                  <div className="flex items-start gap-3">
                    <Rocket className="h-5 w-5 text-black/80 mt-0.5" />
                    <div>
                      <h3 className="merriweather-heading text-lg text-black">Fast transfers</h3>
                      <p className="metamorphous-regular text-sm text-black/70">Optimized for speed with resumable uploads.</p>
                    </div>
                  </div>
                </li>
                <li className="group rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/10 hover:shadow-md transition animate-fade-in-up [animation-delay:200ms]">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-black/80 mt-0.5" />
                    <div>
                      <h3 className="merriweather-heading text-lg text-black">Private & secure</h3>
                      <p className="metamorphous-regular text-sm text-black/70">Encrypted transport and unique share links.</p>
                    </div>
                  </div>
                </li>
                <li className="group rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/10 hover:shadow-md transition animate-fade-in-up [animation-delay:280ms]">
                  <div className="flex items-start gap-3">
                    <Share2 className="h-5 w-5 text-black/80 mt-0.5" />
                    <div>
                      <h3 className="merriweather-heading text-lg text-black">No accounts</h3>
                      <p className="metamorphous-regular text-sm text-black/70">Start sharing instantly—no signup required.</p>
                    </div>
                  </div>
                </li>
                <li className="group rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/10 hover:shadow-md transition animate-fade-in-up [animation-delay:360ms]">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-black/80 mt-0.5" />
                    <div>
                      <h3 className="merriweather-heading text-lg text-black">Reliable by design</h3>
                      <p className="metamorphous-regular text-sm text-black/70">Resume from interruptions without losing progress.</p>
                    </div>
                  </div>
                </li>
              </ul>
            </section>

            {/* Anchor targets for header links */}
            <section id="how-it-works" className="mt-16 md:mt-20 w-full max-w-3xl animate-fade-in-up [animation-delay:440ms]">
              <h2 className="merriweather-heading text-2xl text-black mb-3">How it works</h2>
              <p className="metamorphous-regular text-black/80 text-sm leading-relaxed">
                Drag and drop your file or pick one from your device. We upload in small chunks so transfers
                are fast and resilient. When it’s done, you’ll get a unique link you can share anywhere.
              </p>
            </section>

            <section id="security" className="mt-12 w-full max-w-3xl animate-fade-in-up [animation-delay:520ms]">
              <h2 className="merriweather-heading text-2xl text-black mb-3">Security</h2>
              <p className="metamorphous-regular text-black/80 text-sm leading-relaxed">
                Your files travel over secure connections and are stored behind protected endpoints. Only people
                with your unique link can access the download.
              </p>
            </section>

            <section id="faqs" className="mt-12 w-full max-w-3xl animate-fade-in-up [animation-delay:600ms]">
              <h2 className="merriweather-heading text-2xl text-black mb-3">FAQs</h2>
              <ul className="space-y-2 text-sm text-black/80 metamorphous-regular">
                <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-1" /> Is there a file size limit? Large files are supported with chunked uploads.</li>
                <li className="flex items-start gap-2"><Lock className="h-4 w-4 mt-1" /> Do I need an account? No, just upload and share your link.</li>
                <li className="flex items-start gap-2"><Rocket className="h-4 w-4 mt-1" /> What if my connection drops? Uploads resume from where they left off.</li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Home

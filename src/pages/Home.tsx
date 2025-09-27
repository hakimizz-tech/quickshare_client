import backgroundImage from "@/assets/54521.png"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import UploadForm from "@/components/UploadForm"
import { Toaster } from "@/components/ui/sonner"

function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="min-h-[100vh] w-full bg-white/25 backdrop-blur-lg flex flex-col">
        <Header />
        <Toaster position="top-center" richColors closeButton />
        
        <div className="flex w-full max-w-full gap-8 flex-row md:items-start ">
          <Sidebar />

          <main className="flex-1 rounded-3xl bg-transparent  flex flex-col justify-center items-center">

            {/* text div */}
            <div className="merriweather-heading text-2xl font-semibold text-black text-center gap-4 flex flex-col md:text-3xl">
                <h1 >
                  Share Large Files. Simply
               </h1>
              <h2 className="text-lg md:text-2xl">
                Transfer files too big for email or messages. <br /> Fast, secure, and no registration required
              </h2>
            </div>

            {/* form div for uploading files*/}
            <UploadForm />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Home
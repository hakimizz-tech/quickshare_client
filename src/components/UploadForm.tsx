import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CloudUpload, Copy, File as FileIcon } from "lucide-react"
import { toast } from "sonner"

import { uploadFormSchema, type UploadFormValues } from "@/lib/schema"
import { useResumableUploader, DEFAULT_CHUNK_SIZE } from "@/lib/hooks/useResumableUploader"
import { Progress } from "@/components/ui/progress"

/**
 * Drag-and-drop upload form that validates file metadata with React Hook Form + Zod
 * before triggering the resumable upload workflow.
 */
function UploadForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  /** Selected files from the user (first entry drives validation metadata). */
  const [files, setFiles] = useState<File[]>([])
  /** Flag that toggles dropzone styling while a drag operation is active. */
  const [isDragActive, setIsDragActive] = useState(false)
  /** Stores the download URL returned after a successful upload, if available. */
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  /** Error message prompting the user to choose a file before submitting. */
  const [fileSelectionError, setFileSelectionError] = useState<string | null>(null)
  /** Unique identifier used to associate external controls with the hidden form element. */
  const formId = useId()

  /**
   * React Hook Form instance, configured with the Zod schema so the UI remains in sync
   * with the backend contract defined in `uploadFormSchema`.
   */
  const {
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      fileName: "",
      totalSize: 0,
      totalChunks: 0,
    },
  })

  /** Handles the API calls for initiating, chunking, and completing the upload. */
  const {
    uploadFromFormData,
    progress,
    error: uploadError,
    isUploading,
    reset: resetUploadState,
  } = useResumableUploader({ chunkSize: DEFAULT_CHUNK_SIZE })

  /** Formatter for presenting byte progress in a compact, human-friendly style. */
  const compactNumberFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { notation: "compact" }),
    []
  )

  /** Copy the generated download link to the clipboard for easy sharing. */
  const handleCopyDownloadLink = async () => {
    if (!downloadUrl) return

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(downloadUrl)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = downloadUrl
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      toast.success("Download link copied to your clipboard")
    } catch (copyError) {
      if (import.meta.env.DEV) {
        console.error("Failed to copy download link", copyError)
      }
      toast.error("Couldn't copy the link. Please try again.")
    }
  }

  /** Programmatically open the file picker when the user clicks the button. */
  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  /**
   * Normalise files coming from either the input element or drag-and-drop, then
   * populate both local state and the form metadata fields.
   */
  const handleFilesUpdate = (incoming: FileList | null) => {
    if (!incoming?.length) {
      setFiles([])
      reset()
      resetUploadState()
      setDownloadUrl(null)
      setFileSelectionError(null)
      return
    }

    const selectedFiles = Array.from(incoming)
    setFiles(selectedFiles)
    setDownloadUrl(null)
    setFileSelectionError(null)

    const primaryFile = selectedFiles[0]
    if (!primaryFile) return

    const computedTotalChunks = Math.max(1, Math.ceil(primaryFile.size / DEFAULT_CHUNK_SIZE))

    setValue("fileName", primaryFile.name, { shouldDirty: true, shouldTouch: true })
    setValue("totalSize", primaryFile.size, { shouldDirty: true, shouldTouch: true })
    setValue("totalChunks", computedTotalChunks, { shouldDirty: true, shouldTouch: true })

    // Ensure validation runs after all fields have been updated to avoid transient schema errors.
    void trigger(["fileName", "totalSize", "totalChunks"])
  }

  /** Update files when the user chooses them via the hidden input. */
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFilesUpdate(event.target.files)
  }

  /** Highlight dropzone when a dragged item enters its bounds. */
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(true)
  }

  /** Maintain dropzone highlight while dragging over the component. */
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
    if (!isDragActive) setIsDragActive(true)
  }

  /** Remove dropzone highlight when the drag leaves the component bounds. */
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragActive(false)
    }
  }

  /** Accept dropped files, sync the hidden input, and run validation. */
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)

    const droppedFiles = event.dataTransfer?.files
    if (!droppedFiles?.length) return

    handleFilesUpdate(droppedFiles)

    if (fileInputRef.current) {
      try {
        const dataTransfer = new DataTransfer()
        Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file))
        fileInputRef.current.files = dataTransfer.files
      } catch {
        // DataTransfer may not be constructible in every environment
      }
    }
  }

  /**
   * Submit handler that serialises files and prepares the initiate payload once
   * the form values pass schema validation.
   */
  const onSubmit = handleSubmit(async (values) => {
    if (!files.length) {
      setFileSelectionError("Please choose a file to upload before submitting.")
      toast.error("Select a file first, then try uploading again.")
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))

    try {
      const outcome = await uploadFromFormData({
        formData,
        metadata: {
          file_name: values.fileName,
          total_size: values.totalSize,
          total_chunks: values.totalChunks,
        },
      })

      setDownloadUrl(outcome.downloadUrl)
      toast.success("Upload complete! Your download link is ready.")
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Upload failed", error)
      }
      toast.error("Upload failed. Please try again.")
    }
  })

  return (
    <div className="mt-6 md:mt-10 flex flex-col items-center gap-6 md:items-start animate-fade-in-up">
      {/* Dropzone */}
      <div
        className={`flex w-full max-w-md flex-col items-center justify-center rounded-[10px] border border-black dark:border-white bg-white dark:bg-black p-6 text-center transition ${isDragActive ? "border-dashed" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="File upload dropzone"
      >
        {files.length === 0 ? (
          <>
            <CloudUpload className="h-[200px] w-[200px] text-black animate-float" strokeWidth={1.2} />
            <span className="mt-4 text-xl font-semibold text-black">Drag &amp; Drop</span>
            <p className="mt-2 text-sm text-black/70">Allowing users to drag and drop files</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-black">
            <FileIcon className="h-16 w-16 text-black" strokeWidth={1.4} />
            <span className="text-lg font-semibold">Selected file</span>
            <p className="max-w-full break-words text-sm text-black/80">{files[0].name}</p>
            {files.length > 1 && (
              <p className="text-xs text-black/60">+ {files.length - 1} more file(s)</p>
            )}
          </div>
        )}
      </div>

      <form id={formId} className="hidden" onSubmit={onSubmit}>
        {/* Hidden input keeps the native file picker accessible for non-drag uploads */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleInputChange} />
      </form>

      {/* Validation messages */}
      <div className="w-full max-w-md text-sm text-red-600 space-y-1">
        {errors.fileName?.message && <p>{errors.fileName.message}</p>}
        {!errors.fileName?.message && (errors.totalSize?.message || errors.totalChunks?.message) && (
          <p>{errors.totalSize?.message ?? errors.totalChunks?.message}</p>
        )}
        {fileSelectionError && <p>{fileSelectionError}</p>}
        {uploadError && <p>{uploadError}</p>}
      </div>

      {/* Upload progress and result */}
      {(progress || downloadUrl) && (
        <div className="w-full max-w-md space-y-4 text-sm text-black" aria-live="polite">
          {progress && (
            <div className="space-y-2 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-black/60">
                <span>{progress.percentage >= 100 ? "Finalising" : "Uploading"}</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <Progress value={progress.percentage} className="h-3" />
              <div className="flex items-center justify-between text-xs text-black/60">
                <span>Uploaded</span>
                <span>
                  {compactNumberFormatter.format(progress.uploadedBytes)} / {compactNumberFormatter.format(progress.totalBytes)}
                </span>
              </div>
            </div>
          )}
          {downloadUrl && (
            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm">
              <p className="text-sm font-medium">Upload complete! Share your link below:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={downloadUrl}
                  readOnly
                  className="flex-1 truncate rounded-md border border-green-200 bg-white/80 px-3 py-2 text-sm text-green-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/60"
                />
                <button
                  type="button"
                  onClick={handleCopyDownloadLink}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-green-200 bg-white/90 text-green-700 transition hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  aria-label="Copy download link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full max-w-md flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={handleSelectFile}
          className="inline-flex items-center gap-2 rounded-[15px] bg-[#E3E3E3] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#d8d8d8] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        >
          <CloudUpload className="h-5 w-5" strokeWidth={1.5} />
          Or,  click to select a file
        </button>

        <button
          type="submit"
          form={formId}
          disabled={isSubmitting || isUploading || files.length === 0}
          aria-disabled={isSubmitting || isUploading || files.length === 0}
          className="inline-flex items-center justify-center rounded-[15px] border border-black px-5 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 disabled:cursor-not-allowed disabled:border-black/40 disabled:text-black/50 disabled:hover:bg-transparent disabled:hover:text-black/50"
        >
          {isSubmitting || isUploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  )
}

export default UploadForm

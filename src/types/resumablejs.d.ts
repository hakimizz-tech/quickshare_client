declare module "resumablejs" {
  export type ResumableChunkStatus = "pending" | "uploading" | "success" | "error"

  export interface ResumableChunk {
    offset: number
    startByte: number
    endByte: number
    loaded: number
    status(): ResumableChunkStatus
  }

  export interface ResumableFile {
    resumableObj: ResumableInstance
    file: File
    fileName: string
    relativePath: string
    size: number
    uniqueIdentifier: string
    chunks: ResumableChunk[]
    progress(relative?: boolean): number
    isComplete(): boolean
  }

  export interface ResumableOptions {
    target: string | ((file: ResumableFile, chunk: ResumableChunk) => string)
    chunkSize?: number
    forceChunkSize?: boolean
    simultaneousUploads?: number
    testChunks?: boolean
    method?: "multipart" | "octet"
    uploadMethod?: string
    testMethod?: string
    parameterNamespace?: string
    fileParameterName?: string
    chunkNumberParameterName?: string
    chunkSizeParameterName?: string
    currentChunkSizeParameterName?: string
    totalSizeParameterName?: string
    typeParameterName?: string
    identifierParameterName?: string
    fileNameParameterName?: string
    relativePathParameterName?: string
    totalChunksParameterName?: string
    headers?:
      | Record<string, string>
      | ((file: ResumableFile) => Record<string, string>)
    query?:
      | Record<string, string | number>
      | ((file: ResumableFile, chunk: ResumableChunk) => Record<string, string | number>)
    withCredentials?: boolean
    chunkRetryInterval?: number
    maxChunkRetries?: number
    throttleProgressCallbacks?: number
    generateUniqueIdentifier?: (file: File) => string
  }

  export interface ResumableEventMap {
    fileSuccess: (file: ResumableFile, message: string) => void
    fileError: (file: ResumableFile, message: unknown) => void
    fileProgress: (file: ResumableFile) => void
    fileRetry: (file: ResumableFile) => void
    filesAdded: (files: ResumableFile[], filesSkipped?: ResumableFile[]) => void
    fileAdded: (file: ResumableFile, event?: Event) => void
    cancel: () => void
    error: (message: string, file: ResumableFile) => void
    uploadStart: () => void
    complete: () => void
    progress: () => void
  }

  export interface ResumableInstance {
    support: boolean
    opts: ResumableOptions
    files: ResumableFile[]
    addFile(file: File, event?: Event): void
    addFiles(files: File[], event?: Event): void
    removeFile(file: ResumableFile): void
    getFromUniqueIdentifier(uniqueIdentifier: string): ResumableFile | undefined
    upload(): void
    uploadNextChunk(): void
    pause(): void
    cancel(): void
    progress(relative?: boolean): number
    isUploading(): boolean
    updateQuery(query: ResumableOptions["query"]): void
    on<T extends keyof ResumableEventMap>(event: T, callback: ResumableEventMap[T]): void
    on(event: string, callback: (...args: unknown[]) => void): void
  }

  export interface ResumableConstructor {
    new (options?: ResumableOptions): ResumableInstance | false
    (options?: ResumableOptions): ResumableInstance | false
  }

  const Resumable: ResumableConstructor

  export default Resumable
  export {
    ResumableOptions,
    ResumableInstance,
    ResumableFile,
    ResumableChunk,
    ResumableChunkStatus,
    ResumableEventMap,
  }
}

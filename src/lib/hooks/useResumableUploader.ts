import { useCallback, useMemo, useRef, useState } from "react"
import Resumable from "resumablejs"

import {
	initiateUploadSession,
	completeUploadSession,
	axios_instance,
} from "../api"
import {
	uploadInitiateRequestSchema,
	type UploadInitiateRequest,
	type UploadCompleteResponse,
} from "../schema"

/**
 * Enumerates the states a resumable chunk can report while uploading.
 */
type ResumableChunkStatus = "pending" | "uploading" | "success" | "error"

/**
 * Represents a single chunk in the Resumable.js upload queue.
 */
interface ResumableChunk {
	offset: number
	status(): ResumableChunkStatus
}

/**
 * Wrapper describing the file managed by Resumable.js, including chunk metadata.
 */
interface ResumableFile {
	size: number
	chunks: ResumableChunk[]
	progress(relative?: boolean): number
}

/**
 * Minimal subset of the Resumable.js instance used by this hook.
 */
interface ResumableInstance {
	files: ResumableFile[]
	addFile(file: File): void
	on(event: "fileProgress", callback: (file: ResumableFile) => void): void
	on(event: "fileRetry", callback: (file: ResumableFile) => void): void
	on(event: "fileError", callback: (file: ResumableFile, message: unknown) => void): void
	on(event: "cancel", callback: () => void): void
	on(event: "fileSuccess", callback: (file: ResumableFile, message: string) => void): void
	on(event: string, callback: (...args: unknown[]) => void): void
	upload(): void
	cancel(): void
}

/**
 * Configuration options accepted by the locally typed Resumable.js constructor.
 */
interface ResumableOptions {
	target: string | ((file: ResumableFile, chunk: ResumableChunk) => string)
	chunkSize?: number
	forceChunkSize?: boolean
	simultaneousUploads?: number
	testChunks?: boolean
	method?: "multipart" | "octet"
	uploadMethod?: string
	headers?: Record<string, string>
	withCredentials?: boolean
	parameterNamespace?: string
	chunkNumberParameterName?: string
	chunkSizeParameterName?: string
	currentChunkSizeParameterName?: string
	totalSizeParameterName?: string
	typeParameterName?: string
	identifierParameterName?: string
	fileNameParameterName?: string
	relativePathParameterName?: string
	totalChunksParameterName?: string
	query?: Record<string, string | number>
	generateUniqueIdentifier?: (file: File) => string
}

/**
 * Constructor signature for the Resumable.js runtime object.
 */
interface ResumableConstructor {
	new (options?: ResumableOptions): ResumableInstance | false
}

/**
 * Default chunk size (5 MB) used when the caller doesn't provide an override.
 */
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024

/**
 * Tracks aggregate progress for the overall upload operation.
 */
export interface UploadProgress {
	uploadedBytes: number
	totalBytes: number
	percentage: number
	chunkNumber: number
	totalChunks: number
}

/**
 * Shape of the successful upload response resolved by the hook.
 */
export interface UploadOutcome {
	uploadId: string
	downloadUrl: string
	response: UploadCompleteResponse
}

/**
 * Parameters accepted by {@link uploadFromFormData}.
 */
export interface UploadFromFormDataParams {
	formData: FormData
	metadata: UploadInitiateRequest
	onProgress?: (progress: UploadProgress) => void
}

interface UseResumableUploaderOptions {
	chunkSize?: number
}

/**
 * Builds an Axios-style header map while prioritising binary uploads.
 */
function mergeAxiosHeaders(): Record<string, string> {
	const sources = [
		axios_instance.defaults.headers?.common ?? {},
		axios_instance.defaults.headers?.put ?? {},
	]
	const merged: Record<string, string> = {}
	sources.forEach((source) => {
		Object.entries(source).forEach(([key, value]) => {
			if (typeof value === "string" && value.trim().length > 0) {
				merged[key] = value
			}
		})
	})
	merged["Content-Type"] = "application/octet-stream"
	return merged
}

/**
 * Hook that wraps Resumable.js to provide resumable file uploads with progress updates.
 */
export function useResumableUploader(options: UseResumableUploaderOptions = {}) {
	const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE
	const [progress, setProgress] = useState<UploadProgress | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const abortControllerRef = useRef<AbortController | null>(null)
	const resumableRef = useRef<ResumableInstance | null>(null)

	/**
	 * Aborts the active upload (if any) and clears hook state back to idle.
	 */
	const reset = useCallback(() => {
		/** Reset cancellation handles and any persisted progress snapshot. */
		abortControllerRef.current?.abort()
		abortControllerRef.current = null
		resumableRef.current?.cancel()
		resumableRef.current = null
		setProgress(null)
		setError(null)
		setIsUploading(false)
	}, [])

	/**
	 * Starts a new resumable upload based on the provided `FormData` and metadata.
	 */
	const uploadFromFormData = useCallback(
		async ({ formData, metadata, onProgress }: UploadFromFormDataParams): Promise<UploadOutcome> => {
			/** Guard against concurrent upload invocations. */
			if (isUploading) {
				throw new Error("Another upload is already in progress")
			}

			/** Extract the first file from the `FormData` payload. */
			const files = formData.getAll("files").filter((item): item is File => item instanceof File)
			if (!files.length) {
				throw new Error("No files provided for upload")
			}

			const file = files[0]
			/** Compute upload metadata expected by the initiation endpoint. */
			const computedTotalChunks = Math.max(1, Math.ceil(file.size / chunkSize))
			const effectiveMetadata = uploadInitiateRequestSchema.parse({
				file_name: metadata.file_name,
				total_size: file.size,
				total_chunks: computedTotalChunks,
			})
			/** Resolve the base API URL once to avoid repeated string concatenations. */
			const baseURL = axios_instance.defaults.baseURL?.replace(/\/$/, "")
			if (!baseURL) {
				throw new Error("Upload service base URL is not configured")
			}

			/** Instantiate per-upload AbortController and seed initial progress. */
			const abortController = new AbortController()
			abortControllerRef.current = abortController
			setIsUploading(true)
			setError(null)

			const initialProgress: UploadProgress = {
				uploadedBytes: 0,
				totalBytes: file.size,
				percentage: 0,
				chunkNumber: 1,
				totalChunks: computedTotalChunks,
			}
			setProgress(initialProgress)
			onProgress?.(initialProgress)

			/** Placeholders for the active Resumable instance and abort listener. */
			let resumable: ResumableInstance | null = null
			let abortListener: (() => void) | null = null

			try {
				const initiateResponse = await initiateUploadSession(effectiveMetadata, abortController.signal)
				const uploadId = initiateResponse.upload_id
				const headers = mergeAxiosHeaders()

				/** Configure Resumable.js to target the backend chunk ingestion endpoint. */
				const maybeResumable = new (Resumable as unknown as ResumableConstructor)({
					chunkSize,
					forceChunkSize: true,
					simultaneousUploads: 1,
					testChunks: false,
					method: "octet",
					uploadMethod: "PUT",
					target(_file: ResumableFile, chunk: ResumableChunk) {
						const chunkNumber = chunk.offset + 1
						return `${baseURL}/upload/${uploadId}/chunk/${chunkNumber}`
					},
					query: {},
					headers,
					withCredentials: axios_instance.defaults.withCredentials ?? false,
					parameterNamespace: "",
					chunkNumberParameterName: "",
					chunkSizeParameterName: "",
					currentChunkSizeParameterName: "",
					totalSizeParameterName: "",
					typeParameterName: "",
					identifierParameterName: "",
					fileNameParameterName: "",
					relativePathParameterName: "",
					totalChunksParameterName: "",
					generateUniqueIdentifier: () => uploadId,
				})

				if (!maybeResumable) {
					throw new Error("Resumable.js is not supported in this browser")
				}

				const activeResumable = maybeResumable
				resumable = activeResumable
				resumableRef.current = activeResumable

				/** Abort immediately if the upload was cancelled mid-initialisation. */
				if (abortController.signal.aborted) {
					activeResumable.cancel()
					throw new DOMException("Upload aborted", "AbortError")
				}

				/** Keep the resumable transport aligned with external abort signals. */
				abortListener = () => {
					activeResumable.cancel()
				}
				abortController.signal.addEventListener("abort", abortListener)

				/** Translate Resumable.js file progress into UI snapshot values. */
				const updateProgress = (resumableFile: ResumableFile) => {
					const chunks = resumableFile.chunks ?? []
					const totalChunks = chunks.length || computedTotalChunks
					const completedChunks = chunks.reduce(
						(count, chunk) => (chunk.status() === "success" ? count + 1 : count),
						0,
					)
					const uploadingChunk = chunks.find((chunk) => chunk.status() === "uploading")
					const nextChunk = uploadingChunk ? uploadingChunk.offset + 1 : completedChunks + 1
					const boundedChunkNumber = Math.min(Math.max(nextChunk, 1), totalChunks || computedTotalChunks)
					const ratio = resumableFile.progress()
					const uploadedBytes = Math.round(ratio * resumableFile.size)
					const percentage = Math.min(100, Math.round(ratio * 100))

					const snapshot: UploadProgress = {
						uploadedBytes,
						totalBytes: resumableFile.size,
						percentage,
						chunkNumber: boundedChunkNumber || totalChunks || computedTotalChunks,
						totalChunks: totalChunks || computedTotalChunks,
					}

					setProgress(snapshot)
					onProgress?.(snapshot)
				}

				const outcome = await new Promise<UploadOutcome>((resolve, reject) => {
					let settled = false
					const resumableInstance = activeResumable

					/** Ensure the promise resolves or rejects only once. */
					const finalizeSuccess = (value: UploadOutcome) => {
						if (settled) return
						settled = true
						resolve(value)
					}

					const finalizeFailure = (reason: unknown) => {
						if (settled) return
						settled = true
						reject(reason)
					}

					/** Wire Resumable.js lifecycle events to state updates and finalisation. */
					resumableInstance.on("fileProgress", (fileProgress) => {
						updateProgress(fileProgress)
					})

					resumableInstance.on("fileRetry", () => {
						setError(null)
					})

					resumableInstance.on("fileError", (_file, message) => {
						const errorMessage =
							typeof message === "string" && message.length > 0
								? message
								: message instanceof Error
									? message.message
									: "Failed to upload file"
						setError(errorMessage)
						finalizeFailure(new Error(errorMessage))
					})

					resumableInstance.on("cancel", () => {
						setError("Upload aborted")
						finalizeFailure(new DOMException("Upload aborted", "AbortError"))
					})

					resumableInstance.on("fileSuccess", async (successfulFile) => {
						updateProgress(successfulFile)
						try {
							const completion = await completeUploadSession(uploadId, abortController.signal)
							finalizeSuccess({
								uploadId,
								downloadUrl: completion.download_url,
								response: completion,
							})
						} catch (completionError) {
							const normalized =
								completionError instanceof Error
									? completionError
									: new Error(String(completionError ?? "Failed to finalize upload"))
							setError(normalized.message)
							finalizeFailure(normalized)
						}
					})

					resumableInstance.addFile(file)
					const trackedFile = resumableInstance.files[resumableInstance.files.length - 1]
					if (!trackedFile) {
						finalizeFailure(new Error("Failed to queue file for upload"))
						return
					}

					/** Kick off the upload pipeline and emit the latest snapshot. */
					updateProgress(trackedFile)
					resumableInstance.upload()
				})

			
                setError(null)
				return outcome
			} catch (rawError) {
				/** Normalize errors (including aborts) so the UI can display clear feedback. */
				const isAbort = abortController.signal.aborted || (rawError instanceof DOMException && rawError.name === "AbortError")
				const normalizedError = isAbort
					? rawError instanceof DOMException
						? rawError
						: new DOMException("Upload aborted", "AbortError")
					: rawError instanceof Error
						? rawError
						: new Error(String(rawError ?? "Failed to upload file"))

				if (isAbort) {
					setError("Upload aborted")
				} else {
					setError(normalizedError.message)
				}

				resumable?.cancel()
				throw normalizedError
			} finally {
				/** Always detach listeners and reset hook state after completion. */
				if (abortListener) {
					abortController.signal.removeEventListener("abort", abortListener)
				}
				abortControllerRef.current = null
				resumableRef.current = null
				setIsUploading(false)
			}
		},
		[chunkSize, isUploading],
	)

	const state = useMemo(
		() => ({
			progress,
			error,
			isUploading,
		}),
		[progress, error, isUploading],
	)

	return {
		...state,
		reset,
		uploadFromFormData,
	}
}

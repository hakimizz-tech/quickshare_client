import axios from "axios"

import {
    uploadInitiateRequestSchema,
    uploadInitiateResponseSchema,
    uploadCompleteResponseSchema,
    type UploadInitiateRequest,
} from "./schema"

/**
 * Resolves the API base URL from environment variables, defaulting to the local v1 endpoint.
 * Trailing slashes are trimmed to make URL concatenation predictable.
 */
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_MOCK_BASE_URL ??
    "http://localhost:8000/v1"
).replace(/\/$/, "")

/**
 * Pre-configured Axios instance for interacting with the Quickshare backend API.
 * The instance automatically targets the versioned base URL and can be used to attach
 * interceptors in one place if needed.
 */
export const axios_instance = axios.create({
    baseURL: API_BASE_URL,
})

/**
 * Validates and initiates a new resumable upload session with the backend service.
 *
 * @param payload - File metadata that must satisfy the `uploadInitiateRequestSchema` contract.
 * @param signal - Optional abort signal to cancel the HTTP request.
 * @returns Parsed API response containing the generated `upload_id`.
 */
export async function initiateUploadSession(payload: UploadInitiateRequest, signal?: AbortSignal) {
    const body = uploadInitiateRequestSchema.parse(payload)
    const response = await axios_instance.post("upload/initiate", body, { signal })
    return uploadInitiateResponseSchema.parse(response.data)
}

/**
 * Configuration required to upload a single chunk as part of a resumable session.
 */
export interface UploadChunkParams {
    uploadId: string
    chunkNumber: number
    chunk: Blob
    signal?: AbortSignal
}

/**
 * Streams an individual file chunk to the API for the supplied upload session.
 *
 * @param params - Upload context including the `uploadId`, sequential `chunkNumber`, binary data, and optional abort signal.
 */
export async function uploadChunk({ uploadId, chunkNumber, chunk, signal }: UploadChunkParams) {
    await axios_instance.put(`upload/${uploadId}/chunk/${chunkNumber}`, chunk, {
        headers: {
            "Content-Type": "application/octet-stream",
        },
        signal,
    })
}

/**
 * Finalises the upload process once every chunk has been successfully persisted.
 *
 * @param uploadId - Unique identifier for the resumable upload session.
 * @param signal - Optional abort signal to cancel the completion request.
 * @returns Parsed payload containing the server-generated download URL.
 */
export async function completeUploadSession(uploadId: string, signal?: AbortSignal) {
    const response = await axios_instance.post(`upload/${uploadId}/complete`, undefined, { signal })
    return uploadCompleteResponseSchema.parse(response.data)
}


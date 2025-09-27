import { z } from "zod";

/**
 * Schema that models the request payload for `POST /v1/upload/initiate`.
 * Mirrors the OpenAPI specification so that the form values we collect
 * on the client stay compliant with the backend contract.
 */
export const uploadInitiateRequestSchema = z.object({
	file_name: z
		.string()
		.min(1, "File name is required")
		.max(255, "File name is too long"),
		total_size: z
			.number()
		.int("Total size must be an integer")
		.positive("Total size must be greater than zero"),
		total_chunks: z
			.number()
		.int("Total chunks must be an integer")
		.min(1, "Total chunks must be at least 1"),
});

export type UploadInitiateRequest = z.infer<typeof uploadInitiateRequestSchema>;

/**
 * Successful response body for `POST /v1/upload/initiate`.
 */
export const uploadInitiateResponseSchema = z.object({
	upload_id: z
		.string()
		.min(1, "Upload ID is required"),
});

export type UploadInitiateResponse = z.infer<typeof uploadInitiateResponseSchema>;

/**
 * Path parameters used when uploading a chunk via `PUT /v1/upload/{upload_id}/chunk/{chunk_number}`.
 */
export const uploadChunkParamsSchema = z.object({
	upload_id: z
		.string()
		.min(1, "Upload ID is required"),
		chunk_number: z
			.number()
		.int("Chunk number must be an integer")
		.min(1, "Chunk number starts at 1"),
});

export type UploadChunkParams = z.infer<typeof uploadChunkParamsSchema>;

/**
 * Successful response body for `POST /v1/upload/{upload_id}/complete`.
 */
export const uploadCompleteResponseSchema = z.object({
	download_url: z
		.string()
		.url("Download URL must be a valid URL"),
});

export type UploadCompleteResponse = z.infer<typeof uploadCompleteResponseSchema>;

/**
 * Error envelope shared by several endpoints in the upload API.
 */
export const uploadErrorResponseSchema = z.object({
	error: z.string().min(1, "Error message is required"),
});

export type UploadErrorResponse = z.infer<typeof uploadErrorResponseSchema>;

/**
 * Narrow schema used by the UI layer to validate the derived form values
 * before we translate them into the API shape (`file_name`, `total_size`, `total_chunks`).
 * This keeps the UI free to use camelCase while still mapping 1:1 to the API.
 */
export const uploadFormSchema = z.object({
	fileName: z
		.string()
		.min(1, "Please select a file"),
	totalSize: z
		.number()
		.int("Total size must be an integer")
		.positive("Total size must be greater than zero"),
	totalChunks: z
		.number()
		.int("Total chunks must be an integer")
		.min(1, "Total chunks must be at least 1"),
});

export type UploadFormValues = z.infer<typeof uploadFormSchema>;

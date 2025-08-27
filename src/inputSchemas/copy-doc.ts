import { z } from "zod";

/** Minimal writable subset of Google Drive v3 File for copy requestBody */
export const SchemaFile = z.object({
  name: z.string().min(1).optional().describe("New file name for the copy."),
  parents: z
    .array(z.string())
    .min(1)
    .optional()
    .describe("Destination folder IDs."),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  properties: z.record(z.string()).optional(),
  appProperties: z.record(z.string()).optional(),
  copyRequiresWriterPermission: z.boolean().optional(),
  viewersCanCopyContent: z.boolean().optional(),
  writersCanShare: z.boolean().optional(),
});

export const CopyFileInput = z
  .object({
    fileId: z.string().min(1).describe("The ID of the source file to copy."),
    ignoreDefaultVisibility: z
      .boolean()
      .optional()
      .describe(
        "Bypass domain default visibility for the created file (permissions still inherit from parents).",
      ),
    includeLabels: z
      .string()
      .optional()
      .describe("Comma-separated label IDs to include in labelInfo."),
    includePermissionsForView: z
      .enum(["published"])
      .optional()
      .describe("Additional view's permissions to include (only 'published')."),
    keepRevisionForever: z
      .boolean()
      .optional()
      .describe(
        "Pin the new head revision forever (binary files only; limit ~200 pinned revisions).",
      ),
    ocrLanguage: z
      .string()
      .regex(
        /^[A-Za-z]{2}(-[A-Za-z]+)?$/,
        "Use an ISO 639-1 code, e.g. 'en' or 'pt-BR'.",
      )
      .optional()
      .describe("Language hint for OCR during image import."),
    supportsAllDrives: z
      .boolean()
      .default(true)
      .optional()
      .describe("Set true if using My Drive and/or shared drives."),
    supportsTeamDrives: z
      .boolean()
      .optional()
      .describe("Deprecated; use supportsAllDrives instead."),
    requestBody: SchemaFile.optional().describe(
      "File metadata for the created copy.",
    ),
  })
  .strict();

// Example usage
/*
const args = CopyFileInput.parse({
  fileId: "SOURCE_FILE_ID",
  supportsAllDrives: true,
  requestBody: { name: "Copy of Doc", parents: ["DEST_FOLDER_ID"] },
});
const res = await drive.files.copy(args);
*/

/**
 * Safe, writable subset of Google Drive v3 File fields for files.copy requestBody.
 * (Most other Schema$File fields are read-only and should not be sent.)
 */
export const WritableDriveFile = z.object({
  name: z.string().min(1).optional(),
  // parents: z.array(z.string().min(1)).min(1).optional(),
  // mimeType: z.string().optional(),
  // description: z.string().optional(),
  // properties: z.record(z.string()).optional(),
  // appProperties: z.record(z.string()).optional(),
  // copyRequiresWriterPermission: z.coerce.boolean().optional(),
  // viewersCanCopyContent: z.coerce.boolean().optional(),
  // writersCanShare: z.coerce.boolean().optional(),
});

export const CopyFileArgsSchema = z
  .object({
    // Top-level params
    enforceSingleParent: z.coerce.boolean().optional(), // deprecated
    fileId: z.string().min(1).describe("ID of the source file to copy."),
    ignoreDefaultVisibility: z.coerce.boolean().optional(),
    includeLabels: z.string().optional(), // comma-separated label IDs
    includePermissionsForView: z.enum(["published"]).optional(),
    keepRevisionForever: z.coerce.boolean().optional(),
    ocrLanguage: z.string().optional(), // ISO 639-1 hint; leave unset unless you're importing images
    supportsAllDrives: z.coerce.boolean().default(true).optional(),
    supportsTeamDrives: z.coerce.boolean().optional(), // deprecated

    // Request body (new file metadata)
    requestBody: WritableDriveFile.optional(),
  })
  .strict();

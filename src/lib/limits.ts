/**
 * File size ceilings, in one place.
 *
 * These disagreed in three places before Drive existed: the uploads page
 * advertised 25 MB, /api/extract rejected above 15 MB, and nothing mentioned
 * Drive's export cap. A user could therefore be told 25 MB and get a 413.
 */

/** What /api/extract accepts, and what the uploads page should advertise. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * Google caps files.export output at 10 MB. This is Google's limit, not ours,
 * and it applies only to native Google formats (Docs, Slides) — a PDF stored
 * in Drive is downloaded, not exported, so MAX_UPLOAD_BYTES governs it.
 */
export const MAX_DRIVE_EXPORT_BYTES = 10 * 1024 * 1024;

export const formatBytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

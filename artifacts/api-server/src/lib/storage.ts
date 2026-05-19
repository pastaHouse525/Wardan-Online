import { randomUUID } from "crypto";
import { objectStorageClient } from "./objectStorage";

/**
 * Upload a file buffer to Replit Object Storage.
 * Files are stored in the private listing-images directory and served
 * via the scoped /api/storage/listing-images/* route.
 *
 * @returns The serving URL path (e.g. /api/storage/listing-images/<uuid>.<ext>)
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
  const privateDir = process.env["PRIVATE_OBJECT_DIR"];
  if (!bucketId || !privateDir) {
    throw new Error("Object storage not configured");
  }

  const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
  const objectId = randomUUID();

  // PRIVATE_OBJECT_DIR = /bucket-id/.private
  // We store at .private/listing-images/<uuid>.<ext> within the bucket
  const privateDirParts = privateDir.replace(/^\//, "").split("/");
  const objectDirInBucket = privateDirParts.slice(1).join("/"); // e.g. .private
  const objectName = `${objectDirInBucket}/listing-images/${objectId}.${ext}`;

  const file = objectStorageClient.bucket(bucketId).file(objectName);
  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  // Served via /api/storage/listing-images/<uuid>.<ext>
  return `/api/storage/listing-images/${objectId}.${ext}`;
}

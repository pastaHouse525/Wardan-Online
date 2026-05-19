import { Router, type IRouter, type Request, type Response } from "express";
import { objectStorageClient } from "../lib/objectStorage";

const router: IRouter = Router();

/**
 * GET /storage/listing-images/*
 *
 * Serve listing images uploaded via /api/upload.
 * Only serves files from the .private/listing-images/ prefix — no other
 * private objects are accessible. Path components like ".." are rejected.
 */
router.get("/storage/listing-images/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;

    // Reject any path traversal attempts
    if (wildcardPath.includes("..") || wildcardPath.includes("//")) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
    const privateDir = process.env["PRIVATE_OBJECT_DIR"];
    if (!bucketId || !privateDir) {
      res.status(500).json({ error: "Object storage not configured" });
      return;
    }

    // Build the full GCS object name within the scoped listing-images prefix
    const privateDirParts = privateDir.replace(/^\//, "").split("/");
    const objectDirInBucket = privateDirParts.slice(1).join("/"); // e.g. .private
    const objectName = `${objectDirInBucket}/listing-images/${wildcardPath}`;

    const file = objectStorageClient.bucket(bucketId).file(objectName);
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [metadata] = await file.getMetadata();
    const contentType = (metadata.contentType as string) || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (metadata.size) {
      res.setHeader("Content-Length", String(metadata.size));
    }

    const nodeStream = file.createReadStream();
    nodeStream.pipe(res);
  } catch (error) {
    req.log.error({ err: error }, "Error serving listing image");
    res.status(500).json({ error: "Failed to serve image" });
  }
});

export default router;

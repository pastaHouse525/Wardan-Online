import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../lib/storage";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
]);
const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
    res.status(400).json({ error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" });
    return;
  }

  try {
    const ext = SAFE_EXTENSIONS[req.file.mimetype] ?? "jpg";
    const url = await uploadFile(req.file.buffer, `upload.${ext}`, req.file.mimetype);
    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "Upload failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

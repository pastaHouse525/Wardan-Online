import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { getServerSupabase } from "../lib/supabase";

const router = Router();

router.post("/upload", requireAdmin, async (req, res) => {
  const { base64, filename, mimeType } = req.body;
  if (!base64 || !filename) {
    return res.status(400).json({ error: "base64 and filename are required" });
  }

  try {
    const supabase = getServerSupabase();
    const buffer = Buffer.from(base64, "base64");
    const ext = filename.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("listing-images")
      .upload(path, buffer, {
        contentType: mimeType ?? "image/jpeg",
        cacheControl: "3600",
      });

    if (error) {
      return res.status(500).json({ error: `Upload failed: ${error.message}` });
    }

    const { data: urlData } = supabase.storage
      .from("listing-images")
      .getPublicUrl(data.path);

    res.json({ url: urlData.publicUrl });
  } catch (err) {
    req.log.error({ err }, "Upload failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

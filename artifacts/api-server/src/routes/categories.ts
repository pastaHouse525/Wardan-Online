import { Router } from "express";
import { query } from "../lib/db";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, slug, name_ar, listing_count FROM categories ORDER BY id"
    );
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      nameAr: r.name_ar,
      listingCount: Number(r.listing_count ?? 0),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

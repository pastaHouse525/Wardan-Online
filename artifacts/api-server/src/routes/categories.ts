import { Router } from "express";
import { query } from "../lib/db";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const { section } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (section === "marketplace" || section === "services") {
      params.push(section);
      conditions.push(`section = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(
      `SELECT id, slug, name_ar, name_en, icon, listing_count, section FROM categories ${where} ORDER BY id`
    );
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      nameAr: r.name_ar,
      nameEn: r.name_en ?? "",
      icon: r.icon ?? "tag",
      listingCount: Number(r.listing_count ?? 0),
      section: (r.section as string) ?? "marketplace",
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

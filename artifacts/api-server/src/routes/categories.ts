import { Router } from "express";
import { query, queryOne } from "../lib/db";
import { requireAdmin } from "../middleware/requireAdmin";

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

// ── Admin: create category ────────────────────────────────────────────────────
router.post("/admin/categories", requireAdmin, async (req, res) => {
  const { nameAr, nameEn, slug, icon, section } = req.body as {
    nameAr?: string; nameEn?: string; slug?: string; icon?: string; section?: string;
  };

  if (!nameAr || !slug || !section) {
    res.status(400).json({ error: "nameAr و slug و section مطلوبة" }); return;
  }
  if (!["marketplace", "services"].includes(section)) {
    res.status(400).json({ error: "section يجب أن يكون marketplace أو services" }); return;
  }

  const cleanSlug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!cleanSlug) { res.status(400).json({ error: "slug غير صالح" }); return; }

  try {
    const existing = await queryOne("SELECT id FROM categories WHERE slug = $1", [cleanSlug]);
    if (existing) { res.status(409).json({ error: "يوجد تصنيف بهذا المعرّف مسبقاً" }); return; }

    const row = await queryOne(
      `INSERT INTO categories (slug, name_ar, name_en, icon, section, listing_count)
       VALUES ($1, $2, $3, $4, $5, 0) RETURNING id, slug, name_ar, name_en, icon, section, listing_count`,
      [cleanSlug, nameAr, nameEn ?? "", icon ?? "tag", section]
    );
    if (!row) { res.status(500).json({ error: "فشل إنشاء التصنيف" }); return; }
    res.status(201).json({
      id: row.id, slug: row.slug, nameAr: row.name_ar, nameEn: row.name_en ?? "",
      icon: row.icon ?? "tag", listingCount: 0, section: row.section,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create category");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: delete category ────────────────────────────────────────────────────
router.delete("/admin/categories/:slug", requireAdmin, async (req, res) => {
  const slug = String(req.params["slug"]);
  try {
    const hasListings = await queryOne(
      "SELECT id FROM listings WHERE category_slug = $1 LIMIT 1", [slug]
    );
    if (hasListings) {
      res.status(409).json({ error: "لا يمكن حذف تصنيف يحتوي على إعلانات" }); return;
    }
    await query("DELETE FROM categories WHERE slug = $1", [slug]);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

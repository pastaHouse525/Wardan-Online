import { Router } from "express";
import { query } from "../lib/db";

const router = Router();

function parseImageUrls(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return [raw]; }
  }
  return [];
}

function mapListing(r: Record<string, unknown>) {
  const urls = parseImageUrls(r.image_urls);
  return {
    id: r.id,
    titleAr: r.title_ar,
    descriptionAr: r.description_ar ?? null,
    categorySlug: r.category_slug,
    categoryNameAr: r.category_name_ar ?? null,
    price: r.price ? Number(r.price) : null,
    priceUnit: r.price_unit ?? null,
    city: r.city ?? null,
    location: r.location ?? null,
    phoneNumber: r.phone_number ?? null,
    whatsappNumber: r.whatsapp_number,
    sellerName: r.seller_name ?? null,
    imageUrl: urls[0] ?? (r.image_url as string | null) ?? null,
    imageUrls: urls.length ? urls : (r.image_url ? [r.image_url as string] : []),
    status: r.status,
    featured: r.featured ?? false,
    createdAt: r.created_at,
  };
}

router.get("/search", async (req, res) => {
  try {
    const { q = "", category, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    if (!q.trim()) {
      return res.json({ listings: [], total: 0, page: pageNum, limit: limitNum });
    }

    const conditions = ["status = 'approved'", "(title_ar ILIKE $1 OR description_ar ILIKE $1 OR category_name_ar ILIKE $1)"];
    const params: unknown[] = [`%${q}%`];

    if (category) {
      params.push(category);
      conditions.push(`category_slug = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    params.push(limitNum, offset);

    const rows = await query(
      `SELECT * FROM listings ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      listings: rows.map(mapListing),
      total: rows.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to search listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

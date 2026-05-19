import { Router } from "express";
import { query, queryOne, queryCount } from "../lib/db";

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

// GET /listings — list approved listings with optional filters
router.get("/listings", async (req, res) => {
  try {
    const { category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = ["status = 'approved'"];
    const params: unknown[] = [];

    if (category) {
      params.push(category);
      conditions.push(`category_slug = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title_ar ILIKE $${params.length} OR description_ar ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const total = await queryCount(`SELECT COUNT(*) FROM listings ${where}`, params);

    params.push(limitNum, offset);
    const rows = await query(
      `SELECT * FROM listings ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      listings: rows.map(mapListing),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /listings/featured — latest 8 approved listings
router.get("/listings/featured", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM listings WHERE status = 'approved' ORDER BY created_at DESC LIMIT 8"
    );
    res.json(rows.map(mapListing));
  } catch (err) {
    req.log.error({ err }, "Failed to get featured listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /listings/:id — single listing (any status for admin; approved for public)
router.get("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const row = await queryOne("SELECT * FROM listings WHERE id = $1", [id]);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(row));
  } catch (err) {
    req.log.error({ err }, "Failed to get listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /listings — create new listing (pending)
router.post("/listings", async (req, res) => {
  try {
    const {
      titleAr, categorySlug, whatsappNumber, phoneNumber,
      descriptionAr, price, priceUnit, location, city,
      sellerName, imageUrl, imageUrls,
    } = req.body;

    if (!titleAr || !categorySlug || !whatsappNumber) {
      return res.status(400).json({ error: "titleAr, categorySlug, and whatsappNumber are required" });
    }

    const cat = await queryOne<{ name_ar: string }>(
      "SELECT name_ar FROM categories WHERE slug = $1", [categorySlug]
    );

    const urlsArray: string[] = Array.isArray(imageUrls) ? imageUrls : imageUrl ? [imageUrl] : [];
    const firstImage = urlsArray[0] ?? null;

    const row = await queryOne(
      `INSERT INTO listings
        (title_ar, category_slug, category_name_ar, whatsapp_number, phone_number,
         description_ar, price, price_unit, city, location, seller_name,
         image_url, image_urls, status, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending',false)
       RETURNING *`,
      [
        titleAr, categorySlug, cat?.name_ar ?? null,
        whatsappNumber, phoneNumber ?? null,
        descriptionAr ?? null,
        price ? Number(price) : null,
        priceUnit ?? null,
        city ?? null,
        location ?? null,
        sellerName ?? null,
        firstImage,
        urlsArray.length ? JSON.stringify(urlsArray) : null,
      ]
    );
    if (!row) throw new Error("Insert returned no row");

    // Increment listing count (best-effort)
    await query(
      "UPDATE categories SET listing_count = listing_count + 1 WHERE slug = $1",
      [categorySlug]
    ).catch(() => {});

    res.status(201).json(mapListing(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /listings/:id
router.patch("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const {
      titleAr, descriptionAr, price, priceUnit, location, city,
      whatsappNumber, sellerName, imageUrl, imageUrls, status, featured,
    } = req.body;

    const sets: string[] = [];
    const params: unknown[] = [];

    const set = (col: string, val: unknown) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    if (titleAr !== undefined) set("title_ar", titleAr);
    if (descriptionAr !== undefined) set("description_ar", descriptionAr);
    if (price !== undefined) set("price", price ? Number(price) : null);
    if (priceUnit !== undefined) set("price_unit", priceUnit);
    if (location !== undefined) set("location", location);
    if (city !== undefined) set("city", city);
    if (whatsappNumber !== undefined) set("whatsapp_number", whatsappNumber);
    if (sellerName !== undefined) set("seller_name", sellerName);
    if (imageUrl !== undefined) set("image_url", imageUrl);
    if (imageUrls !== undefined) set("image_urls", Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : imageUrls);
    if (status !== undefined) set("status", status);
    if (featured !== undefined) set("featured", !!featured);

    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });

    params.push(id);
    const row = await queryOne(
      `UPDATE listings SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(row));
  } catch (err) {
    req.log.error({ err }, "Failed to update listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /listings/:id
router.delete("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await query("DELETE FROM listings WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { listingsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, or, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/listings", async (req, res) => {
  try {
    const { category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .select()
      .from(listingsTable)
      .where(
        eq(listingsTable.status, "approved")
      )
      .orderBy(desc(listingsTable.createdAt))
      .$dynamic();

    const conditions = [eq(listingsTable.status, "approved")];
    if (category) {
      conditions.push(eq(listingsTable.categorySlug, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(listingsTable.titleAr, `%${search}%`),
          ilike(listingsTable.descriptionAr, `%${search}%`)
        )!
      );
    }

    const allListings = await db
      .select()
      .from(listingsTable)
      .where(sql`${listingsTable.status} = 'approved' ${category ? sql`AND ${listingsTable.categorySlug} = ${category}` : sql``} ${search ? sql`AND (${listingsTable.titleAr} ILIKE ${"%" + search + "%"} OR ${listingsTable.descriptionAr} ILIKE ${"%" + search + "%"})` : sql``}`)
      .orderBy(desc(listingsTable.createdAt));

    const total = allListings.length;
    const listings = allListings.slice(offset, offset + limitNum);

    res.json({ listings, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Failed to list listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/listings", async (req, res) => {
  try {
    const { titleAr, categorySlug, whatsappNumber, descriptionAr, price, priceUnit, location, sellerName, imageUrl } = req.body;
    if (!titleAr || !categorySlug || !whatsappNumber) {
      return res.status(400).json({ error: "titleAr, categorySlug, and whatsappNumber are required" });
    }

    const categoryRecord = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, categorySlug)).limit(1);
    const categoryNameAr = categoryRecord[0]?.nameAr ?? null;

    const [listing] = await db.insert(listingsTable).values({
      titleAr,
      categorySlug,
      whatsappNumber,
      descriptionAr: descriptionAr ?? null,
      price: price ? String(price) : null,
      priceUnit: priceUnit ?? null,
      location: location ?? null,
      sellerName: sellerName ?? null,
      imageUrl: imageUrl ?? null,
      categoryNameAr,
      status: "pending",
      featured: false,
    }).returning();

    // Update listing count
    await db.execute(sql`UPDATE categories SET listing_count = listing_count + 1 WHERE slug = ${categorySlug}`);

    res.status(201).json({ ...listing, price: listing.price ? Number(listing.price) : null, createdAt: listing.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/listings/featured", async (req, res) => {
  try {
    const featured = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.status, "approved"))
      .orderBy(desc(listingsTable.createdAt))
      .limit(8);
    res.json(featured.map(l => ({ ...l, price: l.price ? Number(l.price) : null, createdAt: l.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get featured listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
    if (!listing) return res.status(404).json({ error: "Not found" });

    res.json({ ...listing, price: listing.price ? Number(listing.price) : null, createdAt: listing.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { titleAr, descriptionAr, price, priceUnit, location, whatsappNumber, sellerName, imageUrl, status, featured } = req.body;
    const updateData: Record<string, unknown> = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (price !== undefined) updateData.price = price ? String(price) : null;
    if (priceUnit !== undefined) updateData.priceUnit = priceUnit;
    if (location !== undefined) updateData.location = location;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (sellerName !== undefined) updateData.sellerName = sellerName;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

    const [updated] = await db.update(listingsTable).set(updateData).where(eq(listingsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    res.json({ ...updated, price: updated.price ? Number(updated.price) : null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    await db.delete(listingsTable).where(eq(listingsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

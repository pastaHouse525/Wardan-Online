import { Router } from "express";
import { db } from "@workspace/db";
import { listingsTable } from "@workspace/db";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    const { q, category } = req.query as Record<string, string>;
    if (!q) return res.status(400).json({ error: "q parameter is required" });

    const results = await db
      .select()
      .from(listingsTable)
      .where(
        sql`${listingsTable.status} = 'approved' 
          AND (${listingsTable.titleAr} ILIKE ${"%" + q + "%"} 
            OR ${listingsTable.descriptionAr} ILIKE ${"%" + q + "%"})
          ${category ? sql`AND ${listingsTable.categorySlug} = ${category}` : sql``}`
      )
      .orderBy(desc(listingsTable.createdAt))
      .limit(50);

    res.json(results.map(l => ({ ...l, price: l.price ? Number(l.price) : null, createdAt: l.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to search listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

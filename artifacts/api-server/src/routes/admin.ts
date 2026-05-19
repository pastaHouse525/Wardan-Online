import { Router } from "express";
import { db } from "@workspace/db";
import { listingsTable, categoriesTable, appointmentsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/admin/stats", async (req, res) => {
  try {
    const [totalListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable);
    const [pendingListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "pending"));
    const [approvedListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "approved"));
    const [rejectedListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "rejected"));
    const [totalCategories] = await db.select({ count: sql<number>`count(*)::int` }).from(categoriesTable);
    const [totalAppointments] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable);

    const listingsByCategory = await db
      .select({
        categorySlug: listingsTable.categorySlug,
        categoryNameAr: listingsTable.categoryNameAr,
        count: sql<number>`count(*)::int`,
      })
      .from(listingsTable)
      .groupBy(listingsTable.categorySlug, listingsTable.categoryNameAr);

    res.json({
      totalListings: totalListings.count,
      pendingListings: pendingListings.count,
      approvedListings: approvedListings.count,
      rejectedListings: rejectedListings.count,
      totalCategories: totalCategories.count,
      totalAppointments: totalAppointments.count,
      listingsByCategory: listingsByCategory.map(r => ({
        categorySlug: r.categorySlug,
        categoryNameAr: r.categoryNameAr ?? r.categorySlug,
        count: r.count,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/listings", async (req, res) => {
  try {
    const { status, category } = req.query as Record<string, string>;
    const listings = await db
      .select()
      .from(listingsTable)
      .where(
        sql`1=1 ${status ? sql`AND ${listingsTable.status} = ${status}` : sql``} ${category ? sql`AND ${listingsTable.categorySlug} = ${category}` : sql``}`
      )
      .orderBy(desc(listingsTable.createdAt));

    res.json(listings.map(l => ({ ...l, price: l.price ? Number(l.price) : null, createdAt: l.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to admin list listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/listings/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [updated] = await db.update(listingsTable).set({ status: "approved" }).where(eq(listingsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    res.json({ ...updated, price: updated.price ? Number(updated.price) : null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to approve listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/listings/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [updated] = await db.update(listingsTable).set({ status: "rejected" }).where(eq(listingsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    res.json({ ...updated, price: updated.price ? Number(updated.price) : null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to reject listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

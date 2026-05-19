import { Router } from "express";
import { getServerSupabase, mapListing, type SupabaseListing } from "../lib/supabase";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const supabase = getServerSupabase();

    const [
      { count: totalListings },
      { count: pendingListings },
      { count: approvedListings },
      { count: rejectedListings },
      { count: totalCategories },
      { count: totalAppointments },
    ] = await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
    ]);

    const { data: byCategory } = await supabase
      .from("listings")
      .select("category_slug, category_name_ar");

    const categoryMap = new Map<string, { nameAr: string; count: number }>();
    for (const row of byCategory ?? []) {
      const slug = row.category_slug as string;
      const entry = categoryMap.get(slug);
      if (entry) {
        entry.count += 1;
      } else {
        categoryMap.set(slug, { nameAr: row.category_name_ar ?? slug, count: 1 });
      }
    }

    res.json({
      totalListings: totalListings ?? 0,
      pendingListings: pendingListings ?? 0,
      approvedListings: approvedListings ?? 0,
      rejectedListings: rejectedListings ?? 0,
      totalCategories: totalCategories ?? 0,
      totalAppointments: totalAppointments ?? 0,
      listingsByCategory: Array.from(categoryMap.entries()).map(([slug, v]) => ({
        categorySlug: slug,
        categoryNameAr: v.nameAr,
        count: v.count,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/listings", requireAdmin, async (req, res) => {
  try {
    const { status, category } = req.query as Record<string, string>;

    const supabase = getServerSupabase();
    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category_slug", category);

    const { data, error } = await query;
    if (error) throw error;
    res.json((data as SupabaseListing[]).map(mapListing));
  } catch (err) {
    req.log.error({ err }, "Failed to list admin listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/listings/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("listings")
      .update({ status: "approved" })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(data as SupabaseListing));
  } catch (err) {
    req.log.error({ err }, "Failed to approve listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/listings/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("listings")
      .update({ status: "rejected" })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(data as SupabaseListing));
  } catch (err) {
    req.log.error({ err }, "Failed to reject listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

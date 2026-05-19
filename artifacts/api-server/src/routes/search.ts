import { Router } from "express";
import { getServerSupabase, mapListing, type SupabaseListing } from "../lib/supabase";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    const { q, category } = req.query as Record<string, string>;
    if (!q) return res.status(400).json({ error: "q parameter is required" });

    const supabase = getServerSupabase();
    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .or(`title_ar.ilike.%${q}%,description_ar.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (category) query = query.eq("category_slug", category);

    const { data, error } = await query;
    if (error) throw error;
    res.json((data as SupabaseListing[]).map(mapListing));
  } catch (err) {
    req.log.error({ err }, "Failed to search listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

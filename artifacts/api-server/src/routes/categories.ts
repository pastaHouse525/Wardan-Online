import { Router } from "express";
import { getServerSupabase, mapCategory, type SupabaseCategory } from "../lib/supabase";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id");

    if (error) throw error;
    res.json((data as SupabaseCategory[]).map(mapCategory));
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

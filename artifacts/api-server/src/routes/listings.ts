import { Router } from "express";
import { getServerSupabase, mapListing, type SupabaseListing } from "../lib/supabase";

const router = Router();

router.get("/listings", async (req, res) => {
  try {
    const { category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const supabase = getServerSupabase();
    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category_slug", category);
    if (search) {
      query = query.or(`title_ar.ilike.%${search}%,description_ar.ilike.%${search}%`);
    }
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      listings: (data as SupabaseListing[]).map(mapListing),
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/listings/featured", async (req, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;
    res.json((data as SupabaseListing[]).map(mapListing));
  } catch (err) {
    req.log.error({ err }, "Failed to get featured listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(data as SupabaseListing));
  } catch (err) {
    req.log.error({ err }, "Failed to get listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/listings", async (req, res) => {
  try {
    const { titleAr, categorySlug, whatsappNumber, descriptionAr, price, priceUnit, location, sellerName, imageUrl } = req.body;
    if (!titleAr || !categorySlug || !whatsappNumber) {
      return res.status(400).json({ error: "titleAr, categorySlug, and whatsappNumber are required" });
    }

    const supabase = getServerSupabase();
    const { data: cat } = await supabase.from("categories").select("name_ar").eq("slug", categorySlug).single();

    const { data, error } = await supabase
      .from("listings")
      .insert({
        title_ar: titleAr,
        category_slug: categorySlug,
        category_name_ar: cat?.name_ar ?? null,
        whatsapp_number: whatsappNumber,
        description_ar: descriptionAr ?? null,
        price: price ? Number(price) : null,
        price_unit: priceUnit ?? null,
        location: location ?? null,
        seller_name: sellerName ?? null,
        image_url: imageUrl ?? null,
        status: "pending",
        featured: false,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.rpc("increment_listing_count", { category_slug_param: categorySlug }).catch(() => {});

    res.status(201).json(mapListing(data as SupabaseListing));
  } catch (err) {
    req.log.error({ err }, "Failed to create listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { titleAr, descriptionAr, price, priceUnit, location, whatsappNumber, sellerName, imageUrl, status, featured } = req.body;
    const update: Record<string, unknown> = {};
    if (titleAr !== undefined) update.title_ar = titleAr;
    if (descriptionAr !== undefined) update.description_ar = descriptionAr;
    if (price !== undefined) update.price = price ? Number(price) : null;
    if (priceUnit !== undefined) update.price_unit = priceUnit;
    if (location !== undefined) update.location = location;
    if (whatsappNumber !== undefined) update.whatsapp_number = whatsappNumber;
    if (sellerName !== undefined) update.seller_name = sellerName;
    if (imageUrl !== undefined) update.image_url = imageUrl;
    if (status !== undefined) update.status = status;
    if (featured !== undefined) update.featured = featured;

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("listings")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(data as SupabaseListing));
  } catch (err) {
    req.log.error({ err }, "Failed to update listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/listings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const supabase = getServerSupabase();
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

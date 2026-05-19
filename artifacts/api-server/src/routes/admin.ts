import { Router } from "express";
import { query, queryOne } from "../lib/db";
import { requireAdmin } from "../middleware/requireAdmin";

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

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [total, pending, approved, rejected, categories, appointments] = await Promise.all([
      queryOne<{ count: string }>("SELECT COUNT(*) FROM listings"),
      queryOne<{ count: string }>("SELECT COUNT(*) FROM listings WHERE status = 'pending'"),
      queryOne<{ count: string }>("SELECT COUNT(*) FROM listings WHERE status = 'approved'"),
      queryOne<{ count: string }>("SELECT COUNT(*) FROM listings WHERE status = 'rejected'"),
      queryOne<{ count: string }>("SELECT COUNT(*) FROM categories"),
      queryOne<{ count: string }>("SELECT COUNT(*) FROM appointments"),
    ]);

    const byCategory = await query<{ category_slug: string; category_name_ar: string }>(
      "SELECT category_slug, category_name_ar FROM listings"
    );

    const categoryMap = new Map<string, { nameAr: string; count: number }>();
    for (const row of byCategory) {
      const slug = row.category_slug;
      const entry = categoryMap.get(slug);
      if (entry) {
        entry.count += 1;
      } else {
        categoryMap.set(slug, { nameAr: row.category_name_ar ?? slug, count: 1 });
      }
    }

    res.json({
      totalListings: parseInt(total?.count ?? "0", 10),
      pendingListings: parseInt(pending?.count ?? "0", 10),
      approvedListings: parseInt(approved?.count ?? "0", 10),
      rejectedListings: parseInt(rejected?.count ?? "0", 10),
      totalCategories: parseInt(categories?.count ?? "0", 10),
      totalAppointments: parseInt(appointments?.count ?? "0", 10),
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

// GET /admin/listings
router.get("/admin/listings", requireAdmin, async (req, res) => {
  try {
    const { status, category } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category_slug = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await query(`SELECT * FROM listings ${where} ORDER BY created_at DESC`, params);
    res.json(rows.map(mapListing));
  } catch (err) {
    req.log.error({ err }, "Failed to list admin listings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/listings/:id/approve
router.patch("/admin/listings/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await queryOne(
      "UPDATE listings SET status = 'approved' WHERE id = $1 RETURNING *", [id]
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(row));
  } catch (err) {
    req.log.error({ err }, "Failed to approve listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/listings/:id/reject
router.patch("/admin/listings/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await queryOne(
      "UPDATE listings SET status = 'rejected' WHERE id = $1 RETURNING *", [id]
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(row));
  } catch (err) {
    req.log.error({ err }, "Failed to reject listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/listings/:id/feature
router.patch("/admin/listings/:id/feature", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const { featured } = req.body as { featured: boolean };
    const row = await queryOne(
      "UPDATE listings SET featured = $1 WHERE id = $2 RETURNING *", [!!featured, id]
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(mapListing(row));
  } catch (err) {
    req.log.error({ err }, "Failed to feature listing");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/listings/:id
router.delete("/admin/listings/:id", requireAdmin, async (req, res) => {
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

// DELETE /admin/appointments/:id
router.delete("/admin/appointments/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await query("DELETE FROM appointments WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete appointment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin Users management ────────────────────────────────────────────────────

router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, email, role, created_at FROM admin_users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list admin users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/users", requireAdmin, async (req, res) => {
  try {
    const { email, role = "admin" } = req.body as { email: string; role?: string };
    if (!email) return res.status(400).json({ error: "email is required" });
    const row = await queryOne(
      "INSERT INTO admin_users (email, role) VALUES ($1, $2) RETURNING *",
      [email.toLowerCase().trim(), role]
    );
    if (!row) throw new Error("Insert returned no row");
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to add admin user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    // Prevent deleting the last admin
    const countRow = await queryOne<{ count: string }>("SELECT COUNT(*) FROM admin_users");
    if (parseInt(countRow?.count ?? "0", 10) <= 1) {
      return res.status(400).json({ error: "لا يمكن حذف المسؤول الأخير" });
    }

    await query("DELETE FROM admin_users WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete admin user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/users/invite — create a new admin (Supabase Auth + local table)
router.post("/admin/users/invite", requireAdmin, async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    }

    const { getServerSupabase } = await import("../lib/supabase");
    const supabase = getServerSupabase();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    });

    if (authError && !authError.message.toLowerCase().includes("already registered")) {
      return res.status(400).json({ error: authError.message });
    }

    const row = await queryOne(
      "INSERT INTO admin_users (email, role) VALUES ($1, 'admin') ON CONFLICT (email) DO NOTHING RETURNING *",
      [email.toLowerCase().trim()]
    );

    if (!row) {
      return res.status(409).json({ error: "هذا البريد الإلكتروني مسؤول بالفعل" });
    }

    res.status(201).json({ success: true, user: row, supabaseId: authData?.user?.id ?? null });
  } catch (err) {
    req.log.error({ err }, "Invite admin failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/users/change-password — change logged-in admin's own password
router.patch("/admin/users/change-password", requireAdmin, async (req, res) => {
  try {
    const token = req.headers["authorization"]?.slice(7) ?? "";
    const { newPassword } = req.body as { newPassword?: string };
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    }

    const { getServerSupabase } = await import("../lib/supabase");
    const supabase = getServerSupabase();

    // Identify the caller
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Change password failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

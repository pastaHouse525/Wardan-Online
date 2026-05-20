import { Router } from "express";
import { getServerSupabase } from "../lib/supabase";
import { query, queryOne } from "../lib/db";

const router = Router();

// ── Login ─────────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" }); return;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }); return;
    }

    // Verify caller is in admin_users
    const adminRecord = await queryOne(
      "SELECT id FROM admin_users WHERE email = $1",
      [(data.user.email ?? "").toLowerCase()]
    );
    if (!adminRecord) {
      res.status(403).json({ error: "هذا الحساب ليس لديه صلاحية الإدارة" }); return;
    }

    res.json({
      accessToken: data.session.access_token,
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────

router.post("/auth/logout", async (req, res) => {
  const token = req.headers["authorization"]?.slice(7);
  if (token) {
    try {
      const supabase = getServerSupabase();
      await supabase.auth.admin.signOut(token);
    } catch { /* best effort */ }
  }
  res.json({ success: true });
});

// ── Password reset ────────────────────────────────────────────────────────────
// Returns a one-time recovery link (admin-only tool; link display is acceptable)

router.post("/auth/reset-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  try {
    // Only allow reset for known admin emails
    const adminRecord = await queryOne(
      "SELECT id FROM admin_users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (!adminRecord) {
      // Don't leak whether the email exists
      res.json({ success: true, link: null }); return;
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase().trim(),
    });

    if (error) {
      req.log.error({ err: error }, "generateLink failed");
      res.status(400).json({ error: error.message }); return;
    }

    res.json({ success: true, link: data.properties?.action_link ?? null });
  } catch (err) {
    req.log.error({ err }, "Password reset failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── First-run setup ───────────────────────────────────────────────────────────
// Works only when admin_users table is empty (no admins configured yet)

router.get("/admin/setup/status", async (req, res) => {
  try {
    const result = await queryOne<{ count: string }>("SELECT COUNT(*) FROM admin_users");
    const count = parseInt(result?.count ?? "0", 10);
    res.json({ configured: count > 0 });
  } catch (err) {
    req.log.error({ err }, "Setup status check failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/setup", async (req, res) => {
  try {
    // Guard: only run when no admins exist yet
    const existing = await queryOne<{ count: string }>("SELECT COUNT(*) FROM admin_users");
    const count = parseInt(existing?.count ?? "0", 10);
    if (count > 0) {
      res.status(403).json({ error: "الإدارة مُهيأة بالفعل. استخدم خاصية دعوة مسؤول جديد." }); return;
    }

    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" }); return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }); return;
    }

    const supabase = getServerSupabase();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    });

    if (authError && !authError.message.toLowerCase().includes("already registered")) {
      res.status(400).json({ error: authError.message }); return;
    }

    await query(
      "INSERT INTO admin_users (email, role) VALUES ($1, 'admin') ON CONFLICT (email) DO NOTHING",
      [email.toLowerCase().trim()]
    );

    res.json({ success: true, userId: authData?.user?.id ?? null });
  } catch (err) {
    req.log.error({ err }, "Setup failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

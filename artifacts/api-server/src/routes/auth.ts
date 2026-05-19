import { Router } from "express";
import { getServerSupabase } from "../lib/supabase";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return res.status(401).json({ error: error?.message ?? "Invalid credentials" });
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

export default router;

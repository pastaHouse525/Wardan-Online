import type { Request, Response, NextFunction } from "express";
import { getServerSupabase } from "../lib/supabase";
import { queryOne } from "../lib/db";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized: missing token" }); return;
  }

  try {
    const supabase = getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "Unauthorized: invalid token" }); return;
    }

    // Check that this user's email is in the admin_users table (local DB)
    const adminRecord = await queryOne(
      "SELECT id FROM admin_users WHERE email = $1",
      [user.email ?? ""]
    );

    if (!adminRecord) {
      res.status(403).json({ error: "Forbidden: not an admin user" }); return;
    }

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

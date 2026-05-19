import type { Request, Response, NextFunction } from "express";
import { getServerSupabase } from "../lib/supabase";
import { queryOne } from "../lib/db";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  try {
    const supabase = getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: invalid token" });
    }

    // Check that this user's email is in the admin_users table (local DB)
    const adminRecord = await queryOne(
      "SELECT id FROM admin_users WHERE email = $1",
      [user.email ?? ""]
    );

    if (!adminRecord) {
      return res.status(403).json({ error: "Forbidden: not an admin user" });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

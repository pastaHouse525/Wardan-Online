import type { Request, Response, NextFunction } from "express";
import { getServerSupabase } from "../lib/supabase";

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
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

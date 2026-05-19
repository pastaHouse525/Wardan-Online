import { pool } from "@workspace/db";

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query(sql, params);
  return (result.rows[0] as T) ?? null;
}

export async function queryCount(sql: string, params?: unknown[]): Promise<number> {
  const result = await pool.query(sql, params);
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

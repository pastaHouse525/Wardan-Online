import { Router } from "express";
import { query } from "../lib/db";

const router = Router();

const BASE_URL = "https://wardanonline.com";

const STATIC_PAGES = [
  { url: "/",              changefreq: "daily",   priority: "1.0" },
  { url: "/add-listing",   changefreq: "monthly", priority: "0.5" },
  { url: "/search",        changefreq: "weekly",  priority: "0.6" },
  { url: "/doctors",       changefreq: "weekly",  priority: "0.7" },
];

const CATEGORY_SLUGS = [
  "real-estate", "livestock", "birds", "vegetables", "clothes", "home-appliances",
  "technicians", "restaurants", "quran-teachers", "local-shops",
  "job-vacancies", "transportation", "education", "doctors",
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const listings = await query(
      `SELECT id, created_at FROM listings WHERE status = 'approved' ORDER BY created_at DESC`
    );

    const now = new Date().toISOString().split("T")[0];

    const urls: string[] = [];

    for (const page of STATIC_PAGES) {
      urls.push(`  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }

    for (const slug of CATEGORY_SLUGS) {
      urls.push(`  <url>
    <loc>${BASE_URL}/category/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    for (const listing of listings) {
      const lastmod = listing.created_at
        ? new Date(listing.created_at as string).toISOString().split("T")[0]
        : now;
      urls.push(`  <url>
    <loc>${BASE_URL}/listing/${xmlEscape(String(listing.id))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Failed to generate sitemap");
    res.status(500).send("Internal server error");
  }
});

export default router;

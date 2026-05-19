import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  descriptionAr: text("description_ar"),
  categorySlug: text("category_slug").notNull(),
  categoryNameAr: text("category_name_ar"),
  price: numeric("price"),
  priceUnit: text("price_unit"),
  location: text("location"),
  whatsappNumber: text("whatsapp_number").notNull(),
  sellerName: text("seller_name"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("approved"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;

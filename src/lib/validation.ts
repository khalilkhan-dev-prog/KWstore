import { z } from "zod";

export function sanitizeText(input: string): string {
  return input.replace(/[<>]/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function slugify(name: string): string {
  return (
    name.toLowerCase().normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "product"
  );
}

const phone = z.string().trim().min(7).max(20).regex(/^[0-9+\-\s()]+$/, "Invalid phone");

export const orderSchema = z.object({
  product_id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2, "Please enter your full name").max(120).transform(sanitizeText),
  phone,
  address: z.string().trim().min(5, "Please enter your complete address").max(400).transform(sanitizeText),
  city: z.string().trim().min(2, "City is required").max(80).transform(sanitizeText),
  quantity: z.coerce.number().int().min(1).max(100),
  notes: z.string().trim().max(500).transform(sanitizeText).optional().or(z.literal("")),
  payment_method: z.enum(["cod", "jazzcash", "easypaisa", "bank"]).default("cod"),
  payment_reference: z.string().trim().max(120).transform(sanitizeText).optional().or(z.literal("")),
  website: z.string().max(0).optional(), // honeypot
});
export type OrderInput = z.infer<typeof orderSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(120).transform(sanitizeText),
  description: z.string().trim().max(1000).transform(sanitizeText).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(100_000_000),
  compare_at: z.coerce.number().min(0).max(100_000_000).optional(),
  image_url: z.string().max(8_000_000).optional().or(z.literal("")),
  gallery: z.array(z.string().max(8_000_000)).max(15).optional(),
  video_url: z.string().max(400).optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  is_active: z.boolean().default(true),
  category: z.string().trim().max(40).transform(sanitizeText).optional().or(z.literal("")),
  rating: z.coerce.number().min(0).max(5).optional(),
  sold_count: z.coerce.number().int().min(0).max(10_000_000).optional(),
  sale_ends: z.string().max(40).optional().or(z.literal("")),
  // Badges — all manual (admin turns them on/off)
  badge_free_delivery: z.boolean().default(false),
  badge_best_seller: z.boolean().default(false),
  badge_trending: z.boolean().default(false),
  badge_low_stock: z.boolean().default(false),
});
export const productUpdateSchema = productSchema.partial();

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(1, "Password is required").max(200),
});

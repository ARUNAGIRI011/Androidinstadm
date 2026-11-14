import { z } from "zod";
const productSchema = z.object({
  keywords: z.array(z.string().trim().min(1)).min(1),
  url: z.string().url().refine((v) => { try { return new URL(v).protocol === "https:"; } catch { return false; } }, "Product URL must use HTTPS"),
  title: z.string().trim().min(1).max(100)
});
export type ProductLink = z.infer<typeof productSchema>;
export function parseProductCatalog(raw: string | undefined): ProductLink[] {
  if (!raw) return [];
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("PRODUCT_LINKS_JSON must contain valid JSON"); }
  return z.array(productSchema).parse(value);
}
export function findProductForMessage(text: string, catalog: ProductLink[]): ProductLink | undefined {
  const normalized = text.normalize("NFKC").toLocaleLowerCase().trim();
  if (!normalized) return undefined;
  return catalog.find((product) => product.keywords.some((keyword) => {
    const needle = keyword.normalize("NFKC").toLocaleLowerCase().trim();
    return needle.length > 0 && normalized.includes(needle);
  }));
}

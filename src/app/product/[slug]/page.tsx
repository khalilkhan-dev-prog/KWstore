import { notFound } from "next/navigation";
import Link from "next/link";
import OrderForm from "@/components/OrderForm";
import ProductGallery from "@/components/ProductGallery";
import { OverlayBadges, InfoBadges } from "@/components/Badges";
import TrackView from "@/components/TrackView";
import AddToCart from "@/components/AddToCart";
import { getProductBySlug, getRelatedProducts, getSettings, imgUrl } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, others, settings] = await Promise.all([
    getProductBySlug(params.slug), getRelatedProducts(params.slug), getSettings(),
  ]);
  if (!product) notFound();

  const currency = settings.currency || "PKR";
  const storeName = settings.store_name || "kk new fashion";
  const shippingFee = Number(settings.shipping_fee || "200");
  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-PK")}`;
  const discount = product.compare_at && product.compare_at > product.price
    ? Math.round(((product.compare_at - product.price) / product.compare_at) * 100) : 0;
  // photos ab alag address se aati hain (browser inhein cache kar leta hai)
  const images = Array.from({ length: product.image_count }, (_, i) => imgUrl(product.id, i));

  const pay = {
    jazzcash: settings.pay_jazzcash || "",
    easypaisa: settings.pay_easypaisa || "",
    bank_number: settings.pay_bank_number || "",
    bank_title: settings.pay_bank_title || "",
  };

  return (
    <main>
      <TrackView id={product.id} name={product.name} price={product.price} />

      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl font-semibold text-glow">{storeName}</Link>
          <Link href="/" className="btn-ghost !px-5 !py-2 text-sm">All products</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-2">
          <div>
            <div className="relative">
              <ProductGallery images={images} name={product.name} discount={discount} />
              <OverlayBadges p={product} size="lg" />
            </div>
            {product.video_url && (
              <a href={product.video_url} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl2 bg-ink py-3 font-medium text-cream">▶ Watch product video</a>
            )}
          </div>
          <div>
            <span className="eyebrow">As seen on TikTok</span>
            <h1 className="mt-1 font-display text-2xl font-semibold md:text-4xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-ink">{fmt(product.price)}</span>
              {product.compare_at && <span className="text-ink/40 line-through">{fmt(product.compare_at)}</span>}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-ink/60">
              <span className="text-amber">★★★★★</span>
              <span className="font-medium text-ink/80">{(product.rating ?? 4.8).toFixed(1)}</span>
              {product.sold_count ? <span>· {product.sold_count} sold</span> : null}
              {product.category ? <span className="ml-1 rounded-full bg-cream px-2 py-0.5 text-xs">{product.category}</span> : null}
            </div>
            <InfoBadges p={product} size="lg" />
            {product.description && <p className="mt-3 text-ink/70">{product.description}</p>}
            <ul className="mt-4 space-y-1.5 text-sm text-ink/70">
              <li>✅ Cash on delivery — no advance payment</li>
              <li>🚚 Delivery all across Pakistan</li>
              <li>📞 We call to confirm every order</li>
            </ul>
            <div className="mt-5">
              <AddToCart id={product.id} slug={product.slug} name={product.name}
                price={product.price} hasImage={product.has_image} inStock={product.stock > 0} />
            </div>

            <div className="mt-5 rounded-xl2 bg-cream p-5 shadow-card md:p-6">
              <h2 className="mb-3 font-display text-xl font-semibold">Order now</h2>
              <OrderForm
                productId={product.id} productName={product.name} price={product.price}
                currency={currency} shippingFee={shippingFee} pay={pay}
                storeWhatsapp={settings.support_whatsapp || ""} storeName={storeName}
              />
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="bg-white py-12 md:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <div><span className="eyebrow">More from our shop</span>
                <h2 className="mt-1 font-display text-2xl font-semibold md:text-3xl">You may also like</h2></div>
              <Link href="/" className="btn-ghost text-sm">See all</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {others.map((p) => {
                const d = p.compare_at && p.compare_at > p.price ? Math.round(((p.compare_at - p.price) / p.compare_at) * 100) : 0;
                return (
                  <Link key={p.id} href={`/product/${p.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-cream transition duration-200 hover:-translate-y-0.5 hover:border-glow/40 hover:shadow-card">
                    <div className="relative aspect-square overflow-hidden bg-clay">
                      {d > 0 && <span className="absolute left-0 top-2 z-10 rounded-r-full bg-glow px-2 py-0.5 text-[11px] font-bold text-white shadow-soft">-{d}%</span>}
                      <OverlayBadges p={p} />
                      {p.has_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/img/${p.id}`} alt="" loading="lazy" decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      ) : (<div className="flex h-full w-full items-center justify-center p-2 text-center font-display text-xs font-semibold text-ink/60">{p.name}</div>)}
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <h3 className="min-h-[2.4em] text-[12.5px] leading-[1.25] line-clamp-2 text-ink/85 transition group-hover:text-glowdark">{p.name}</h3>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[15px] font-bold text-glowdark">{fmt(p.price)}</span>
                        {p.compare_at && p.compare_at > p.price && <span className="text-[11px] text-ink/40 line-through">{fmt(p.compare_at)}</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/50">
                        <span className="text-amber">★</span>
                        <span className="font-medium text-ink/70">{(p.rating ?? 4.8).toFixed(1)}</span>
                        {p.sold_count ? <span>· {p.sold_count} sold</span> : null}
                      </div>
                      <InfoBadges p={p} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-ink py-10 text-center text-sm text-cream/60">
        © {new Date().getFullYear()} {storeName}. All rights reserved. · <Link href="/" className="hover:text-cream">All products</Link>
      </footer>
    </main>
  );
}

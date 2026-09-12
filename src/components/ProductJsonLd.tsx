// Google ko product ki tafseel "us ki apni zabaan" mein deta hai.
// Is se Google search mein qeemat, rating aur "In stock" seedha nazar
// aa sakte hain — is ko rich result kehte hain, aur is par click
// zyada aate hain.
export default function ProductJsonLd({
  name, description, image, url, price, currency, inStock, rating, reviewCount, brand,
}: {
  name: string; description?: string | null; image?: string; url: string;
  price: number; currency: string; inStock: boolean;
  rating?: number | null; reviewCount?: number | null; brand: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || name,
    image: image ? [image] : undefined,
    brand: { "@type": "Brand", name: brand },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: String(price),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: brand },
    },
  };

  // Rating sirf tab bhejein jab asli reviews mojood hon —
  // warna Google isay jhoot samajh kar website ko saza deta hai.
  if (rating && reviewCount && reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(rating),
      reviewCount: String(reviewCount),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

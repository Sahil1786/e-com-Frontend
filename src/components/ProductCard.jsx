import { ArrowUpRight, LoaderCircle, PackageCheck, Plus } from "lucide-react";

const colors = [
  "from-[#e9e2d4] to-[#f4efe6]",
  "from-[#dfe8df] to-[#eff3e8]",
  "from-[#e7e2ee] to-[#f3eef5]",
  "from-[#f1e2d9] to-[#f5eee7]",
];

export function money(amountPaise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((amountPaise || 0) / 100);
}

export function productPrice(product) {
  const basePricePaise = product.pricePaise ?? Math.round((product.price || 0) * 100);
  const gstRate = product.gstRate ?? 18;
  return basePricePaise + Math.round((basePricePaise * gstRate) / 100);
}

export default function ProductCard({ product, index, busy, onAdd, onBuy, onView }) {
  const stock = product.availableStock ?? product.stock ?? product.quantity ?? 0;
  const price = productPrice(product);
  const imageUrl = product.imageUrls?.[0] || product.imageUrl;
  const hasGallery = (product.imageUrls?.length || (product.imageUrl ? 1 : 0)) > 1;
  const isNew = product.createdAt && Date.now() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;

  return (
    <article className="product-card group">
      <div className={`product-art bg-gradient-to-br ${colors[index % colors.length]}`}>
        {imageUrl ? product.mediaType === "video" && !product.imageUrls?.length ? (
          <video
            src={imageUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            aria-label={product.name}
          />
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-leaf/60">
            <PackageCheck size={42} strokeWidth={1.2} />
            <span className="max-w-[72%] text-center font-display text-sm font-semibold tracking-wide">
              Thoughtfully made
            </span>
          </div>
        )}
        {hasGallery && <span className="product-image-count">{product.imageUrls?.length || 1} images</span>}
        {product.category && (
          <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-leaf backdrop-blur">
            {product.category}
          </span>
        )}
        {isNew && <span className="absolute right-4 top-4 rounded-full bg-[#302449]/85 px-3 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white">New</span>}
        <button
          type="button"
          className="quick-add"
          onClick={() => onAdd(product)}
          disabled={stock < 1 || busy}
          aria-label={`Add ${product.name} to bag`}
          title={stock < 1 ? "Out of stock" : "Add to bag"}
        >
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={19} />}
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-semibold tracking-[-.02em] text-ink">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-[12px] leading-5 text-muted">
            {product.description || "A considered essential for everyday living."}
          </p>
          <button type="button" className="product-details-link mt-2" onClick={() => onView(product)}>Discover details <ArrowUpRight size={13} /></button>
        </div>
        <div className="shrink-0 text-right">
          <span className="block pt-0.5 text-sm font-semibold text-ink">{money(price)}</span>
          <span className="text-[9px] text-muted">incl. GST</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className={`text-[11px] ${stock > 0 ? "text-muted" : "font-medium text-rose-700"}`}>
          {stock > 5 ? "Ready to ship" : stock > 0 ? `Only ${stock} left` : "Sold out"}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.11em] text-leaf transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onBuy(product)}
          disabled={stock < 1}
        >
          Buy now <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

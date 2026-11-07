import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { money, productPrice } from "./ProductCard";

export default function CartDrawer({
  open,
  onClose,
  cart,
  summary,
  user,
  busyProductId,
  onAdd,
  onQuantityChange,
  onRemove,
  onSignIn,
  onCheckout,
}) {
  if (!open) return null;
  const items = cart || [];
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/35 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer-panel" aria-label="Shopping bag">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="eyebrow">YOUR SELECTION</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.04em]">The bag <span className="text-muted">({itemCount})</span></h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close bag"><X size={20} /></button>
        </div>
        {!user ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="icon-orb"><ShoppingBag size={24} /></div>
            <h3 className="mt-5 font-display text-xl font-semibold">Your bag is waiting.</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted">Sign in to see your bag, save your picks, and check out.</p>
            <button type="button" className="button-primary mt-6" onClick={onSignIn}>Sign in to continue <ArrowRight size={16} /></button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="icon-orb"><ShoppingBag size={24} /></div>
            <h3 className="mt-5 font-display text-xl font-semibold">Nothing in your bag. Yet.</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Find a few things that make every day a little better.</p>
            <button type="button" className="button-secondary mt-6" onClick={onClose}>Explore the collection</button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {items.map((item) => {
                const product = item.product;
                const imageUrl = product?.imageUrls?.[0] || product?.imageUrl;
                const availableStock = product?.availableStock ?? product?.stock ?? product?.quantity;
                return (
                  <article key={item.id || item.productId} className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-canvas">
                      {imageUrl ? product.mediaType === "video" && !product?.imageUrls?.length ? <video src={imageUrl} className="h-full w-full object-cover" muted loop playsInline aria-label={product.name} /> : <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-leaf/40"><ShoppingBag size={26} /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="truncate text-sm font-semibold">{product?.name || "Product"}</h3>
                          <p className="mt-1 text-xs text-muted">{money(productPrice(product || {}))}</p>
                        </div>
                        <button type="button" className="text-muted hover:text-rose-600" aria-label={`Remove ${product?.name || "item"}`} onClick={() => onRemove(item.productId)}><Trash2 size={16} /></button>
                      </div>
                      <div className="cart-quantity-control mt-4">
                        <button
                          type="button"
                          className="rounded-full p-1 text-muted transition hover:bg-canvas disabled:opacity-40"
                          onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
                          aria-label={`Decrease ${product?.name || "item"} quantity`}
                          disabled={busyProductId === item.productId || item.quantity <= 1}
                        ><Minus size={13} /></button>
                        <span className="min-w-4 text-center text-xs font-semibold">{item.quantity}</span>
                        <button type="button" className="rounded-full p-1 text-muted transition hover:bg-canvas disabled:opacity-40" onClick={() => onAdd(item.productId)} aria-label="Add one item" disabled={busyProductId === item.productId || (Number.isFinite(availableStock) && item.quantity >= availableStock)}><Plus size={13} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="cart-summary border-t border-line bg-white px-6 py-5">
              <div className="flex justify-between text-sm text-muted"><span>Items incl. taxes</span><span className="font-semibold text-ink">{money(summary?.totalAmountPaise)}</span></div>
              <p className="mt-2 text-xs leading-5 text-muted">Shipping and any discount are confirmed by the server at checkout.</p>
              <button type="button" className="button-primary mt-5 w-full" onClick={onCheckout}>Continue to checkout <ArrowRight size={16} /></button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

import { useState } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag, X } from "lucide-react";
import { money, productPrice } from "./ProductCard";

export default function ProductDetailModal({ product, onClose, onAdd, onBuy }) {
  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const currentImage = images[activeIndex];
  const isVideo = product.mediaType === "video" && !product.imageUrls?.length;

  function move(direction) {
    setActiveIndex((index) => (index + direction + images.length) % images.length);
  }

  return (
    <div
      className="modal-backdrop product-detail-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="product-detail-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close product details"><X size={19} /></button>
        <div className="product-detail-gallery">
          <div className="product-detail-main">
            {currentImage ? isVideo ? (
              <video src={currentImage} className="h-full w-full object-cover" controls playsInline aria-label={product.name} />
            ) : (
              <img src={currentImage} className="h-full w-full object-cover" alt={`${product.name}, image ${activeIndex + 1}`} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted"><ShoppingBag size={36} /><span>Image coming soon</span></div>
            )}
            {images.length > 1 && <>
              <button type="button" className="product-gallery-arrow product-gallery-prev" onClick={() => move(-1)} aria-label="Previous product image"><ArrowLeft size={17} /></button>
              <button type="button" className="product-gallery-arrow product-gallery-next" onClick={() => move(1)} aria-label="Next product image"><ArrowRight size={17} /></button>
              <span className="product-gallery-count">{activeIndex + 1} / {images.length}</span>
            </>}
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbnails" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`product-detail-thumbnail ${index === activeIndex ? "product-detail-thumbnail-active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={index === activeIndex}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-copy">
          <span className="eyebrow">{product.category || "AN ARCANE FIND"}</span>
          <h2 id="product-detail-title" className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-4xl">{product.name}</h2>
          <p className="mt-3 text-xl font-semibold">{money(productPrice(product))}<span className="ml-2 text-xs font-medium text-muted">incl. GST</span></p>
          {product.description ? (
            <div className="product-detail-description mt-6">{product.description}</div>
          ) : (
            <p className="mt-6 text-sm leading-7 text-muted">A curious little treasure, chosen to bring a touch of wonder to the everyday.</p>
          )}
          {product.hsnCode && <p className="mt-5 text-xs text-muted">Product code: {product.hsnCode}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="button-primary" onClick={() => onAdd(product)}><ShoppingBag size={16} /> Add to bag</button>
            <button type="button" className="button-secondary" onClick={() => onBuy(product)}>Buy now <ArrowRight size={16} /></button>
          </div>
          <p className="mt-4 text-xs text-muted">Cash on delivery available · Shipping shown at checkout</p>
        </div>
      </section>
    </div>
  );
}

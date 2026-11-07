import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Leaf,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Moon,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { api } from "./api";
import AdminApp from "./AdminApp";
import AuthModal from "./components/AuthModal";
import AddressBookModal from "./components/AddressBookModal";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import OrdersModal from "./components/OrdersModal";
import ProductDetailModal from "./components/ProductDetailModal";
import ProductCard from "./components/ProductCard";
import StoreLogo from "./components/StoreLogo";
import { useStoreBranding } from "./useStoreBranding";

const perks = [
  { icon: Leaf, title: "Considered by design", text: "Useful things, made to be kept." },
  { icon: ShieldCheck, title: "A little more assured", text: "Secure sign-in and clear checkout." },
  { icon: Truck, title: "Pay when it arrives", text: "Cash on delivery is ready to go." },
];

function Storefront() {
  const [brand] = useStoreBranding();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [popularProducts, setPopularProducts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState("");
  const [apiOnline, setApiOnline] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Everything");
  const [busyProductId, setBusyProductId] = useState("");
  const [toast, setToast] = useState("");
  const [payments, setPayments] = useState({ cod: true, razorpay: false });
  const [addressBookOpen, setAddressBookOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("moonlit-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("moonlit-theme", theme);
    } catch {
      setToast("Theme preference will reset when you close this tab.");
    }
  }, [theme]);

  const loadProducts = useCallback(async (silent = false) => {
    if (!silent) setProductsLoading(true);
    setLoadError("");
    try {
      const result = await api("/user/products");
      setProducts(result.products || []);
      setApiOnline(true);
    } catch (error) {
      setLoadError(error.message);
      setApiOnline(false);
    } finally {
      if (!silent) setProductsLoading(false);
    }
  }, []);

  const loadPopularProducts = useCallback(async () => {
    setPopularError("");
    try {
      const result = await api("/user/products/popular");
      setPopularProducts(result.products || []);
    } catch (error) {
      setPopularError(error.message);
    } finally {
      setPopularLoading(false);
    }
  }, []);

  const loadCart = useCallback(async () => {
    const result = await api("/user/cart");
    setCart(result.cartItems || []);
    setCartSummary(result.summary || null);
    return result;
  }, []);

  useEffect(() => {
    loadProducts();
    loadPopularProducts();
    api("/storefront/config")
      .then((result) => setPayments(result.payments || { cod: true, razorpay: false }))
      .catch(() => setPayments({ cod: true, razorpay: false }));
    api("/auth/me")
      .then((result) => {
        setUser(result.user);
        setSessionExpiresAt(result.expiresAt);
        return api("/user/cart");
      })
      .then((result) => {
        setCart(result.cartItems || []);
        setCartSummary(result.summary || null);
      })
      .catch((error) => {
        setUser(null);
        setSessionExpiresAt(null);
        setCart([]);
        setCartSummary(null);
        if (error.status === 403 && error.message.toLowerCase().includes("admin")) {
          api("/auth/logout", { method: "POST", body: {} })
            .then(() => setToast("Admin accounts must sign in through the admin dashboard."))
            .catch(() => setToast("Admin account detected. Sign out, then use the admin dashboard."));
        }
      });
  }, [loadPopularProducts, loadProducts]);

  useEffect(() => {
    const refreshCatalog = () => {
      if (document.visibilityState !== "visible") return;
      loadProducts(true);
    };
    const refreshVisibleStorefront = () => {
      refreshCatalog();
      loadPopularProducts();
    };
    const interval = window.setInterval(refreshCatalog, 20000);
    window.addEventListener("focus", refreshVisibleStorefront);
    document.addEventListener("visibilitychange", refreshVisibleStorefront);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisibleStorefront);
      document.removeEventListener("visibilitychange", refreshVisibleStorefront);
    };
  }, [loadPopularProducts, loadProducts]);

  useEffect(() => {
    if (!user || !sessionExpiresAt) return undefined;
    const timer = window.setTimeout(() => {
      setUser(null);
      setSessionExpiresAt(null);
      setCart([]);
      setCartSummary(null);
      setOrdersOpen(false);
      setCheckout(null);
      setCartOpen(false);
      setAddressBookOpen(false);
      setPendingAction(null);
      setToast("Your 7-day session expired. Please sign in again.");
    }, Math.max(0, sessionExpiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [sessionExpiresAt, user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return ["Everything", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Everything" || product.category === category;
      const matchesQuery = !normalizedQuery ||
        `${product.name} ${product.description || ""} ${product.category || ""}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  const bagCount = cart.reduce((total, item) => total + item.quantity, 0);

  async function addItem(productOrId) {
    const product = typeof productOrId === "string"
      ? products.find((item) => item.id === productOrId) ||
        cart.find((item) => item.productId === productOrId)?.product
      : productOrId;
    if (!product) return;
    if (!user) {
      setPendingAction({ type: "add", product });
      setCartOpen(false);
      setAuthOpen(true);
      return;
    }

    setBusyProductId(product.id);
    try {
      await api("/user/cart", { method: "POST", body: { productId: product.id, quantity: 1 } });
      await loadCart();
      setToast(`${product.name} added to your bag.`);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyProductId("");
    }
  }

  function buyNow(product) {
    if (!user) {
      setPendingAction({ type: "buy", product });
      setAuthOpen(true);
      return;
    }
    setCheckout({ mode: "DIRECT", product, quantity: 1 });
  }

  async function removeItem(productId) {
    setBusyProductId(productId);
    try {
      await api(`/user/cart/${productId}`, { method: "DELETE" });
      await loadCart();
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyProductId("");
    }
  }

  async function changeQuantity(productId, quantity) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    setBusyProductId(productId);
    try {
      await api(`/user/cart/${productId}`, { method: "PATCH", body: { quantity } });
      await loadCart();
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyProductId("");
    }
  }

  async function authenticated(result) {
    setUser(result.user);
    setSessionExpiresAt(result.expiresAt);
    setAuthOpen(false);
    const nextAction = pendingAction;
    setPendingAction(null);
    try {
      await loadCart();
    } catch (error) {
      setToast(error.message);
    }
    if (nextAction?.type === "add") await addItem(nextAction.product);
    if (nextAction?.type === "buy") {
      setCheckout({ mode: "DIRECT", product: nextAction.product, quantity: 1 });
    }
    if (nextAction?.type === "checkout") setCheckout({ mode: "CART" });
    if (nextAction?.type === "orders") setOrdersOpen(true);
  }

  function checkoutCart() {
    setCartOpen(false);
    if (!user) {
      setPendingAction({ type: "checkout" });
      setAuthOpen(true);
      return;
    }
    setCheckout({ mode: "CART" });
  }

  function openOrders() {
    if (!user) {
      setPendingAction({ type: "orders" });
      setAuthOpen(true);
      return;
    }
    setOrdersOpen(true);
  }

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST", body: {} });
    } catch {
      setToast("Could not sign out. Please check your connection and try again.");
      return;
    }
    setUser(null);
    setSessionExpiresAt(null);
    setCart([]);
    setCartSummary(null);
    setOrdersOpen(false);
    setCheckout(null);
    setCartOpen(false);
    setAddressBookOpen(false);
    setPendingAction(null);
    setToast("You’ve been signed out.");
  }

  function scrollToCollection() {
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
  }

  if (productsLoading) {
    return (
      <div className={`magic-loading-screen ${theme === "dark" ? "magic-loading-dark" : "magic-loading-light"}`}>
        <div className="magic-loader" role="status" aria-live="polite">
          <div className="magic-loader__sigil" aria-hidden="true">
            <span className="magic-loader__ring magic-loader__ring-one" />
            <span className="magic-loader__ring magic-loader__ring-two" />
            <span className="magic-loader__ring magic-loader__ring-three" />
            <span className="magic-loader__core">✦</span>
          </div>
          <p className="magic-loader__brand">{brand.brandName}</p>
          <p className="magic-loader__caption">Opening a little portal to wonder…</p>
          <span className="sr-only">Loading the shop</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-canvas text-ink horror-theme ${theme === "dark" ? "horror-dark" : "horror-light"}`} data-theme={theme}>
      <div className="announcement-bar">
        <Sparkles size={13} />
        <span>A little wonder for your everyday</span>
        <span className="announcement-divider">·</span>
        <span>Cash on delivery available</span>
      </div>

      <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="/" className="brand-mark" aria-label={`${brand.brandName} home`}>
            <StoreLogo logoUrl={brand.logoUrl} className={`brand-symbol ${brand.logoUrl ? "brand-symbol-logo" : ""}`} />
            <span className="leading-none">
              <span className="block font-display text-[17px] font-bold tracking-[-.07em]">{brand.brandName}</span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[.24em] text-muted">curiosities & wonders</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            <button type="button" className="nav-link" onClick={scrollToCollection}>Shop all</button>
            <a className="nav-link" href="#our-way">Our way</a>
            <button type="button" className="nav-link" onClick={openOrders}>Your orders</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${apiOnline ? "bg-emerald-500" : apiOnline === false ? "bg-rose-500" : "bg-amber-400"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{apiOnline ? "Store live" : apiOnline === false ? "API offline" : "Connecting"}</span>
            </div>
            {user ? (
              <div className="group relative">
                <button type="button" className="icon-button" aria-label="Account menu"><UserRound size={18} /></button>
                <div className="invisible absolute right-0 top-full z-40 w-48 translate-y-2 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-card transition group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100">
                  <p className="truncate px-3 py-2 text-xs text-muted">Hi, {user.name}</p>
                  <button type="button" className="account-menu-item" onClick={openOrders}>Your orders</button>
                  <button type="button" className="account-menu-item" onClick={() => setAddressBookOpen(true)}>Saved details & addresses</button>
                  <button type="button" className="account-menu-item text-rose-700" onClick={signOut}>Sign out</button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" className="hidden rounded-full px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white sm:block" onClick={() => setAuthOpen(true)}>Sign in</button>
                <button type="button" className="icon-button sm:hidden" onClick={() => setAuthOpen(true)} aria-label="Sign in"><UserRound size={18} /></button>
              </>
            )}
            <button type="button" className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="icon-button relative" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${bagCount} items`}>
              <ShoppingBag size={18} />
              {bagCount > 0 && <span className="bag-count">{bagCount}</span>}
            </button>
            <button type="button" className="icon-button md:hidden" onClick={scrollToCollection} aria-label="Shop collection"><Menu size={19} /></button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section mx-auto max-w-[1440px] px-5 pt-5 sm:px-8 lg:px-12 lg:pt-8">
          <div className="hero-panel magic-hero">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2200&q=85"
              alt="Starry night sky above a quiet mountain"
              loading="eager"
            />
            <div className="hero-overlay" />
            <span className="magic-star magic-star-one">✦</span>
            <span className="magic-star magic-star-two">✧</span>
            <span className="magic-star magic-star-three">✧</span>
            <span className="magic-orbit" aria-hidden="true" />
            <div className="hero-content">
              <span className="hero-kicker"><span className="hero-kicker-dot" /> ENTER IF YOU DARE · THE WITCHING HOUR COLLECTION</span>
              <h1>Find a little<br /><em>magic.</em></h1>
              <p>Enchanted curiosities, mystical charms, and unusual little treasures for those who find beauty in the strange.</p>
              <button type="button" className="hero-button" onClick={scrollToCollection}>Explore the curiosities <ArrowRight size={16} /></button>
            </div>
            <div className="hero-note">
              <span className="hero-note-star">✧</span>
              <span>For curious souls<br />and kindred spirits.</span>
            </div>
            <div className="hero-counter"><span>01</span><i /> 03</div>
          </div>
          <div className="hero-underbar">
            <span>SMALL WONDERS · BIG FEELINGS</span>
            <span className="hidden sm:inline">CAREFULLY CURATED UNDER A LUCKY STAR</span>
            <a href="#collection" className="inline-flex items-center gap-2 font-semibold text-leaf">Explore <ArrowDown size={14} /></a>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pt-12 sm:px-8 lg:px-12 lg:pt-16" aria-labelledby="popular-title">
          <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">CUSTOMER FAVOURITES</span>
              <h2 id="popular-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.06em] sm:text-4xl">Most-loved curiosities.</h2>
              <p className="mt-2 text-sm text-muted">The treasures customers have purchased most.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-leaf hover:underline" onClick={scrollToCollection}>See all products <ArrowRight size={14} /></button>
          </div>
          {popularLoading ? (
            <div className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-card" />)}</div>
          ) : popularError ? (
            <p className="py-8 text-sm text-rose-700" role="status">Popular picks could not be loaded: {popularError}</p>
          ) : popularProducts.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 pt-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {popularProducts.slice(0, 4).map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} busy={busyProductId === product.id} onAdd={addItem} onBuy={buyNow} onView={setDetailProduct} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-sm text-muted">Our customer favourites will appear here as orders come in. Browse the full collection below.</p>
          )}
        </section>

        <section id="collection" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-24">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <span className="eyebrow">THE MAGIC COLLECTION</span>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] sm:text-5xl">A cabinet of curiosities.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Wondrous finds for your home, your rituals, and the wonderfully ordinary days in between.</p>
            </div>
            <label className="search-field">
              <Search size={17} className="shrink-0 text-muted" />
              <input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find something good" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}
              {!query && <kbd>⌘ K</kbd>}
            </label>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button key={item} type="button" className={`filter-chip ${category === item ? "filter-chip-active" : ""}`} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
            <span className="text-xs text-muted">All {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} · newest first</span>
          </div>

          {loadError && (
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">We couldn’t reach your store.</p>
                <p className="mt-1 text-sm text-rose-800">{loadError}</p>
                <p className="mt-1 text-xs text-rose-700">Start the backend with <code>npm start</code>, then check its port in the Vite proxy settings.</p>
              </div>
              <button type="button" className="button-secondary shrink-0" onClick={loadProducts}>Try again</button>
            </div>
          )}

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 pt-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="skeleton-card" />)}
            </div>
          ) : !loadError && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 pt-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} busy={busyProductId === product.id} onAdd={addItem} onBuy={buyNow} onView={setDetailProduct} />
              ))}
            </div>
          ) : !loadError ? (
            <div className="py-20 text-center">
              <div className="icon-orb mx-auto"><Search size={22} /></div>
              <h3 className="mt-5 font-display text-xl font-semibold">Nothing here just yet.</h3>
              <p className="mt-2 text-sm text-muted">{query ? "Try another search or clear your filters." : "Products will appear here as soon as they’re added to your store."}</p>
              {(query || category !== "Everything") && <button type="button" className="button-secondary mt-5" onClick={() => { setQuery(""); setCategory("Everything"); }}>Clear filters</button>}
            </div>
          ) : null}
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-muted">
            <span className="h-px w-9 bg-line" /> A LITTLE STRANGE, A LITTLE WONDERFUL <span className="h-px w-9 bg-line" />
          </div>
        </section>

        <section id="our-way" className="border-y border-line bg-[#eff1e9]">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-center lg:px-12 lg:py-20">
            <div>
              <span className="eyebrow">A FEW THINGS WE BELIEVE</span>
              <h2 className="mt-3 max-w-sm font-display text-4xl font-semibold leading-[1.08] tracking-[-.06em]">Wonder lives<br /><span className="text-leaf">in the details.</span></h2>
            </div>
            <div className="grid gap-7 sm:grid-cols-3">
              {perks.map(({ icon: Icon, title, text }) => (
                <article key={title} className="border-t border-leaf/20 pt-4">
                  <Icon size={20} strokeWidth={1.6} className="text-leaf" />
                  <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="newsletter-panel">
            <div>
              <span className="eyebrow text-white/60">A MESSAGE FROM THE OTHER SIDE</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.05em] text-white sm:text-4xl">Curiosities after dark.</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/65">Unusual objects, mysterious details, and charms for the wonderfully weird.</p>
            </div>
            <button type="button" className="newsletter-button" onClick={scrollToCollection}>Browse the strange <ArrowUpRight size={16} /></button>
            <Heart className="newsletter-heart" size={80} strokeWidth={0.8} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <a href="/" className="font-display text-sm font-bold tracking-[-.06em] text-ink">{brand.brandName}<span className="text-violet-600"> ✦</span></a>
          <p>Curiosities and wonders, selected with care.</p>
          <div className="flex items-center gap-4"><a href="/admin" className="font-semibold text-leaf hover:underline">Storekeeper sign in</a><span>© {new Date().getFullYear()} {brand.brandName}</span></div>
        </div>
      </footer>

      <div className="mobile-shop-bar md:hidden">
        <button type="button" className="button-primary flex-1" onClick={scrollToCollection}>Shop the collection <ArrowRight size={16} /></button>
        <button type="button" className="icon-button" onClick={() => setCartOpen(true)} aria-label="Open bag"><ShoppingBag size={18} />{bagCount > 0 && <span className="bag-count">{bagCount}</span>}</button>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        summary={cartSummary}
        user={user}
        busyProductId={busyProductId}
        onAdd={addItem}
        onQuantityChange={changeQuantity}
        onRemove={removeItem}
        onSignIn={() => { setCartOpen(false); setAuthOpen(true); }}
        onCheckout={checkoutCart}
      />
      {authOpen && <AuthModal onClose={() => { setAuthOpen(false); setPendingAction(null); }} onAuthenticated={authenticated} />}
      {detailProduct && <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} onAdd={(product) => { setDetailProduct(null); addItem(product); }} onBuy={(product) => { setDetailProduct(null); buyNow(product); }} />}
      {addressBookOpen && user && <AddressBookModal user={user} onUserUpdated={setUser} onClose={() => setAddressBookOpen(false)} />}
      {checkout && (
        <CheckoutModal
          user={user}
          mode={checkout.mode}
          product={checkout.product}
          quantity={checkout.quantity}
          payments={payments}
          brandName={brand.brandName}
          logoUrl={brand.logoUrl}
          onClose={() => setCheckout(null)}
          onPlaced={async () => {
            if (checkout.mode === "CART") {
              await loadCart().catch(() => {
                setCart([]);
                setCartSummary(null);
              });
            }
            await loadProducts();
          }}
        />
      )}
      {ordersOpen && <OrdersModal onClose={() => setOrdersOpen(false)} onCancelled={() => { loadCart().catch(() => {}); loadProducts(); }} />}
      {toast && (
        <div className="toast-message" role="status">
          <Check size={16} /> <span>{toast}</span>
          <button type="button" onClick={() => setToast("")} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return window.location.pathname.startsWith("/admin") ? <AdminApp /> : <Storefront />;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Database,
  LayoutDashboard,
  LineChart,
  LoaderCircle,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { api, downloadInvoice } from "./api";
import { money } from "./components/ProductCard";
import StoreLogo from "./components/StoreLogo";
import { useStoreBranding } from "./useStoreBranding";

const navigation = [
  { key: "overview", label: "Overview & reports", icon: LayoutDashboard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "customers", label: "Customers", icon: Users },
  { key: "products", label: "Products & stock", icon: Boxes },
  { key: "inventory", label: "Stock movement log", icon: Database },
  { key: "coupons", label: "Coupons", icon: Tag },
  { key: "delivery", label: "Store settings", icon: Settings2 },
];

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AdminSignIn({ onSignedIn, initialMessage }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (initialMessage) setError(initialMessage);
  }, [initialMessage]);

  async function sendOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/admin/send-otp", {
        method: "POST",
        body: { mobile, purpose: "Login" },
      });
      setOtpSent(true);
      setDevOtp(result.devOtp || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/admin/verify-otp", {
        method: "POST",
        body: { mobile, otp },
      });
      if (result.user?.role !== "ADMIN") {
        await api("/auth/logout", { method: "POST", body: {} });
        throw new Error("This account does not have administrator access.");
      }
      onSignedIn(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <a href="/" className="admin-back-link"><ArrowLeft size={15} /> Back to the shop</a>
      <section className="admin-login-card">
        <div className="admin-login-symbol"><Sparkles size={24} /></div>
        <span className="admin-eyebrow">NAJU’S MAGIC SHOP · PRIVATE AREA</span>
        <h1 className="admin-login-title">Your little corner<br />of the magic.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Sign in with the administrator mobile number configured for your store.</p>
        {!otpSent ? (
          <form onSubmit={sendOtp} className="mt-8">
            <label className="admin-label" htmlFor="admin-mobile">Administrator mobile</label>
            <div className="flex">
              <span className="flex h-12 items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">+91</span>
              <input id="admin-mobile" className="admin-input rounded-l-none" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" placeholder="10-digit number" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
            </div>
            <button type="submit" className="admin-primary mt-5 w-full" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Send secure code</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-8">
            <label className="admin-label" htmlFor="admin-otp">One-time code</label>
            <input id="admin-otp" className="admin-input text-center tracking-[.5em]" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="••••••" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
            {devOtp && <button type="button" className="mt-3 w-full rounded-xl bg-violet-50 p-3 text-xs text-violet-800" onClick={() => setOtp(devOtp)}>Local code: <strong className="tracking-widest">{devOtp}</strong></button>}
            <button type="submit" className="admin-primary mt-5 w-full" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Verify admin access</button>
            <button type="button" className="mt-4 w-full text-xs font-semibold text-slate-500 hover:text-violet-700" onClick={() => { setOtpSent(false); setOtp(""); }}>Use a different number</button>
          </form>
        )}
        {error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
        <p className="mt-8 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">Admin access is assigned by the server. Customer accounts cannot open the dashboard.</p>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note, tint = "violet" }) {
  return (
    <article className="admin-stat-card">
      <div className={`admin-stat-icon admin-stat-${tint}`}><Icon size={18} /></div>
      <p className="mt-5 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-[-.05em] text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{note}</p>
    </article>
  );
}

function ProductEditor({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    price: product ? String(product.pricePaise != null ? product.pricePaise / 100 : product.price || "") : "",
    gstRate: String(product?.gstRate ?? 18),
    hsnCode: product?.hsnCode || "9983",
    stock: String(product?.availableStock ?? product?.stock ?? product?.quantity ?? 0),
    imageUrls: product?.imageUrls?.length
      ? [...product.imageUrls]
      : product?.imageUrl && product?.mediaType !== "video"
        ? [product.imageUrl]
        : [],
    files: [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(event) {
    const { name, value, files } = event.target;
    if (name === "images") {
      const selected = Array.from(files || []);
      event.target.value = "";
      if (form.imageUrls.length + form.files.length + selected.length > 7) {
        setError("A product can have up to 7 images total.");
        return;
      }
      setError("");
      setForm((current) => ({ ...current, files: [...current.files, ...selected] }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("name", form.name.trim());
      body.set("description", form.description.trim());
      body.set("category", form.category.trim());
      body.set("pricePaise", String(Math.round(Number(form.price) * 100)));
      body.set("gstRate", form.gstRate);
      body.set("hsnCode", form.hsnCode.trim());
      if (!product) body.set("stock", form.stock);
      body.set("imageUrls", JSON.stringify(form.imageUrls));
      form.files.forEach((file) => body.append("images", file));
      await onSave(body, product?.id);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card max-w-[650px]" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close product editor"><X size={19} /></button>
        <span className="admin-eyebrow">INVENTORY SPELLBOOK</span>
        <h2 id="product-editor-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">{product ? "Edit this treasure" : "Add a new treasure"}</h2>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="sm:col-span-2"><label className="admin-label" htmlFor="product-name">Product name</label><input id="product-name" className="admin-input" name="name" value={form.name} onChange={update} required /></div>
          <div className="sm:col-span-2"><label className="admin-label" htmlFor="product-description">Description</label><textarea id="product-description" className="admin-input min-h-24 py-3" name="description" value={form.description} onChange={update} rows={3} /></div>
          <div><label className="admin-label" htmlFor="product-category">Category</label><input id="product-category" className="admin-input" name="category" value={form.category} onChange={update} placeholder="Accessories" /></div>
          <div><label className="admin-label" htmlFor="product-price">Price (₹ before GST)</label><input id="product-price" className="admin-input" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={update} required /></div>
          {!product && <div><label className="admin-label" htmlFor="product-stock">Opening stock</label><input id="product-stock" className="admin-input" name="stock" type="number" min="0" step="1" value={form.stock} onChange={update} required /></div>}
          {product && <p className="self-end text-[10px] leading-4 text-slate-400">Use Products & stock to record received inventory and adjustments.</p>}
          <div>
            <label className="admin-label" htmlFor="product-gst">GST rate</label>
            <select id="product-gst" className="admin-input" name="gstRate" value={form.gstRate} onChange={update}>
              {[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
            </select>
          </div>
          <div><label className="admin-label" htmlFor="product-hsn">HSN code</label><input id="product-hsn" className="admin-input" name="hsnCode" value={form.hsnCode} onChange={update} /></div>
          <div className="sm:col-span-2">
            <label className="admin-label" htmlFor="product-images">Product photos <span className="font-normal text-slate-400">(up to 7)</span></label>
            <label className="admin-upload" htmlFor="product-images"><Upload size={15} /><span>Choose images · {form.imageUrls.length + form.files.length}/7 selected</span></label>
            <input id="product-images" className="sr-only" name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={update} disabled={form.imageUrls.length + form.files.length >= 7} />
            {(form.imageUrls.length > 0 || form.files.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.imageUrls.map((image, index) => (
                  <div key={`${image}-${index}`} className="admin-image-preview">
                    <img src={image} alt={`Product photo ${index + 1}`} />
                    <button type="button" onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove product photo ${index + 1}`}><X size={12} /></button>
                  </div>
                ))}
                {form.files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="admin-new-image-chip">
                    <span className="max-w-36 truncate">{file.name}</span>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, files: current.files.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove ${file.name}`}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-[10px] leading-4 text-slate-400">Add several views so customers can inspect the product gallery. Cloudinary settings are required to upload photos.</p>
          </div>
          {error && <p className="sm:col-span-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="admin-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary" disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}{product ? "Save changes" : "Create product"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function OrderCard({ order, onStatus, onInvoice, onRefund, onCancel, busy }) {
  const [trackingId, setTrackingId] = useState(order.trackingId || "");
  const [courierName, setCourierName] = useState(order.courierName || "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const canShip = ["CONFIRMED", "PAID", "PROCESSING", "SHIPMENT_REVIEW"].includes(order.status);
  const canProcess = ["CONFIRMED", "PAID"].includes(order.status);
  const canDeliver = order.status === "SHIPPED";
  const canRefund = order.paymentId && order.paymentMethod !== "COD" && ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "PAYMENT_REVIEW"].includes(order.status);

  async function refund(event) {
    event.preventDefault();
    if (!window.confirm(`Issue an online refund of ₹${refundAmount}?`)) return;
    const result = await onRefund(order, {
      amountPaise: Math.round(Number(refundAmount) * 100),
      reason: refundReason || "Admin refund",
    });
    if (result) {
      setRefundAmount("");
      setRefundReason("");
    }
  }

  return (
    <article className="admin-order-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Order {order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`}</h3>
            <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span>
            {order.paymentMethod === "COD" && order.paidAt && <span className="admin-collection-complete">COLLECTION COMPLETE</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">{order.user?.name || order.recipientName} · {order.user?.mobile || order.phone} · {new Date(order.createdAt).toLocaleString("en-IN")}</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{order.items?.map((item) => `${item.productName} × ${item.quantity}`).join(" · ")}</p>
          <p className="mt-1 text-xs text-slate-500">{order.paymentMethod === "COD" ? (order.paidAt ? `Cash collected: ${money(order.totalAmountPaise)} · ${new Date(order.paidAt).toLocaleString("en-IN")}` : "Cash on delivery · not collected") : `Online payment · ${order.paymentId ? `Payment #${order.paymentId}` : order.status === "PENDING" ? "awaiting payment" : "not recorded"}`}</p>
          {order.paymentMethod !== "COD" && order.paymentInstrument && <p className="mt-1 text-xs font-medium text-slate-600">Razorpay method: {order.paymentInstrument.toUpperCase()}</p>}
          {order.paymentReference && <p className="mt-1 text-xs text-slate-600">UTR / payment reference: {order.paymentReference}</p>}
          {order.status === "CANCELLED" && <p className="mt-2 text-xs text-rose-700"><strong>Cancelled items:</strong> {order.items?.map((item) => `${item.productName} × ${item.quantity}`).join(" · ") || "No item details"}{order.cancellationReason ? ` · ${order.cancellationReason}` : ""}</p>}
          <p className="mt-2 text-xs leading-5 text-slate-600"><strong>Deliver to:</strong> {order.recipientName}, {order.phone}, {order.addressLine}, {order.city}, {order.state} {order.pincode}</p>
          <p className="mt-1 text-xs text-slate-500">Customer email: {order.user?.email || "Not provided"}</p>
          {(order.courierName || order.trackingId || order.awbCode) && <p className="mt-1 text-xs text-slate-500">Delivery: {order.courierName || "Courier not set"} · Tracking {order.trackingId || order.awbCode}</p>}
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="font-display text-lg font-semibold text-slate-900">{money(order.totalAmountPaise)}</p>
          {order.shippingChargePaise > 0 && <p className="mt-1 text-[10px] text-slate-500">Shipping {money(order.shippingChargePaise)}</p>}
          {order.codChargePaise > 0 && <p className="mt-1 text-[10px] text-slate-500">COD fee {money(order.codChargePaise)}</p>}
          <p className="mt-1 text-[11px] text-slate-500">{order.invoiceNumber || "Invoice unavailable"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
        {order.invoiceNumber && <button type="button" className="admin-secondary" disabled={busy} onClick={() => onInvoice(order)}><ArrowDownToLine size={14} /> Invoice</button>}
        {["PENDING", "CONFIRMED", "PAID"].includes(order.status) && <button type="button" className="admin-secondary text-rose-700" disabled={busy} onClick={() => onCancel(order)}><X size={14} /> Cancel order</button>}
        {canProcess && <button type="button" className="admin-secondary" disabled={busy} onClick={() => onStatus(order, "PROCESSING")}><Package size={14} /> Mark processing</button>}
        {canShip && (
          <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); onStatus(order, "SHIPPED", { trackingId, courierName, trackingUrl }); }}>
            <label className="text-[10px] font-semibold text-slate-500">Courier<input className="admin-input mt-1 h-9 w-36 text-xs" value={courierName} onChange={(event) => setCourierName(event.target.value)} placeholder="Courier name" /></label>
            <label className="text-[10px] font-semibold text-slate-500">Tracking ID<input className="admin-input mt-1 h-9 min-w-[150px] text-xs" value={trackingId} onChange={(event) => setTrackingId(event.target.value)} required /></label>
            <label className="text-[10px] font-semibold text-slate-500">Tracking link<input className="admin-input mt-1 h-9 min-w-[180px] text-xs" type="url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://..." /></label>
            <button type="submit" className="admin-secondary" disabled={busy}><Truck size={14} /> Mark shipped</button>
          </form>
        )}
        {canDeliver && <button type="button" className="admin-secondary" disabled={busy} onClick={() => onStatus(order, "DELIVERED")}><Check size={14} /> Mark delivered</button>}
        {order.status === "DELIVERED" && order.paymentMethod === "COD" && !order.paidAt && <button type="button" className="admin-secondary" disabled={busy} onClick={() => onStatus(order, "COLLECT_COD")}><BadgeIndianRupee size={14} /> Mark {money(order.totalAmountPaise)} collected</button>}
        {canRefund && (
          <form className="flex flex-wrap items-end gap-2" onSubmit={refund}>
            <label className="text-[10px] font-semibold text-slate-500">Refund amount (₹)<input className="admin-input mt-1 h-9 w-28 text-xs" type="number" min="0.01" max={(order.totalAmountPaise - order.refundedAmountPaise) / 100} step="0.01" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} required /></label>
            <label className="text-[10px] font-semibold text-slate-500">Reason<input className="admin-input mt-1 h-9 w-36 text-xs" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Optional" /></label>
            <button type="submit" className="admin-secondary text-rose-700" disabled={busy}><BadgeIndianRupee size={14} /> Refund</button>
          </form>
        )}
      </div>
      {order.events?.length > 0 && (
        <details className="mt-4 border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-violet-700">Order history ({order.events.length})</summary>
          <ol className="mt-3 space-y-2 border-l border-violet-100 pl-3">
            {order.events.map((event) => <li key={event.id} className="text-[10px] leading-4 text-slate-500"><strong className="text-slate-700">{event.status.replaceAll("_", " ")}</strong> · {event.message} · {new Date(event.createdAt).toLocaleString("en-IN")}</li>)}
          </ol>
        </details>
      )}
    </article>
  );
}

function AdminDashboard({ dashboard, orders, activityOrders, activitySearch, activityLoading, loading, reportFrom, reportTo, onDateChange, onActivitySearch }) {
  const totals = dashboard?.totals || {};
  const pipeline = dashboard?.pipeline || {};
  const activities = activityOrders.slice(0, 7);
  const maxSales = Math.max(1, ...(dashboard?.salesByDate || []).map((item) => item.grossPaise));

  function exportCollections() {
    const rows = [
      ["Date", "Online collected (INR)", "Card (INR)", "UPI (INR)", "Other online (INR)", "Cash on delivery collected (INR)", "Total collected (INR)", "Refunds (INR)", "Net collected (INR)"],
      ...(dashboard?.salesByDate || []).map((day) => [
        day.date,
        (day.onlineCollectedPaise / 100).toFixed(2),
        (day.onlineCardCollectedPaise / 100).toFixed(2),
        (day.onlineUpiCollectedPaise / 100).toFixed(2),
        (day.otherOnlineCollectedPaise / 100).toFixed(2),
        (day.cashCollectedPaise / 100).toFixed(2),
        (day.totalCollectedPaise / 100).toFixed(2),
        (day.refundsPaise / 100).toFixed(2),
        (day.netPaise / 100).toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `najus-magic-shop-collections-${reportFrom}-to-${reportTo}.csv`;
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-7">
      <section className="admin-panel flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-section-title">Collection report</h2>
          <p className="mt-1 text-xs text-slate-500">Money actually received, grouped by the payment date.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-semibold text-slate-500">From<input className="admin-input mt-1 block h-9" type="date" value={reportFrom} max={reportTo} onChange={(event) => onDateChange("from", event.target.value)} /></label>
          <label className="text-[10px] font-semibold text-slate-500">To<input className="admin-input mt-1 block h-9" type="date" value={reportTo} min={reportFrom} onChange={(event) => onDateChange("to", event.target.value)} /></label>
          <button type="button" className="admin-secondary h-9" onClick={exportCollections} disabled={!dashboard?.salesByDate?.length}><ArrowDownToLine size={14} /> Export CSV</button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={BadgeIndianRupee} label="Total collected" value={money(totals.totalCollectedPaise)} note={`${dashboard?.dateRange?.from || reportFrom} – ${dashboard?.dateRange?.to || reportTo}`} />
        <StatCard icon={BadgeIndianRupee} label="Online collected" value={money(totals.onlineCollectedPaise)} note="Successful online payments" tint="blue" />
        <StatCard icon={CreditCard} label="Card collected" value={money(totals.onlineCardCollectedPaise)} note="Razorpay card payments" tint="blue" />
        <StatCard icon={BadgeIndianRupee} label="UPI collected" value={money(totals.onlineUpiCollectedPaise)} note="Razorpay UPI payments" tint="blue" />
        <StatCard icon={BadgeIndianRupee} label="Other online" value={money(totals.otherOnlineCollectedPaise)} note="Wallet, netbanking or not identified" tint="blue" />
        <StatCard icon={BadgeIndianRupee} label="COD collected" value={money(totals.cashCollectedPaise)} note="Cash collection recorded" tint="blue" />
        <StatCard icon={Users} label="Customers" value={dashboard?.customerCount ?? "—"} note="Registered customer accounts" tint="blue" />
        <StatCard icon={BadgeIndianRupee} label="GST collected" value={money(totals.totalGstCollectedPaise)} note="On received orders" tint="blue" />
        <StatCard icon={Clock3} label="Payment pending" value={pipeline.paymentPendingOrders ?? "—"} note="Awaiting online payment" tint="amber" />
        <StatCard icon={Package} label="Being prepared" value={pipeline.processingOrders ?? "—"} note={`${pipeline.ordersReadyToShip ?? 0} ready to ship`} tint="blue" />
        <StatCard icon={Truck} label="In transit" value={pipeline.ordersInTransit ?? "—"} note={`${pipeline.deliveredOrders ?? 0} delivered`} tint="rose" />
        <StatCard icon={ShoppingBag} label="Recent orders" value={loading ? "…" : String(orders.length)} note={`${pipeline.cancelledOrders ?? 0} cancelled`} tint="blue" />
        <StatCard icon={Boxes} label="Low stock" value={dashboard?.lowStockAlerts?.length ?? "—"} note="Products at five units or less" tint="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <section className="admin-panel">
          <div className="flex items-start justify-between">
            <div><h2 className="admin-section-title">A little look at the ledger</h2><p className="mt-1 text-xs text-slate-500">Daily collections in the selected date range; refunds are tied to the original collection date.</p></div>
            <Activity size={18} className="text-violet-600" />
          </div>
          {(dashboard?.salesByDate || []).length ? (
            <div className="mt-8 flex h-48 items-end gap-2 sm:gap-3">
              {dashboard.salesByDate.slice(-14).map((day) => (
                <div key={day.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="relative w-full rounded-t-md bg-violet-200 transition group-hover:bg-violet-500" style={{ height: `${Math.max(4, (day.grossPaise / maxSales) * 100)}%` }} title={`${day.date}: ${money(day.grossPaise)}`} />
                  <span className="text-[9px] text-slate-400">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <div className="mt-8 flex h-48 flex-col items-center justify-center rounded-xl bg-slate-50 text-center"><BadgeIndianRupee size={22} className="text-slate-300" /><p className="mt-2 text-sm text-slate-500">Sales will appear as orders come in.</p></div>}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Net collected</p><p className="mt-1 text-sm font-semibold">{money(totals.netSalesPaise)}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Refunded</p><p className="mt-1 text-sm font-semibold">{money(totals.totalRefundsPaise)}</p></div>
          </div>
        </section>
        <section className="admin-panel">
          <div className="flex items-center justify-between"><div><h2 className="admin-section-title">Stock whispers</h2><p className="mt-1 text-xs text-slate-500">Products that need a restock</p></div><Boxes size={18} className="text-amber-600" /></div>
          <div className="mt-5 space-y-3">
            {(dashboard?.lowStockAlerts || []).slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50/70 px-3 py-3">
                <p className="truncate text-xs font-semibold text-slate-700">{product.name}</p>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">{product.stock ?? 0} left</span>
              </div>
            ))}
            {!dashboard?.lowStockAlerts?.length && <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center text-xs text-emerald-800">All listed products have comfortable stock.</div>}
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <div className="mb-4"><h2 className="admin-section-title">Collections by date</h2><p className="mt-1 text-xs text-slate-500">Razorpay card, UPI and other online payments are separated from COD. Older online orders without saved method details appear under other online.</p></div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Card</th><th>UPI</th><th>Other online</th><th>Cash on delivery</th><th>Total</th></tr></thead>
            <tbody>
              {(dashboard?.salesByDate || []).map((day) => (
                <tr key={day.date}><td>{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN")}</td><td>{money(day.onlineCardCollectedPaise)}</td><td>{money(day.onlineUpiCollectedPaise)}</td><td>{money(day.otherOnlineCollectedPaise)}</td><td>{money(day.cashCollectedPaise)}</td><td className="font-semibold">{money(day.totalCollectedPaise)}</td></tr>
              ))}
              {!dashboard?.salesByDate?.length && <tr><td colSpan="6" className="py-8 text-center text-slate-500">No collections in this date range.</td></tr>}
            </tbody>
          </table>
        </div>
        {pipeline.codCollectionPendingOrders > 0 && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">{pipeline.codCollectionPendingOrders} delivered COD order(s) still need cash collection recorded.</p>}
      </section>

      <section className="admin-panel">
        <div className="mb-4"><h2 className="admin-section-title">Top-selling products</h2><p className="mt-1 text-xs text-slate-500">All-time units and order-item value.</p></div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Units sold</th><th>Order-item value</th></tr></thead>
            <tbody>
              {(dashboard?.topSellingProducts || []).map((product) => (
                <tr key={product.productId}><td className="font-semibold">{product.productName}</td><td>{product.unitsSold}</td><td>{money(product.revenuePaise)}</td></tr>
              ))}
              {!dashboard?.topSellingProducts?.length && <tr><td colSpan="3" className="py-8 text-center text-slate-500">Product sales will appear as confirmed orders come in.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="admin-section-title">Latest little happenings</h2><p className="mt-1 text-xs text-slate-500">Search order IDs, products, customers, and status history.</p></div>
          <label className="admin-search"><Search size={14} /><input aria-label="Search order activity" placeholder="Find an order, customer or product" maxLength={100} value={activitySearch} onChange={(event) => onActivitySearch(event.target.value)} /></label>
        </div>
        {activityLoading ? <p className="py-8 text-center text-xs text-slate-500">Searching order activity…</p> : activities.length ? (
          <div className="divide-y divide-slate-100">
            {activities.map((order) => (
              <div key={order.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><ShoppingBag size={14} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold">{order.recipientName} · {order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`}</p><p className="mt-1 truncate text-[10px] text-slate-500">{order.user?.email || order.phone} · {order.items?.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</p><p className="mt-1 truncate text-[10px] text-slate-400">{order.paymentMethod === "COD" ? "Cash on delivery" : `${order.paymentInstrument || "Online"}${order.paymentReference ? ` · ${order.paymentReference}` : ""}`}</p></div></div>
                  <div className="text-right"><p className="text-xs font-semibold">{money(order.totalAmountPaise)}</p><p className="mt-1 text-[10px] text-slate-400">{order.status} · {new Date(order.createdAt).toLocaleString("en-IN")}</p></div>
                </div>
                {order.events?.length > 0 && <details className="ml-11 mt-2"><summary className="cursor-pointer text-[10px] font-semibold text-violet-700">Order timeline · {order.events.length} events</summary><ol className="mt-2 space-y-1.5 border-l border-violet-100 pl-3">{order.events.map((event) => <li key={event.id} className="text-[10px] leading-4 text-slate-500"><strong>{event.status.replaceAll("_", " ")}</strong> · {event.message} · {new Date(event.createdAt).toLocaleString("en-IN")}</li>)}</ol></details>}
              </div>
            ))}
          </div>
        ) : <p className="py-8 text-center text-xs text-slate-500">{activitySearch.trim() ? "No orders match this search." : "Order activity will show up here."}</p>}
      </section>
    </div>
  );
}

function AnalyticsManager({ initialFrom, initialTo, onOpenOrder }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!from || !to || from > to) {
      setError("Choose a valid date range.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        from,
        to,
        page: String(page),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setReport(await api(`/admin/analytics?${query}`));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [from, page, search, to]);

  useEffect(() => {
    const timer = window.setTimeout(loadReport, 200);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const totals = report?.totals || {};
  const categories = [
    { key: "cashPaise", label: "Cash / COD", color: "bg-emerald-500" },
    { key: "upiPaise", label: "UPI", color: "bg-violet-500" },
    { key: "cardPaise", label: "Card", color: "bg-blue-500" },
    { key: "bankPaise", label: "Netbanking / wallet", color: "bg-amber-500" },
    { key: "otherOnlinePaise", label: "Other online", color: "bg-slate-400" },
  ];
  const maxCollection = Math.max(1, ...categories.map(({ key }) => totals[key] || 0));
  const daily = report?.daily || [];
  const maxDaily = Math.max(1, ...daily.flatMap((item) => [
    item.grossCollectedPaise || 0,
    item.refundedPaise || 0,
    item.netCollectedPaise || 0,
  ]));
  const minDaily = Math.min(0, ...daily.map((item) => item.netCollectedPaise || 0));
  const linePoints = (key) => daily.map((item, index) => {
    const x = daily.length < 2 ? 50 : 8 + (index / (daily.length - 1)) * 84;
    const y = 90 - (((item[key] || 0) - minDaily) / (maxDaily - minDaily)) * 78;
    return `${x},${y}`;
  }).join(" ");

  function transactionLabel(type) {
    if (type === "PAYMENT_CONFIRMED") return "Online payment";
    if (type === "COD_COLLECTED") return "Cash collected";
    if (type === "REFUND_INITIATED" || type === "PAYMENT_REFUNDED") return "Refund";
    return "Order cancelled";
  }

  function paymentLabel(transaction) {
    if (transaction.paymentMethod === "COD") return "Cash";
    const instrument = transaction.paymentInstrument?.toLowerCase();
    if (instrument === "upi") return "UPI";
    if (instrument === "card") return "Card";
    if (instrument === "netbanking") return "Netbanking";
    if (instrument === "wallet") return "Wallet";
    return transaction.paymentMethod || "Online";
  }

  return (
    <div className="space-y-5">
      <section className="admin-panel flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="admin-section-title">Payment and order analytics</h2>
          <p className="mt-1 text-xs text-slate-500">Collections, refunds, and cancellations by event date. All dates use India time.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-semibold text-slate-500">From<input className="admin-input mt-1 block h-9" type="date" value={from} max={to} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
          <label className="text-[10px] font-semibold text-slate-500">To<input className="admin-input mt-1 block h-9" type="date" value={to} min={from} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
          <button type="button" className="admin-secondary h-9" onClick={loadReport} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </section>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BadgeIndianRupee} label="Gross collected" value={money(totals.grossCollectedPaise)} note={`${totals.paymentCount || 0} successful payments`} tint="blue" />
        <StatCard icon={BadgeIndianRupee} label="Refunded" value={money(totals.refundedPaise)} note={`${totals.refundCount || 0} refund events`} tint="rose" />
        <StatCard icon={ShoppingBag} label="Cancelled order value" value={money(totals.cancelledPaise)} note={`${totals.cancelledCount || 0} cancelled orders`} tint="amber" />
        <StatCard icon={BadgeIndianRupee} label="Net collected" value={money(totals.netCollectedPaise)} note="Gross collections less refunds" tint="violet" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="admin-panel">
          <div className="flex items-center justify-between"><div><h2 className="admin-section-title">Collections by payment method</h2><p className="mt-1 text-xs text-slate-500">Cash, UPI, card, bank, and other payments</p></div><BarChart3 size={18} className="text-violet-600" /></div>
          <div className="mt-6 space-y-4">
            {categories.map(({ key, label, color }) => (
              <div key={key}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-medium text-slate-600">{label}</span><span className="font-semibold text-slate-800">{money(totals[key])}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, ((totals[key] || 0) / maxCollection) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="flex items-center justify-between"><div><h2 className="admin-section-title">Daily payment trend</h2><p className="mt-1 text-xs text-slate-500">Daily gross, refunds, and net collection</p></div><LineChart size={18} className="text-violet-600" /></div>
          {daily.length ? (
            <div className="mt-5">
              <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-600" />Gross</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" />Refunds</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />Net</span>
              </div>
              <div className="mt-3 overflow-hidden">
                <svg viewBox="0 0 100 100" className="h-48 w-full" role="img" aria-label="Daily gross collections, refunds, and net collections line chart" preserveAspectRatio="none">
                  {[12, 38, 64, 90].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} stroke="#eeeaf2" strokeWidth=".5" />)}
                  <polyline points={linePoints("grossCollectedPaise")} fill="none" stroke="#7c3aed" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  <polyline points={linePoints("refundedPaise")} fill="none" stroke="#f43f5e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  <polyline points={linePoints("netCollectedPaise")} fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="flex justify-between text-[9px] text-slate-400"><span>{daily[0]?.date}</span><span>{daily[Math.floor(daily.length / 2)]?.date}</span><span>{daily[daily.length - 1]?.date}</span></div>
              </div>
            </div>
          ) : <p className="py-12 text-center text-xs text-slate-500">{loading ? "Loading payment activity…" : "No payment activity in this date range."}</p>}
        </section>
      </div>

      <section className="admin-panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="admin-section-title">Payment and order timeline</h2><p className="mt-1 text-xs text-slate-500">Each collection, refund, and cancellation is linked to its order.</p></div>
          <label className="admin-search"><Search size={14} /><input aria-label="Search analytics transactions" placeholder="Search order, customer or payment" maxLength={100} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Date / time</th><th>Activity</th><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Details</th></tr></thead>
            <tbody>
              {(report?.transactions || []).map((transaction) => {
                const isRefund = ["REFUND_INITIATED", "PAYMENT_REFUNDED"].includes(transaction.type);
                const isCancelled = transaction.type === "ORDER_CANCELLED";
                return (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap">{new Date(transaction.createdAt).toLocaleString("en-IN")}</td>
                    <td><span className={`admin-stock ${isRefund ? "admin-analytics-refund" : isCancelled ? "admin-stock-low" : ""}`}>{transactionLabel(transaction.type)}</span></td>
                    <td>{transaction.order ? <button type="button" className="font-semibold text-violet-700 hover:underline" onClick={() => onOpenOrder(transaction.order)}>{transaction.order.orderNumber || `#${transaction.order.id.slice(-8).toUpperCase()}`}</button> : "—"}</td>
                    <td>{transaction.order?.recipientName || "—"}</td>
                    <td>{paymentLabel(transaction)}{transaction.order?.paymentId && <p className="mt-1 text-[10px] text-slate-400">{transaction.order.paymentId}</p>}</td>
                    <td className={`whitespace-nowrap font-semibold ${isRefund ? "text-rose-700" : isCancelled ? "text-amber-700" : "text-slate-800"}`}>{isRefund ? "−" : isCancelled ? "" : "+"}{money(transaction.amountPaise)}</td>
                    <td className="max-w-64 text-slate-500">{transaction.message}</td>
                  </tr>
                );
              })}
              {!loading && !report?.transactions?.length && <tr><td colSpan="7" className="py-10 text-center text-slate-500">No payment or order events match this search.</td></tr>}
              {loading && <tr><td colSpan="7" className="py-8 text-center text-slate-500">Loading analytics…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{report?.pagination?.total || 0} events · page {report?.pagination?.page || page} of {Math.max(1, report?.pagination?.totalPages || 1)}</span>
          <div className="flex gap-2">
            <button type="button" className="admin-secondary" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <button type="button" className="admin-secondary" disabled={loading || page >= (report?.pagination?.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CustomerTable({ customers, pagination, loading, search, onSearch, onPageChange }) {
  return (
    <section className="admin-panel">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="admin-section-title">Customer directory</h2>
          <p className="mt-1 text-xs text-slate-500">
            {pagination.total ?? 0} registered customers · newest accounts first
          </p>
        </div>
        <label className="admin-search"><Search size={14} /><input aria-label="Search customers" placeholder="Find by name, email or mobile" value={search} onChange={(event) => onSearch(event.target.value)} /></label>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Mobile</th><th>Email</th><th>Orders</th><th>Joined</th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td><p className="font-semibold text-slate-800">{customer.name || "Customer"}</p><p className="mt-1 text-[10px] text-slate-400">{customer.id.slice(-8)}</p></td>
                <td>{customer.mobile || "—"}</td>
                <td>{customer.email || "—"}</td>
                <td>{customer._count?.orders ?? 0}</td>
                <td>{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {!loading && !customers.length && <tr><td colSpan="5" className="py-10 text-center text-slate-500">No customers match this search.</td></tr>}
            {loading && <tr><td colSpan="5" className="py-10 text-center text-slate-500">Loading customers…</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>Page {pagination.page || 1} of {Math.max(1, pagination.totalPages || 1)}</span>
        <div className="flex gap-2">
          <button type="button" className="admin-secondary" disabled={loading || (pagination.page || 1) <= 1} onClick={() => onPageChange((pagination.page || 1) - 1)}>Previous</button>
          <button type="button" className="admin-secondary" disabled={loading || (pagination.page || 1) >= (pagination.totalPages || 1)} onClick={() => onPageChange((pagination.page || 1) + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}

function InventoryManager({ products, onUpdated }) {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMovements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(page),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const result = await api(`/admin/inventory/movements?${query}`);
      setMovements(result.movements || []);
      setPagination(result.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadMovements, 200);
    return () => window.clearTimeout(timer);
  }, [loadMovements]);

  async function restock(event) {
    event.preventDefault();
    if (!productId) {
      setError("Choose a product to receive into stock.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(`/admin/products/${productId}/restock`, {
        method: "POST",
        body: {
          quantity: Number(quantity),
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        },
      });
      setNotice(result.message);
      setQuantity("");
      setReference("");
      setNote("");
      await Promise.all([loadMovements(), onUpdated()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="admin-panel">
        <div className="mb-5">
          <h2 className="admin-section-title">Receive stock</h2>
          <p className="mt-1 text-xs text-slate-500">Record incoming product quantities with a supplier or delivery reference.</p>
        </div>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={restock}>
          <label><span className="admin-label">Product</span><select className="admin-input" value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.availableStock ?? product.stock ?? product.quantity ?? 0} in stock</option>)}</select></label>
          <label><span className="admin-label">Quantity received</span><input className="admin-input" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label><span className="admin-label">Supplier / receipt reference</span><input className="admin-input" value={reference} maxLength={100} onChange={(event) => setReference(event.target.value)} placeholder="Invoice or delivery note" /></label>
          <label><span className="admin-label">Note <span className="font-normal text-slate-400">(optional)</span></span><input className="admin-input" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Batch, condition, etc." /></label>
          <button type="submit" className="admin-primary sm:col-span-2 lg:col-span-4 lg:justify-self-start" disabled={busy || products.length === 0}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} Record incoming stock</button>
        </form>
        {(error || notice) && <p className={`mt-4 rounded-xl px-4 py-3 text-xs ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"}>{error || notice}</p>}
      </section>

      <section className="admin-panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="admin-section-title">Incoming and outgoing history</h2><p className="mt-1 text-xs text-slate-500">Order dispatch, cancellations, stock receipts, and manual count adjustments.</p></div>
          <label className="admin-search"><Search size={14} /><input aria-label="Search stock movement history" placeholder="Search product, order or reference" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Movement</th><th>Product</th><th>Qty</th><th>Stock before → after</th><th>Order / received from</th><th>Note</th></tr></thead>
            <tbody>
              {movements.map((movement) => {
                const incoming = ["OPENING_STOCK", "RESTOCK_IN", "MANUAL_IN", "CANCELLATION_RETURN"].includes(movement.type);
                return (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap">{new Date(movement.createdAt).toLocaleString("en-IN")}</td>
                    <td><span className={`admin-stock ${incoming ? "" : "admin-stock-low"}`}>{movement.type.replaceAll("_", " ")}</span></td>
                    <td className="font-semibold">{movement.product?.name || "Removed product"}</td>
                    <td className={incoming ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{incoming ? "+" : "−"}{movement.quantity}</td>
                    <td>{movement.stockBefore} → {movement.stockAfter}</td>
                    <td>{movement.order ? <><span className="font-semibold">{movement.order.orderNumber || `#${movement.order.id.slice(-8)}`}</span><p className="mt-1 text-[10px] text-slate-400">{movement.order.recipientName}</p></> : movement.reference || "—"}</td>
                    <td className="max-w-56 text-slate-500">{movement.note || movement.reference || "—"}</td>
                  </tr>
                );
              })}
              {!loading && movements.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-slate-500">No stock movements match this search.</td></tr>}
              {loading && <tr><td colSpan="7" className="py-8 text-center text-slate-500">Loading stock history…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>{pagination.total || 0} stock movements · page {pagination.page || 1} of {Math.max(1, pagination.totalPages || 1)}</span>
          <div className="flex gap-2">
            <button type="button" className="admin-secondary" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <button type="button" className="admin-secondary" disabled={loading || page >= (pagination.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: "",
    minOrder: "0",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
    isVisible: true,
  });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api("/admin/coupons");
      setCoupons(result.coupons || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  async function createCoupon(event) {
    event.preventDefault();
    setBusyId("new");
    setError("");
    setNotice("");
    try {
      await api("/admin/coupons", {
        method: "POST",
        body: {
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: form.type === "FLAT" ? Math.round(Number(form.value) * 100) : Number(form.value),
          minOrderPaise: Math.round(Number(form.minOrder || 0) * 100),
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          isActive: form.isActive,
          isVisible: form.isVisible,
        },
      });
      setForm({
        code: "",
        type: "PERCENT",
        value: "",
        minOrder: "0",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
        isVisible: true,
      });
      setNotice("Coupon added to the database.");
      await loadCoupons();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function updateCoupon(coupon, changes, label) {
    setBusyId(coupon.id);
    setError("");
    setNotice("");
    try {
      await api(`/admin/coupons/${coupon.id}`, { method: "PUT", body: changes });
      setNotice(`${coupon.code} ${label}.`);
      await loadCoupons();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-5">
      <section className="admin-panel">
        <div className="mb-5">
          <h2 className="admin-section-title">Create a coupon</h2>
          <p className="mt-1 text-xs text-slate-500">Hidden coupons remain valid when you share their code directly.</p>
        </div>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={createCoupon}>
          <label><span className="admin-label">Coupon code</span><input className="admin-input uppercase" value={form.code} maxLength={32} pattern="[A-Za-z0-9_-]{2,32}" onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="WELCOME10" required /></label>
          <label><span className="admin-label">Discount type</span><select className="admin-input" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, value: "" }))}><option value="PERCENT">Percentage</option><option value="FLAT">Fixed amount (₹)</option></select></label>
          <label><span className="admin-label">{form.type === "PERCENT" ? "Discount (%)" : "Discount (₹)"}</span><input className="admin-input" type="number" min={form.type === "PERCENT" ? 1 : 0.01} max={form.type === "PERCENT" ? 100 : undefined} step={form.type === "PERCENT" ? "1" : "0.01"} value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} required /></label>
          <label><span className="admin-label">Minimum order (₹)</span><input className="admin-input" type="number" min="0" step="0.01" value={form.minOrder} onChange={(event) => setForm((current) => ({ ...current, minOrder: event.target.value }))} /></label>
          <label><span className="admin-label">Usage limit <span className="font-normal text-slate-400">(optional)</span></span><input className="admin-input" type="number" min="1" step="1" value={form.usageLimit} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))} placeholder="Unlimited" /></label>
          <label><span className="admin-label">Expiry <span className="font-normal text-slate-400">(optional)</span></span><input className="admin-input" type="datetime-local" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} /></label>
          <div className="flex flex-wrap gap-5 sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active and redeemable</label>
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm((current) => ({ ...current, isVisible: event.target.checked }))} /> Show in checkout offers</label>
          </div>
          <button type="submit" className="admin-primary sm:col-span-2 lg:col-span-3 lg:justify-self-start" disabled={busyId === "new"}>{busyId === "new" ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} Add coupon</button>
        </form>
        {(error || notice) && <p className={`mt-4 rounded-xl px-4 py-3 text-xs ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"}>{error || notice}</p>}
      </section>

      <section className="admin-panel">
        <div className="mb-4"><h2 className="admin-section-title">Saved coupons</h2><p className="mt-1 text-xs text-slate-500">Each coupon can be paused or hidden from the automatic offers list independently.</p></div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Usage</th><th>Active</th><th>Visible to customers</th></tr></thead>
            <tbody>
              {coupons.map((coupon) => {
                const isVisible = coupon.isVisible !== false;
                return (
                  <tr key={coupon.id}>
                    <td><span className="font-semibold">{coupon.code}</span>{coupon.expiresAt && <p className="mt-1 text-[10px] text-slate-400">Expires {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}</p>}</td>
                    <td>{coupon.type === "PERCENT" ? `${coupon.value}%` : money(coupon.value)}<p className="mt-1 text-[10px] text-slate-400">Min. {money(coupon.minOrderPaise)}</p></td>
                    <td>{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / unlimited"}</td>
                    <td><button type="button" className={`admin-mini-action ${coupon.isActive ? "text-emerald-700" : "text-slate-500"}`} disabled={busyId === coupon.id} onClick={() => updateCoupon(coupon, { isActive: !coupon.isActive }, coupon.isActive ? "paused" : "activated")}>{coupon.isActive ? "Active" : "Paused"}</button></td>
                    <td><button type="button" className={`admin-mini-action ${isVisible ? "text-violet-700" : "text-slate-500"}`} disabled={busyId === coupon.id} onClick={() => updateCoupon(coupon, { isVisible: !isVisible }, isVisible ? "hidden from offers" : "shown in offers")}>{isVisible ? "Shown" : "Hidden"}</button></td>
                  </tr>
                );
              })}
              {!loading && coupons.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No coupons yet. Create one above.</td></tr>}
              {loading && <tr><td colSpan="5" className="py-8 text-center text-slate-500">Loading coupons…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DeliverySettings({ onSettingsSaved }) {
  const [settings, setSettings] = useState(null);
  const [shipping, setShipping] = useState("");
  const [cod, setCod] = useState("");
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function settingsErrorMessage(requestError) {
    return requestError.status === 404
      ? "The delivery-settings API is missing on this backend. Restart the backend from this project or deploy the updated backend, then try again."
      : requestError.message;
  }

  useEffect(() => {
    let active = true;
    api("/admin/store-settings")
      .then((result) => {
        if (!active) return;
        setSettings(result.settings);
        setShipping((result.settings.shippingChargePaise / 100).toFixed(2));
        setCod((result.settings.codChargePaise / 100).toFixed(2));
        setBrandName(result.settings.brandName);
        setLogoUrl(result.settings.logoUrl);
      })
      .catch((requestError) => { if (active) setError(settingsErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api("/admin/store-settings", {
        method: "PUT",
        body: {
          shippingChargePaise: Math.round(Number(shipping) * 100),
          codChargePaise: Math.round(Number(cod) * 100),
          brandName,
          logoUrl,
        },
      });
      setSettings(result.settings);
      onSettingsSaved(result.settings);
      setNotice("Store settings saved. The new branding is now live across the shop.");
    } catch (requestError) {
      setError(settingsErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-panel max-w-3xl">
      <div className="mb-6">
        <h2 className="admin-section-title">Store and delivery settings</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Branding is shared across the storefront and order communications. Delivery amounts apply to new orders; existing orders keep their original totals.</p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Loading store settings...</div>
      ) : (
        <form className="space-y-5" onSubmit={save}>
          <div>
            <h3 className="admin-label">Store branding</h3>
            <p className="mt-1 text-[10px] text-slate-400">This name and logo appear on the storefront, admin dashboard, checkout, and customer emails.</p>
          </div>
          <label className="block"><span className="admin-label">Store name</span><input className="admin-input max-w-sm" type="text" maxLength="80" value={brandName} onChange={(event) => setBrandName(event.target.value)} required /></label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-0 flex-1"><span className="admin-label">Logo image URL (HTTPS)</span><input className="admin-input max-w-xl" type="url" maxLength="2048" placeholder="https://example.com/logo.png" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} /><span className="mt-1 block text-[10px] text-slate-400">Use a public HTTPS image URL. Leave empty to use the default icon.</span></label>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-violet-700">
              {logoUrl ? <img src={logoUrl} alt="Store logo preview" className="h-full w-full object-contain" /> : <Sparkles size={22} />}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <h3 className="admin-label">Delivery charges</h3>
            <p className="mt-1 text-[10px] text-slate-400">Amounts apply to new orders. Existing orders keep their original totals.</p>
          </div>
          <label className="block"><span className="admin-label">Shipping charge (₹)</span><input className="admin-input max-w-sm" type="number" min="0" step="0.01" value={shipping} onChange={(event) => setShipping(event.target.value)} required /><span className="mt-1 block text-[10px] text-slate-400">Current free-shipping threshold remains ₹999 merchandise value after discount.</span></label>
          <label className="block"><span className="admin-label">Cash-on-delivery fee (₹)</span><input className="admin-input max-w-sm" type="number" min="0" step="0.01" value={cod} onChange={(event) => setCod(event.target.value)} required /><span className="mt-1 block text-[10px] text-slate-400">This fee is added to COD orders only; prepaid orders do not include it.</span></label>
          <button type="submit" className="admin-primary" disabled={busy || !settings}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} Save store settings</button>
        </form>
      )}
      {(error || notice) && <p className={`mt-4 rounded-xl px-4 py-3 text-xs ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"}>{error || notice}</p>}
    </section>
  );
}

export default function AdminApp() {
  const [brand, setBrand] = useStoreBranding();
  const [user, setUser] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activityOrders, setActivityOrders] = useState([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);
  const [orderPagination, setOrderPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [orderPage, setOrderPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersLoading, setCustomersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reportFrom, setReportFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return dateInputValue(date);
  });
  const [reportTo, setReportTo] = useState(() => dateInputValue(new Date()));
  const [productEditor, setProductEditor] = useState(undefined);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const loadOrders = useCallback(async () => {
    const query = new URLSearchParams({
      page: String(orderPage),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    });
    try {
      const result = await api(`/admin/orders?${query}`);
      setOrders(result.orders || []);
      setOrderPagination(result.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        setUser(null);
        setSessionExpiresAt(null);
        setAuthMessage("Your administrator session expired. Please sign in again.");
      }
    }
  }, [orderPage, search, statusFilter]);

  const loadActivityOrders = useCallback(async () => {
    setActivityLoading(true);
    try {
      const query = new URLSearchParams({
        page: "1",
        ...(activitySearch.trim() ? { search: activitySearch.trim() } : {}),
      });
      const result = await api(`/admin/orders?${query}`);
      setActivityOrders(result.orders || []);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        setUser(null);
        setSessionExpiresAt(null);
        setAuthMessage("Your administrator session expired. Please sign in again.");
      }
    } finally {
      setActivityLoading(false);
    }
  }, [activitySearch]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const [dashboardResult, productsResult] = await Promise.all([
        api(`/admin/dashboard?${new URLSearchParams({ from: reportFrom, to: reportTo })}`),
        api("/user/products"),
      ]);
      setDashboard(dashboardResult);
      setProducts(productsResult.products || []);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        setUser(null);
        setSessionExpiresAt(null);
        setAuthMessage("Your administrator session expired. Please sign in again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportFrom, reportTo]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(loadOrders, 250);
    return () => window.clearTimeout(timer);
  }, [loadOrders, user]);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(customerPage),
        ...(customerSearch.trim() ? { search: customerSearch.trim() } : {}),
      });
      const result = await api(`/admin/customers?${query}`);
      setCustomers(result.customers || []);
      setCustomerPagination(result.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        setUser(null);
        setSessionExpiresAt(null);
        setAuthMessage("Your administrator session expired. Please sign in again.");
      }
    } finally {
      setCustomersLoading(false);
    }
  }, [customerPage, customerSearch]);

  useEffect(() => {
    let active = true;
    api("/admin/me")
      .then((session) => {
        if (!active) return;
        if (session.user?.role !== "ADMIN") {
          setUser(null);
          setError("Administrator access is required.");
          setCheckingSession(false);
          return;
        }
        setUser(session.user);
        setSessionExpiresAt(session.expiresAt);
        setLoading(true);
        setCheckingSession(false);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setCheckingSession(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user || activeTab !== "customers") return undefined;
    const timer = window.setTimeout(loadCustomers, 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadCustomers, user]);

  useEffect(() => {
    if (!user || activeTab !== "overview") return undefined;
    const timer = window.setTimeout(loadActivityOrders, 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadActivityOrders, user]);

  useEffect(() => {
    if (!user || !sessionExpiresAt) return undefined;
    const timer = window.setTimeout(() => {
      setUser(null);
      setSessionExpiresAt(null);
      setDashboard(null);
      setOrders([]);
      setActivityOrders([]);
      setProducts([]);
      setCustomers([]);
      setAuthMessage("Your 7-day administrator session expired. Please sign in again.");
    }, Math.max(0, sessionExpiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [sessionExpiresAt, user]);

  useEffect(() => {
    if (user) refresh();
  }, [refresh, user]);

  const filteredOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesSearch = !normalized || [
        order.id,
        order.orderNumber,
        order.recipientName,
        order.phone,
        order.user?.name,
        order.user?.email,
        ...(order.items || []).map((item) => item.productName),
      ].filter(Boolean).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return products.filter((product) => !normalized || `${product.name} ${product.category || ""}`.toLowerCase().includes(normalized));
  }, [products, search]);

  async function saveProduct(body, productId) {
    await api(productId ? `/admin/products/${productId}` : "/admin/products", {
      method: productId ? "PUT" : "POST",
      body,
    });
    setNotice(productId ? "Product updated." : "New product added to the shop.");
    await refresh();
  }

  async function removeProduct(product) {
    if (!window.confirm(`Remove "${product.name}" from the storefront?`)) return;
    setBusyId(product.id);
    setError("");
    try {
      await api(`/admin/products/${product.id}`, { method: "DELETE" });
      setNotice("Product removed from the storefront.");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function updateStock(product, stock) {
    setBusyId(product.id);
    setError("");
    try {
      await api(`/admin/products/${product.id}/stock`, {
        method: "PATCH",
        body: { stock },
      });
      setNotice("Inventory updated.");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function updateOrderStatus(order, status, shipment = {}) {
    setBusyId(order.id);
    setError("");
    try {
      if (status === "COLLECT_COD") {
        const result = await api(`/admin/orders/${order.id}/collection`, { method: "PATCH", body: {} });
        setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
        setNotice(`${money(order.totalAmountPaise)} marked as cash collected.`);
        await refresh();
        await loadOrders();
        return;
      }
      await api(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: { status, ...shipment },
      });
      setNotice(`Order marked ${status.toLowerCase()}.`);
      await refresh();
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function refundOrder(order, body) {
    setBusyId(order.id);
    setError("");
    try {
      await api(`/admin/orders/${order.id}/refund`, { method: "POST", body });
      setNotice("Refund request was sent to Razorpay.");
      await refresh();
      await loadOrders();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function cancelAdminOrder(order) {
    const shouldRefund = order.status === "PAID";
    const prompt = shouldRefund
      ? "Cancel this entire order and request a full Razorpay refund?"
      : "Cancel this entire order and return its reserved stock?";
    if (!window.confirm(prompt)) return;
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      const result = await api(`/admin/orders/${order.id}/cancel`, {
        method: "POST",
        body: {},
      });
      setNotice(result.message);
      await Promise.all([loadOrders(), refresh()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      setSessionExpiresAt(null);
      window.location.assign("/");
    } catch (requestError) {
      setError(`Could not complete sign out: ${requestError.message}`);
    }
  }

  if (checkingSession) {
    return <div className="admin-loading"><LoaderCircle className="animate-spin text-violet-600" /><span>Opening your private shop...</span></div>;
  }

  if (!user) return <AdminSignIn initialMessage={authMessage} onSignedIn={(result) => { setUser(result.user); setSessionExpiresAt(result.expiresAt); setAuthMessage(""); setError(""); setLoading(true); }} />;

  const currentTab = navigation.find((item) => item.key === activeTab)?.label || "Overview";

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <StoreLogo logoUrl={brand.logoUrl} className="admin-brand-icon" />
          <span><strong>{brand.brandName}</strong><small>STOREKEEPER’S DESK</small></span>
        </a>
        <div className="admin-store-chip"><span className="admin-live-dot" /> Store workspace <ChevronRight size={14} /></div>
        <p className="admin-nav-caption">MANAGE YOUR MAGIC</p>
        <nav className="space-y-1">
          {navigation.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" className={`admin-nav-item ${activeTab === key ? "admin-nav-active" : ""}`} onClick={() => { setActiveTab(key); setSearch(""); if (key === "customers") setCustomerPage(1); }}>
              <Icon size={17} /> {label} {key === "orders" && orders.filter((order) => ["CONFIRMED", "PAID"].includes(order.status)).length > 0 && <span className="admin-nav-count">{orders.filter((order) => ["CONFIRMED", "PAID"].includes(order.status)).length}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-spacer" />
        <div className="admin-sidebar-note"><Sparkles size={16} /><p>A small reminder: every order is a little bit of magic someone picked for themselves.</p></div>
        <div className="admin-profile">
          <div className="admin-avatar">{(user.name || "A").slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{user.name || "Store admin"}</p><p className="text-[10px] text-white/45">Administrator</p></div>
          <button type="button" className="admin-signout" onClick={signOut} title="Sign out"><LogOut size={15} /></button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-3">
            <a href="/" className="admin-mobile-brand"><StoreLogo logoUrl={brand.logoUrl} className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-violet-100 text-violet-700" /> {brand.brandName}</a>
            <span className="hidden text-xs text-slate-400 sm:inline">Store /</span>
            <span className="text-xs font-semibold text-slate-700">{currentTab}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-800 sm:inline-flex"><span className="admin-live-dot" /> Online</span>
            <button type="button" className="admin-icon-button" onClick={() => { refresh(); loadOrders(); }} disabled={refreshing} title="Refresh data"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
            <a href="/" className="admin-view-shop"><ArrowUpRightIcon /> View shop</a>
          </div>
        </header>

        <div className="admin-content">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="admin-eyebrow">{activeTab === "overview" ? "YOUR STORE, AT A GLANCE" : activeTab === "analytics" ? "FOLLOW EVERY RUPEE AND ORDER" : activeTab === "orders" ? "FULFILL EVERY GOOD THING" : activeTab === "customers" ? "KNOW YOUR COMMUNITY" : activeTab === "coupons" ? "OFFERS FOR YOUR CUSTOMERS" : activeTab === "delivery" ? "SET YOUR STORE CHARGES" : activeTab === "inventory" ? "FOLLOW EACH UNIT IN AND OUT" : "KEEP YOUR COLLECTION FRESH"}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.06em] text-slate-900 sm:text-4xl">{activeTab === "overview" ? `A little magic, ${user.name?.split(" ")[0] || "keeper"}.` : currentTab}</h1>
              <p className="mt-2 text-xs leading-5 text-slate-500">{activeTab === "overview" ? "Reports, collections, stock alerts, and recent activity." : activeTab === "analytics" ? "Explore payment methods, collected cash, refunds, cancellations, and order timelines." : activeTab === "orders" ? "Review orders, update fulfillment, and download invoices." : activeTab === "customers" ? "Search and browse all registered customers, 50 at a time." : activeTab === "coupons" ? "Create, activate, and choose which coupon codes appear at checkout." : activeTab === "delivery" ? "Update shipping and cash-on-delivery fees for new orders." : activeTab === "inventory" ? "Record supplier deliveries and trace stock out to orders or back from cancellations." : "Add new treasures, update details, and keep an eye on stock."}</p>
            </div>
            {activeTab === "products" && <button type="button" className="admin-primary self-start" onClick={() => setProductEditor(null)}><Plus size={16} /> Add a product</button>}
          </div>

          {(error || notice) && (
            <div className={`mb-5 flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"}>
              <span className="flex items-center gap-2">{error ? <CircleAlert size={16} /> : <Check size={16} />}{error || notice}</span>
              <button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss"><X size={15} /></button>
            </div>
          )}

          {loading && !dashboard ? <div className="admin-panel flex items-center justify-center gap-3 py-20 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Gathering the latest shop activity...</div> : null}
          {!loading && error && !dashboard ? <div className="admin-panel flex flex-col items-center py-16 text-center"><CircleAlert className="text-rose-500" /><p className="mt-3 text-sm font-semibold">Couldn’t load the shop workspace</p><button type="button" className="admin-secondary mt-4" onClick={refresh}>Try again</button></div> : null}
          {dashboard && activeTab === "overview" && <AdminDashboard dashboard={dashboard} orders={orders} activityOrders={activityOrders} activitySearch={activitySearch} activityLoading={activityLoading} loading={loading} reportFrom={reportFrom} reportTo={reportTo} onActivitySearch={setActivitySearch} onDateChange={(field, value) => (field === "from" ? setReportFrom(value) : setReportTo(value))} />}

          {activeTab === "analytics" && <AnalyticsManager initialFrom={reportFrom} initialTo={reportTo} onOpenOrder={(order) => { setSearch(order.orderNumber || order.id); setStatusFilter("ALL"); setOrderPage(1); setActiveTab("orders"); }} />}

          {activeTab === "customers" && <CustomerTable customers={customers} pagination={customerPagination} loading={customersLoading} search={customerSearch} onSearch={(value) => { setCustomerSearch(value); setCustomerPage(1); }} onPageChange={setCustomerPage} />}

          {activeTab === "orders" && (
            <section className="admin-panel">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h2 className="admin-section-title">Order book</h2><p className="mt-1 text-xs text-slate-500">Showing {orders.length} of {orderPagination.total || 0} matching orders · search product names and filter cancelled orders</p></div>
                <div className="flex flex-wrap gap-2">
                  <label className="admin-search"><Search size={14} /><input aria-label="Search orders" placeholder="Find order or product" value={search} onChange={(event) => { setSearch(event.target.value); setOrderPage(1); }} /></label>
                  <select className="admin-filter" aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setOrderPage(1); }}>
                    {["ALL", "PENDING", "CONFIRMED", "PAID", "PROCESSING", "SHIPMENT_PENDING", "SHIPPED", "DELIVERED", "CANCEL_REQUESTED", "CANCELLED", "REFUND_PENDING", "REFUNDED", "PAYMENT_REVIEW", "SHIPMENT_REVIEW"].map((status) => <option key={status} value={status}>{status === "ALL" ? "All statuses" : status.replaceAll("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              {filteredOrders.length ? <div className="space-y-3">{filteredOrders.map((order) => <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatus={updateOrderStatus} onInvoice={(item) => downloadInvoice(item.id, item.invoiceNumber).catch((requestError) => setError(requestError.message))} onRefund={refundOrder} onCancel={cancelAdminOrder} />)}</div> : <div className="py-16 text-center text-sm text-slate-500">No orders match this view.</div>}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Page {orderPagination.page || 1} of {Math.max(1, orderPagination.totalPages || 1)}</span>
                <div className="flex gap-2">
                  <button type="button" className="admin-secondary" disabled={(orderPagination.page || 1) <= 1} onClick={() => setOrderPage((orderPagination.page || 1) - 1)}>Previous</button>
                  <button type="button" className="admin-secondary" disabled={(orderPagination.page || 1) >= (orderPagination.totalPages || 1)} onClick={() => setOrderPage((orderPagination.page || 1) + 1)}>Next</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "products" && (
            <section className="admin-panel">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h2 className="admin-section-title">The collection</h2><p className="mt-1 text-xs text-slate-500">{products.length} active products in the storefront</p></div>
                <label className="admin-search"><Search size={14} /><input aria-label="Search products" placeholder="Find a product" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              </div>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Product</th><th>Category</th><th>Price (incl. GST)</th><th>Available</th><th>Stock update</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stock = product.availableStock ?? product.stock ?? product.quantity ?? 0;
                      const basePrice = product.pricePaise ?? Math.round((product.price || 0) * 100);
                      const grossPrice = basePrice + Math.round(basePrice * (product.gstRate ?? 18) / 100);
                      return (
                        <tr key={product.id}>
                          <td><div className="flex min-w-[190px] items-center gap-3"><div className="admin-product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <Package size={17} />}</div><div><p className="max-w-[200px] truncate text-xs font-semibold text-slate-800">{product.name}</p><p className="mt-1 text-[10px] text-slate-400">{product.id.slice(-7)}</p></div></div></td>
                          <td className="text-xs text-slate-500">{product.category || "Unsorted"}</td>
                          <td className="whitespace-nowrap text-xs font-semibold">{money(grossPrice)}</td>
                          <td><span className={`admin-stock ${stock <= 5 ? "admin-stock-low" : ""}`}>{stock} units</span></td>
                          <td><form className="flex items-center gap-1.5" onSubmit={(event) => { event.preventDefault(); updateStock(product, Number(new FormData(event.currentTarget).get("stock"))); }}><input className="admin-stock-input" type="number" min="0" name="stock" defaultValue={stock} aria-label={`Set stock for ${product.name}`} /><button type="submit" className="admin-mini-button" disabled={busyId === product.id} title="Save stock"><Check size={13} /></button></form></td>
                          <td><div className="flex gap-1"><button type="button" className="admin-mini-action" onClick={() => setProductEditor(product)}>Edit</button><button type="button" className="admin-mini-action text-rose-700" disabled={busyId === product.id} onClick={() => removeProduct(product)}>Remove</button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!filteredProducts.length && <div className="py-12 text-center text-xs text-slate-500">No products match your search.</div>}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-900"><Settings2 size={15} className="mt-0.5 shrink-0" /><span>Product image and video uploads need Cloudinary settings in the backend `.env`. Product details and stock work without media credentials.</span></div>
            </section>
          )}

          {activeTab === "coupons" && <CouponManager />}
          {activeTab === "delivery" && <DeliverySettings onSettingsSaved={(settings) => setBrand({ brandName: settings.brandName, logoUrl: settings.logoUrl })} />}
          {activeTab === "inventory" && <InventoryManager products={products} onUpdated={refresh} />}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-slate-400">
            <span>Administrator workspace · changes are saved to your store database</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Protected by your admin account</span>
          </footer>
        </div>
      </main>
      {productEditor !== undefined && <ProductEditor product={productEditor} onClose={() => setProductEditor(undefined)} onSave={saveProduct} />}
    </div>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={14} className="-rotate-45" />;
}

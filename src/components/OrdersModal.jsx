import { useEffect, useState } from "react";
import { ArrowDownToLine, LoaderCircle, Package, X } from "lucide-react";
import { api, downloadInvoice } from "../api";
import { money } from "./ProductCard";

export default function OrdersModal({ onClose, onCancelled }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    api("/user/orders/my")
      .then((result) => {
        if (active) setOrders(result.orders || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function cancelOrder(orderId) {
    const order = orders.find((item) => item.id === orderId);
    const prompt = order?.status === "PAID"
      ? "Cancel this entire order and request a full Razorpay refund?"
      : "Cancel this entire order? Any reserved stock will be returned.";
    if (!window.confirm(prompt)) return;
    setBusyId(orderId);
    setError("");
    try {
      const result = await api(`/user/orders/${orderId}/cancel`, { method: "POST", body: {} });
      setOrders((current) => current.map((order) => order.id === orderId ? result.order : order));
      onCancelled();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function invoice(order) {
    setBusyId(order.id);
    setError("");
    try {
      await downloadInvoice(order.id, order.invoiceNumber);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card max-w-[720px]" role="dialog" aria-modal="true" aria-labelledby="orders-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close orders"><X size={19} /></button>
        <span className="eyebrow">YOUR NAJU’S MAGIC SHOP ACCOUNT</span>
        <h2 id="orders-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">Your orders</h2>
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-16 text-leaf"><LoaderCircle className="animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="py-14 text-center text-muted">
            <Package className="mx-auto" size={28} />
            <p className="mt-3 text-sm">Your next favorite thing is out there.</p>
          </div>
        ) : (
          <div className="mt-6 max-h-[58vh] space-y-3 overflow-y-auto pr-1">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-line p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">Order {order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`}</p>
                    <h3 className="mt-1 text-xs font-semibold">{order.items?.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</h3>
                    <p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}</p>
                    {order.paymentMethod !== "COD" && (order.paymentInstrument || order.paymentReference) && (
                      <p className="mt-1 text-[10px] text-muted">
                        {order.paymentInstrument && `Paid by ${order.paymentInstrument.toUpperCase()}`}
                        {order.paymentInstrument && order.paymentReference && " · "}
                        {order.paymentReference && `UTR/reference ${order.paymentReference}`}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 rounded-xl bg-canvas px-3 py-2 text-[11px] leading-5 text-muted">
                    <strong className="text-ink">Delivering to:</strong> {order.recipientName}, {order.addressLine}, {order.city}, {order.state} {order.pincode}
                  </div>
                  {(order.courierName || order.trackingId || order.awbCode) && (
                    <div className="mt-3 rounded-xl border border-line px-3 py-2 text-[11px] leading-5 text-muted">
                      <strong className="text-ink">Delivery tracking</strong>
                      <p>{order.courierName || "Courier"}{(order.trackingId || order.awbCode) ? ` · ${order.trackingId || order.awbCode}` : ""}</p>
                      {(order.trackingUrl?.startsWith("https://") || order.trackingUrl?.startsWith("http://")) && (
                        <a className="font-semibold text-leaf underline" href={order.trackingUrl} target="_blank" rel="noreferrer">Track shipment</a>
                      )}
                    </div>
                  )}
                  {order.paymentMethod === "COD" && (
                    <p className="mt-2 text-[10px] text-muted">{order.paidAt ? `Cash collected ${new Date(order.paidAt).toLocaleString("en-IN")}` : "Cash is payable on delivery"}</p>
                  )}
                  {order.events?.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[11px] font-semibold text-leaf">Order updates ({order.events.length})</summary>
                      <ol className="mt-2 space-y-2 border-l border-line pl-3">
                        {order.events.map((event) => <li key={event.id} className="text-[10px] text-muted"><strong>{event.status.replaceAll("_", " ")}</strong> · {event.message} · {new Date(event.createdAt).toLocaleString("en-IN")}</li>)}
                      </ol>
                    </details>
                  )}
                  <div className="text-right">
                    {(order.shippingChargePaise > 0 || order.codChargePaise > 0) && (
                      <div className="mb-1 text-[10px] text-muted">
                        {order.shippingChargePaise > 0 && <p>Shipping {money(order.shippingChargePaise)}</p>}
                        {order.codChargePaise > 0 && <p>COD fee {money(order.codChargePaise)}</p>}
                      </div>
                    )}
                    <p className="text-sm font-semibold">{money(order.totalAmountPaise)}</p>
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-leaf">{order.status}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.invoiceNumber && (
                    <button type="button" className="button-small" disabled={busyId === order.id} onClick={() => invoice(order)}>
                      {busyId === order.id ? <LoaderCircle size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />} Invoice
                    </button>
                  )}
                  {["PENDING", "CONFIRMED", "PAID"].includes(order.status) && (
                    <button type="button" className="button-small text-rose-700" disabled={busyId === order.id} onClick={() => cancelOrder(order.id)}>
                      Cancel order
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { api } from "../api";
import { money } from "./ProductCard";

const initialAddress = {
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutModal({ user, mode, product, quantity, payments, brandName, logoUrl, onClose, onPlaced }) {
  const [address, setAddress] = useState({
    ...initialAddress,
    recipientName: user?.name || "",
    phone: user?.mobile || "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsError, setCouponsError] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setQuoteBusy(true);
      setQuoteError("");
      try {
        const result = await api("/user/coupons/preview", {
          method: "POST",
          body: {
            ...(appliedCoupon?.couponCode ? { code: appliedCoupon.couponCode } : {}),
            state: address.state,
            mode,
            paymentMethod,
            ...(mode === "DIRECT" ? { productId: product.id, quantity } : {}),
          },
        });
        if (active) setQuote(result);
      } catch (requestError) {
        if (active) {
          setQuote(null);
          setQuoteError(requestError.message);
        }
      } finally {
        if (active) setQuoteBusy(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [address.state, appliedCoupon?.couponCode, mode, paymentMethod, product?.id, quantity]);

  useEffect(() => {
    let active = true;
    api("/user/coupons/available")
      .then((result) => {
        if (active) setAvailableCoupons(result.coupons || []);
      })
      .catch((requestError) => {
        if (active) setCouponsError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api("/user/addresses")
      .then((result) => {
        if (!active) return;
        const saved = result.addresses || [];
        setAddresses(saved);
        const preferred = saved.find((item) => item.isDefault) || saved[0];
        if (preferred) {
          setAddressId(preferred.id);
          setAddress({
            recipientName: preferred.recipientName,
            phone: preferred.phone,
            addressLine: preferred.addressLine,
            city: preferred.city,
            state: preferred.state,
            pincode: preferred.pincode,
            buyerGstin: preferred.buyerGstin || "",
          });
        }
      })
      .catch((requestError) => setError(requestError.message));
    return () => { active = false; };
  }, []);

  function update(event) {
    if (event.target.name === "state") setQuote(null);
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function choosePaymentMethod(method) {
    setPaymentMethod(method);
    setQuote(null);
    setQuoteError("");
  }

  async function applyCouponCode(code) {
    if (!code.trim()) return;
    setCouponBusy(true);
    setError("");
    try {
      const result = await api("/user/coupons/preview", {
        method: "POST",
        body: {
          code: code.trim(),
          state: address.state,
          mode,
          paymentMethod,
          ...(mode === "DIRECT" ? { productId: product.id, quantity } : {}),
        },
      });
      setAppliedCoupon(result);
      setQuote(result);
    } catch (requestError) {
      setAppliedCoupon(null);
      setError(requestError.message);
    } finally {
      setCouponBusy(false);
    }
  }

  async function applyCoupon() {
    await applyCouponCode(couponCode);
  }

  function chooseAddress(event) {
    const selectedId = event.target.value;
    setAddressId(selectedId);
    const selected = addresses.find((item) => item.id === selectedId);
    if (!selected) {
      setAddress({
        ...initialAddress,
        recipientName: user?.name || "",
        phone: user?.mobile || "",
      });
      setSaveAddress(false);
      setAppliedCoupon(null);
      setQuote(null);
      return;
    }
    setAddress({
      recipientName: selected.recipientName,
      phone: selected.phone,
      addressLine: selected.addressLine,
      city: selected.city,
      state: selected.state,
      pincode: selected.pincode,
      buyerGstin: selected.buyerGstin || "",
    });
    setSaveAddress(false);
    setAppliedCoupon(null);
    setQuote(null);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (saveAddress && !addressId) {
        await api("/user/addresses", { method: "POST", body: { ...address, label: "Checkout" } });
      }
      const body = {
          mode,
          ...(mode === "DIRECT" ? { productId: product.id, quantity } : {}),
          shippingAddress: address,
          ...(appliedCoupon ? { couponCode: appliedCoupon.couponCode } : {}),
      };
      if (paymentMethod === "ONLINE") {
        await beginOnlinePayment(body);
        return;
      }

      const result = await api("/user/orders/cod", { method: "POST", body });
      setOrder(result.order);
      await onPlaced(result.order);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function beginOnlinePayment(body) {
    const scriptLoaded = await loadRazorpay();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error("Online checkout could not load. Check your connection or choose cash on delivery.");
    }

    const created = await api("/user/checkout/create-order", { method: "POST", body });
    const checkoutOptions = {
      key: created.razorpayKeyId || payments?.razorpayKeyId,
      order_id: created.razorpayOrderId,
      amount: created.amountPaise,
      currency: created.currency || "INR",
      name: brandName || "Naju's Magic Shop",
      description: "A little magic, on its way",
      image: logoUrl || `${window.location.origin}/favicon.svg`,
      prefill: {
        name: address.recipientName,
        contact: address.phone,
        ...(user?.email ? { email: user.email } : {}),
      },
      notes: { internalOrderId: created.order.id },
      theme: { color: "#553b78" },
      method: { card: true, upi: true, netbanking: false, wallet: false },
      handler: async (payment) => {
        setBusy(true);
        setError("");
        try {
          const verified = await api("/user/checkout/verify-payment", {
            method: "POST",
            body: {
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            },
          });
          setOrder(verified.order);
          await onPlaced(verified.order);
        } catch (requestError) {
          setError(requestError.message);
        } finally {
          setBusy(false);
        }
      },
      modal: {
        ondismiss: () => setBusy(false),
      },
    };

    setBusy(true);
    const checkout = new window.Razorpay(checkoutOptions);
    checkout.on("payment.failed", (event) => {
      setBusy(false);
      setError(event.error?.description || "Payment did not complete. You can try again or choose COD.");
    });
    checkout.open();
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card max-w-[620px]" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close checkout"><X size={19} /></button>
        {order ? (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-leaf"><CheckCircle2 size={34} /></div>
            <p className="eyebrow mt-6">ORDER CONFIRMED</p>
            <h2 id="checkout-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">That’s a good choice.</h2>
            <p className="mt-3 text-sm text-muted">Order #{order.id?.slice(-8).toUpperCase()} · {order.invoiceNumber || "Invoice created"}</p>
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-canvas p-5 text-left">
              <div className="flex justify-between text-sm text-muted"><span>Payment</span><span className="font-semibold text-ink">{order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}</span></div>
              {order.shippingChargePaise > 0 && <div className="mt-2 flex justify-between text-sm text-muted"><span>Shipping</span><span>{money(order.shippingChargePaise)}</span></div>}
              {order.codChargePaise > 0 && <div className="mt-2 flex justify-between text-sm text-muted"><span>COD handling</span><span>{money(order.codChargePaise)}</span></div>}
              <div className="mt-3 flex justify-between text-sm text-muted"><span>Order total</span><span className="font-semibold text-ink">{money(order.totalAmountPaise)}</span></div>
            </div>
            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-muted">{order.paymentMethod === "COD" ? "Your order is confirmed. Please pay the courier when it arrives." : "Your payment is confirmed and your order is on its way to fulfillment."}</p>
            <button type="button" className="button-primary mx-auto mt-7" onClick={onClose}>Continue exploring <ArrowRight size={16} /></button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className="eyebrow">A LITTLE MAGIC, ON ITS WAY</span>
              <h2 id="checkout-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">Where should it go?</h2>
              <p className="mt-2 text-sm text-muted">
                {mode === "DIRECT" && product ? `${product.name} · quantity ${quantity}` : "Your bag is ready for its next stop."}
              </p>
            </div>
            <form onSubmit={submit}>
              {addresses.length > 0 && (
                <label className="mb-4 block">
                  <span className="form-label">Use a saved delivery address</span>
                  <select className="form-input" value={addressId} onChange={chooseAddress}>
                    <option value="">Enter a new address</option>
                    {addresses.map((saved) => <option key={saved.id} value={saved.id}>{saved.label}{saved.isDefault ? " · Default" : ""} — {saved.city}</option>)}
                  </select>
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="recipientName">Full name</label>
                  <input id="recipientName" className="form-input" name="recipientName" autoComplete="name" value={address.recipientName} onChange={update} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="phone">Mobile number</label>
                  <input id="phone" className="form-input" name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={address.phone} onChange={update} pattern="[6-9][0-9]{9}" placeholder="10-digit number" required />
                </div>
                <div>
                  <label className="form-label" htmlFor="pincode">PIN code</label>
                  <input id="pincode" className="form-input" name="pincode" inputMode="numeric" autoComplete="postal-code" value={address.pincode} onChange={update} pattern="[1-9][0-9]{5}" placeholder="6-digit PIN code" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="addressLine">Address</label>
                  <input id="addressLine" className="form-input" name="addressLine" autoComplete="street-address" value={address.addressLine} onChange={update} placeholder="House, street, area" required />
                </div>
                <div>
                  <label className="form-label" htmlFor="city">City</label>
                  <input id="city" className="form-input" name="city" autoComplete="address-level2" value={address.city} onChange={update} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="state">State</label>
                  <input id="state" className="form-input" name="state" autoComplete="address-level1" value={address.state} onChange={update} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="couponCode">Coupon code <span className="font-normal text-muted">(optional)</span></label>
                  <div className="flex gap-2">
                    <input id="couponCode" className="form-input uppercase" value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setAppliedCoupon(null); setQuote(null); }} placeholder="Enter code" />
                    <button type="button" className="button-secondary shrink-0" onClick={applyCoupon} disabled={couponBusy || !couponCode.trim()}>{couponBusy ? <LoaderCircle size={15} className="animate-spin" /> : "Apply"}</button>
                  </div>
                  {availableCoupons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Available coupons">
                      {availableCoupons.map((coupon) => (
                        <button
                          key={coupon.id}
                          type="button"
                          className="rounded-full border border-leaf/20 bg-leaf/5 px-3 py-1.5 text-[10px] font-semibold text-leaf transition hover:bg-leaf/10 disabled:opacity-50"
                          onClick={() => {
                            setCouponCode(coupon.code);
                            applyCouponCode(coupon.code);
                          }}
                          disabled={couponBusy}
                        >
                          {coupon.code} · {coupon.type === "PERCENT" ? `${coupon.value}% off` : `${money(coupon.value)} off`}
                        </button>
                      ))}
                    </div>
                  )}
                  {couponsError && <p className="mt-2 text-[11px] text-rose-700" role="status">Couldn’t load current offers: {couponsError}</p>}
                </div>
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />
                Save this new address for next time
              </label>
              <div className="mt-4 rounded-xl border border-line bg-canvas p-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">Order cost breakdown</p>
                  {quoteBusy && <LoaderCircle size={14} className="animate-spin text-leaf" />}
                </div>
                {quote ? (
                  <>
                    <div className="mt-3 flex justify-between text-muted"><span>Items subtotal</span><span>{money(quote.summary.subtotalPaise)}</span></div>
                    {quote.summary.discountPaise > 0 && <div className="mt-2 flex justify-between text-emerald-700"><span>{quote.couponCode || "Coupon"} discount</span><span>−{money(quote.summary.discountPaise)}</span></div>}
                    <div className="mt-2 flex justify-between text-muted"><span>After discount</span><span>{money(quote.summary.taxableAmountPaise)}</span></div>
                    <div className="mt-2 flex justify-between text-muted"><span>GST</span><span>{money(quote.summary.totalGstPaise)}</span></div>
                    <div className="mt-2 flex justify-between text-muted"><span>Shipping</span><span>{quote.summary.shippingChargePaise === 0 ? "Free" : money(quote.summary.shippingChargePaise)}</span></div>
                    {paymentMethod === "COD" && <div className="mt-2 flex justify-between text-muted"><span>Cash-on-delivery fee</span><span>{money(quote.summary.codChargePaise)}</span></div>}
                    <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold text-ink"><span>Payable total</span><span>{money(quote.summary.totalAmountPaise)}</span></div>
                  </>
                ) : quoteError ? (
                  <p className="mt-2 text-rose-700" role="status">{quoteError}</p>
                ) : (
                  <p className="mt-2 text-muted">Calculating your order total…</p>
                )}
              </div>
              <div className="mt-6">
                <p className="form-label">Choose how you’d like to pay</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`payment-option ${paymentMethod === "COD" ? "payment-option-active" : ""}`}
                    onClick={() => choosePaymentMethod("COD")}
                    aria-pressed={paymentMethod === "COD"}
                  >
                    <span className="payment-icon"><Sparkles size={18} /></span>
                    <span className="flex-1 text-left"><strong>Cash on delivery</strong><small>Pay when it arrives</small></span>
                    <span className="payment-radio" />
                  </button>
                  {payments?.razorpay ? (
                    <button
                      type="button"
                      className={`payment-option ${paymentMethod === "ONLINE" ? "payment-option-active" : ""}`}
                      onClick={() => choosePaymentMethod("ONLINE")}
                      aria-pressed={paymentMethod === "ONLINE"}
                    >
                      <span className="payment-icon"><CreditCard size={18} /></span>
                      <span className="flex-1 text-left"><strong>Card or UPI</strong><small>Secure Razorpay checkout</small></span>
                      <span className="payment-radio" />
                    </button>
                  ) : (
                    <div className="payment-option payment-option-disabled" title="Enable Razorpay on the backend to accept online payments">
                      <span className="payment-icon"><CreditCard size={18} /></span>
                      <span className="flex-1 text-left"><strong>Card or UPI</strong><small>Online payments not set up yet</small></span>
                      <ShieldCheck size={16} className="text-muted/60" />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-canvas px-4 py-3 text-xs leading-5 text-muted">
                Secure checkout. Coupons and totals are verified by the server. Shipping and any cash-on-delivery fee are shown in the breakdown above.
              </div>
              {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
              <button type="submit" className="button-primary mt-5 w-full" disabled={busy || quoteBusy || !quote}>
                {busy ? <><LoaderCircle size={16} className="animate-spin" /> {paymentMethod === "ONLINE" ? "Opening secure checkout..." : "Confirming order..."}</> : <>{paymentMethod === "ONLINE" ? "Continue to secure payment" : "Confirm COD order"} <ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

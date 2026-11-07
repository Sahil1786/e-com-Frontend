import { useEffect, useState } from "react";
import { Check, LoaderCircle, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../api";

const blankAddress = {
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  buyerGstin: "",
};

export default function AddressBookModal({ user, onUserUpdated, onClose }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(blankAddress);
  const [editingId, setEditingId] = useState("");
  const [email, setEmail] = useState(user.email || "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadAddresses() {
    const result = await api("/user/addresses");
    setAddresses(result.addresses || []);
  }

  useEffect(() => {
    loadAddresses().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  function editAddress(address) {
    setEditingId(address.id);
    setForm({ ...blankAddress, ...address, buyerGstin: address.buyerGstin || "" });
  }

  function resetForm() {
    setEditingId("");
    setForm({ ...blankAddress, recipientName: user.name || "", phone: user.mobile || "" });
  }

  async function saveAddress(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(editingId ? `/user/addresses/${editingId}` : "/user/addresses", {
        method: editingId ? "PUT" : "POST",
        body: form,
      });
      await loadAddresses();
      resetForm();
      setNotice(editingId ? "Delivery address updated." : "Delivery address saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(addressId) {
    setBusy(true);
    setError("");
    try {
      await api(`/user/addresses/${addressId}/default`, { method: "PATCH", body: {} });
      await loadAddresses();
      setNotice("Default delivery address updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeAddress(address) {
    if (!window.confirm(`Remove the ${address.label} delivery address?`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/user/addresses/${address.id}`, { method: "DELETE" });
      await loadAddresses();
      if (editingId === address.id) resetForm();
      setNotice("Delivery address removed.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/user/profile/email", {
        method: "PUT",
        body: { email: email.trim() || null },
      });
      onUserUpdated(result.user);
      setNotice(result.emailNotificationSent === true
        ? "Email saved. A confirmation message was sent; future order updates will go to this address."
        : result.emailNotificationSent === false
          ? "Email saved, but the confirmation message could not be sent. Check the backend email logs."
          : email.trim()
            ? "Email notification preference updated."
            : "Email removed. Email notifications are now disabled.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card max-w-[780px]" role="dialog" aria-modal="true" aria-labelledby="address-book-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close address book"><X size={19} /></button>
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h2 id="address-book-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">Saved details</h2>
        <p className="mt-2 text-sm text-muted">Choose an address at checkout. Invoices keep the exact delivery address used for each order.</p>
        {(error || notice) && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"}>{error || notice}</p>}

        <form className="mt-5 flex flex-col gap-3 rounded-2xl bg-canvas p-4 sm:flex-row sm:items-end" onSubmit={saveEmail}>
          <label className="flex-1"><span className="form-label">Email for account, order and payment updates</span><input className="form-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <button type="submit" className="button-secondary" disabled={busy}>Save email</button>
        </form>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h3 className="font-display text-xl font-semibold">{editingId ? "Edit address" : "Add an address"}</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveAddress}>
              <label><span className="form-label">Label</span><input className="form-input" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Home, work..." required /></label>
              <label><span className="form-label">Recipient name</span><input className="form-input" value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} required /></label>
              <label><span className="form-label">Mobile</span><input className="form-input" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} pattern="[6-9][0-9]{9}" required /></label>
              <label className="sm:col-span-2"><span className="form-label">Street address</span><input className="form-input" value={form.addressLine} onChange={(event) => setForm({ ...form, addressLine: event.target.value })} required /></label>
              <label><span className="form-label">City</span><input className="form-input" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required /></label>
              <label><span className="form-label">State</span><input className="form-input" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} required /></label>
              <label><span className="form-label">PIN code</span><input className="form-input" inputMode="numeric" value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} pattern="[1-9][0-9]{5}" required /></label>
              <label><span className="form-label">GSTIN <small>(optional)</small></span><input className="form-input" value={form.buyerGstin} onChange={(event) => setForm({ ...form, buyerGstin: event.target.value })} /></label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}{editingId ? "Save changes" : "Save address"}</button>
                {editingId && <button type="button" className="button-secondary" onClick={resetForm}>Cancel edit</button>}
              </div>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between"><h3 className="font-display text-xl font-semibold">Your addresses</h3><span className="text-xs text-muted">{addresses.length}/10 saved</span></div>
            {loading ? <div className="flex justify-center py-10"><LoaderCircle className="animate-spin text-leaf" /></div> : (
              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <article key={address.id} className={`rounded-2xl border p-4 ${address.isDefault ? "border-leaf/40 bg-emerald-50/40" : "border-line"}`}>
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-leaf" /><p className="text-sm font-semibold">{address.label}</p>{address.isDefault && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">DEFAULT</span>}</div>
                        <p className="mt-2 text-xs leading-5 text-muted">{address.recipientName} · {address.phone}<br />{address.addressLine}, {address.city}, {address.state} {address.pincode}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" className="icon-button !h-8 !w-8" onClick={() => editAddress(address)} aria-label={`Edit ${address.label}`}><Pencil size={14} /></button>
                        <button type="button" className="icon-button !h-8 !w-8 text-rose-600" onClick={() => removeAddress(address)} aria-label={`Remove ${address.label}`}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {!address.isDefault && <button type="button" className="mt-3 text-[10px] font-bold text-leaf hover:underline" onClick={() => makeDefault(address.id)} disabled={busy}><Plus size={12} className="mr-1 inline" />Make default</button>}
                  </article>
                ))}
                {!addresses.length && <div className="rounded-xl bg-canvas py-8 text-center text-xs text-muted">No addresses saved yet.</div>}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

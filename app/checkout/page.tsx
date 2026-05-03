"use client";

import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { useRouter } from 'next/navigation';
import {
  mdiMapMarker,
  mdiTruckDelivery,
  mdiClipboardTextOutline,
  mdiCreditCardOutline,
  mdiChevronLeft,
  mdiPlus,
  mdiClose
} from '@mdi/js';
import './page.css';

// ─── Types ──────────────────────────────────────────────────────
interface Address {
  id_alamat: string;
  label_alamat: string;
  nama_penerima: string;
  nomor_telepon: string;
  alamat_lengkap: string;
  kota_kabupaten: string;
  kode_pos: string;
  is_utama: boolean;
}

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  note?: string; // FIX #3: per-item note
}

// ─── Component ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();

  const [modal, setModal] = useState({ isOpen: false, type: "" });

  // FIX #3: per-item notes stored in a map { itemIndex: noteText }
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [noteInput, setNoteInput] = useState("");
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // FIX #1: store full address objects from alamat_pengguna table
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);

  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(0);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [userId, setUserId] = useState<string | null>(null);

  const shippingOptions = [
    { id: 0, name: "JNE - Reguler", price: 15000, desc: "Arrives 2-3 Days" },
    { id: 1, name: "J&T Express",   price: 12000, desc: "Arrives 2-3 Days" },
  ];

  const paymentOptions = [
    { id: 0, name: "QRIS",          desc: "Scan menggunakan Dana, GoPay", provider: "All Providers" },
    { id: 1, name: "Transfer Bank", desc: "BCA, Mandiri, BNI",           provider: "BCA" },
  ];

  // ── Load Midtrans Snap ───────────────────────────────────────
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim());
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // ── Fetch Profile + Addresses + Cart ────────────────────────
  // FIX #1: fetch addresses from the dedicated address table via a new API endpoint
  useEffect(() => {
    const fetchData = async () => {
      // 1. Profile (to get email, userId)
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserEmail(profile.email || "user@example.com");
        setUserId(profile.id || null);
      }

      // 2. FIX #1 — Addresses from alamat_pengguna table
      //    Create /api/addresses endpoint (see addresses route file below)
      const addrRes = await fetch('/api/addresses');
      if (addrRes.ok) {
        const addrData: Address[] = await addrRes.json();
        setAddresses(addrData);
        // Default: select the "utama" address
        const utamaIdx = addrData.findIndex(a => a.is_utama);
        setSelectedAddressIdx(utamaIdx >= 0 ? utamaIdx : 0);
      }

      // 3. Cart
      const cartRes = await fetch('/api/cart');
      if (cartRes.ok) {
        const items: CartItem[] = await cartRes.json();
        setCartItems(items);
        const sub = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
        setSubtotal(sub);
      }
    };
    fetchData();
  }, []);

  const totalAmount = subtotal + shippingOptions[selectedShipping].price;
  const selectedAddress = addresses[selectedAddressIdx] ?? null;

  // ── Modal helpers ────────────────────────────────────────────
  const openModal  = (type: string, noteIdx?: number) => {
    if (type === "Notes" && noteIdx !== undefined) {
      setActiveNoteIdx(noteIdx);
      setNoteInput(itemNotes[noteIdx] ?? "");
    }
    setModal({ isOpen: true, type });
  };
  const closeModal = () => {
    setModal({ isOpen: false, type: "" });
    setActiveNoteIdx(null);
  };

  // FIX #3: save note for the specific item index
  const saveNote = () => {
    if (activeNoteIdx !== null) {
      setItemNotes(prev => ({ ...prev, [activeNoteIdx]: noteInput.trim() }));
    }
    closeModal();
  };

  const deleteNote = () => {
    if (activeNoteIdx !== null) {
      setItemNotes(prev => { const n = { ...prev }; delete n[activeNoteIdx]; return n; });
      setNoteInput("");
    }
    closeModal();
  };

  // ── Checkout + FIX #4: save to pesanan & item_pesanan ───────
  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    try {
      const orderId = `ORDER-${Date.now()}`;

      // Build items payload with per-item notes (FIX #3 & #4)
      const itemsPayload = cartItems.map((item, idx) => ({
        id:       item.id,
        name:     item.name,
        price:    item.price,
        quantity: item.quantity,
        image:    item.image,
        note:     itemNotes[idx] ?? "",
      }));

      // FIX #4: single POST that (a) creates Midtrans token AND (b) saves order to DB
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          totalAmount,
          subtotal,
          shippingCost: shippingOptions[selectedShipping].price,
          shippingMethod: shippingOptions[selectedShipping].name,
          paymentMethod:  paymentOptions[selectedPayment].name,
          userDetails: {
            id:        userId,
            nama:      selectedAddress.nama_penerima,
            email:     userEmail,
            nomor_telp: selectedAddress.nomor_telepon,
          },
          shippingAddress: {
            label:         selectedAddress.label_alamat,
            nama_penerima: selectedAddress.nama_penerima,
            nomor_telepon: selectedAddress.nomor_telepon,
            alamat_lengkap: selectedAddress.alamat_lengkap,
            kota_kabupaten: selectedAddress.kota_kabupaten,
            kode_pos:       selectedAddress.kode_pos,
          },
          items: itemsPayload,
        }),
      });

      const data = await response.json();

      if (data.token) {
        if ((window as any).snap) {
          (window as any).snap.pay(data.token, {
            onSuccess: (result: any) => {
            console.log("Midtrans onSuccess fired!", result);
            
            fetch(`/api/orders/${data.pesananId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "dibayar" }),
            })
            .then(r => r.json())
            .then(res => {
                console.log("Status update response:", res);
                alert("Bayar Berhasil!");
                router.push('/DashboardProduct'); // ← pindah SETELAH update selesai
            })
            .catch(err => {
                console.error("Status update error:", err);
                alert("Bayar Berhasil!");
                router.push('/DashboardProduct');
            });
        },
            onPending: () => { alert("Selesaikan pembayaran ya!"); },
            onError:   () => { alert("Yah, gagal bayar."); },
          });
        } else {
          alert("Sistem Midtrans belum siap. Coba refresh halaman.");
        }
      } else if (data.error) {
        alert("Gagal Checkout: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Sistem sibuk, coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="checkout-view">

      {/* Sticky Header */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </button>
        <span className="header-title">Selesaikan Pesananmu</span>
      </div>

      <div className="checkout-container">
        <div className="main-layout">

          {/* ── Left Column ── */}
          <div className="details-side">

            {/* Delivery Address */}
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label">
                  <Icon className="icon" path={mdiMapMarker} size={0.75} />
                  Alamat Pengiriman
                </span>
                <button className="change-btn" onClick={() => openModal("Address")}>Ganti</button>
              </div>
              <div className="card-inner-white">
                {selectedAddress ? (
                  <>
                    {/* FIX #1: show full address from alamat_pengguna */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, background: 'var(--green-light)',
                        color: 'var(--green-dark)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase'
                      }}>
                        {selectedAddress.label_alamat}
                        {selectedAddress.is_utama && ' · Utama'}
                      </span>
                    </div>
                    <h3 className="user-title">{selectedAddress.nama_penerima}</h3>
                    <p className="address-desc">
                      {selectedAddress.alamat_lengkap}, {selectedAddress.kota_kabupaten} {selectedAddress.kode_pos}
                    </p>
                    <p className="user-phone">{selectedAddress.nomor_telepon}</p>
                  </>
                ) : (
                  <p className="address-desc" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    Belum ada alamat. Tambahkan di profil terlebih dahulu.
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label">
                  <Icon className="icon" path={mdiTruckDelivery} size={0.75} />
                  Metode Pengiriman
                </span>
                <button className="change-btn" onClick={() => openModal("Shipping")}>Ganti</button>
              </div>
              <div className="card-inner-white flex-space">
                <div>
                  <h3 className="method-title">{shippingOptions[selectedShipping].name}</h3>
                  <p className="arrival-txt">{shippingOptions[selectedShipping].desc}</p>
                </div>
                <span className="green-price">
                  Rp {shippingOptions[selectedShipping].price.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label">
                  <Icon className="icon" path={mdiClipboardTextOutline} size={0.75} />
                  Detail Pesanan
                </span>
              </div>

              {/* FIX #3: Each item gets its own note button */}
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="card-inner-white product-layout"
                  style={{ marginBottom: idx !== cartItems.length - 1 ? 15 : 0 }}
                >
                  <div className="product-image-box">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200"}
                      alt={item.name}
                    />
                  </div>
                  <div className="product-details">
                    <div className="flex-space">
                      <h3 className="method-title">{item.name}</h3>
                      <span className="bold-price">Rp {Number(item.price).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="qty-chip">QTY {item.quantity}</div>
                    {/* FIX #3: note button for EVERY item */}
                    <div
                      className="notes-action"
                      onClick={() => openModal("Notes", idx)}
                    >
                      {itemNotes[idx] ? `📝 ${itemNotes[idx]}` : "+ Tambah catatan"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ── Right: Summary ── */}
          <aside className="summary-side">
            <div className="payment-summary-card">
              <h2 className="summary-heading">Ringkasan Pembayaran</h2>

              <div className="summary-row">
                <span>Subtotal ({cartItems.length} item)</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="summary-row">
                <span>Biaya Pengiriman</span>
                <span>Rp {shippingOptions[selectedShipping].price.toLocaleString("id-ID")}</span>
              </div>

              <hr className="summary-divider" />

              <div className="total-meta">TOTAL PEMBAYARAN</div>
              <div className="total-value">Rp {totalAmount.toLocaleString("id-ID")}</div>

              <button
                className="main-checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? "LOADING..." : "CHECKOUT"}
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* ── Modals ── */}
      {modal.isOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-nav">
              <h3 className="modal-h3">
                {modal.type === "Address"  && "Pilih Alamat"}
                {modal.type === "Shipping" && "Pilih Pengiriman"}
                {modal.type === "Payment"  && "Pilih Pembayaran"}
                {modal.type === "Notes"    && "Catatan Pesanan"}
              </h3>
              <button className="close-x" onClick={closeModal}>
                <Icon path={mdiClose} size={0.7} />
              </button>
            </div>

            <div className="modal-content scrollable-list">

              {/* Notes Modal (FIX #3: per-item) */}
              {modal.type === "Notes" && (
                <div className="notes-modal-body">
                  <p className="notes-modal-desc">
                    Catatan ini akan diteruskan ke tim Panganesia saat memproses pesananmu.
                  </p>
                  <textarea
                    className="notes-textarea"
                    placeholder="Contoh: tolong dikemas rapi, jangan dilipat..."
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    maxLength={200}
                    autoFocus
                  />
                  <div className="notes-char-count">{noteInput.length}/200</div>
                  <button className="confirm-btn" onClick={saveNote}>
                    Simpan Catatan
                  </button>
                  {activeNoteIdx !== null && itemNotes[activeNoteIdx] && (
                    <button className="notes-delete-btn" onClick={deleteNote}>
                      Hapus Catatan
                    </button>
                  )}
                </div>
              )}

              {/* FIX #1: Address Modal — show real addresses from alamat_pengguna */}
              {modal.type === "Address" && (
                <>
                  {addresses.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                      Belum ada alamat tersimpan.
                    </p>
                  ) : (
                    addresses.map((addr, idx) => (
                      <div
                        key={addr.id_alamat}
                        className={`option-item ${selectedAddressIdx === idx ? 'active' : ''}`}
                        onClick={() => { setSelectedAddressIdx(idx); closeModal(); }}
                      >
                        <div className="option-info">
                          <strong>
                            {addr.nama_penerima}
                            {addr.is_utama && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--green-mid)', fontWeight: 700 }}>
                                (Utama)
                              </span>
                            )}
                          </strong>
                          <p>{addr.label_alamat} — {addr.alamat_lengkap}, {addr.kota_kabupaten}</p>
                          <p style={{ marginTop: 2 }}>{addr.nomor_telepon}</p>
                        </div>
                        {/* FIX #2: check-dot is properly centred via flex on parent */}
                        {selectedAddressIdx === idx && <div className="check-dot" />}
                      </div>
                    ))
                  )}
                  <button
                    className="add-btn-modal"
                    onClick={() => { closeModal(); router.push('/profile'); }}
                  >
                    <Icon path={mdiPlus} size={0.8} /> Ubah / Tambah Alamat di Profil
                  </button>
                </>
              )}

              {/* Shipping Modal */}
              {modal.type === "Shipping" && shippingOptions.map((ship, idx) => (
                <div
                  key={idx}
                  className={`option-item ${selectedShipping === idx ? 'active' : ''}`}
                  onClick={() => { setSelectedShipping(idx); closeModal(); }}
                >
                  <div className="option-info">
                    <strong>{ship.name}</strong>
                    <p>{ship.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="price-label">Rp {ship.price.toLocaleString("id-ID")}</span>
                    {/* FIX #2: check-dot centred via flex gap */}
                    {selectedShipping === idx && <div className="check-dot" />}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
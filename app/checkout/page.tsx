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

export default function CheckoutPage() {
  const router = useRouter();
  const [modal, setModal] = useState({ isOpen: false, type: "" });
  const [productNote, setProductNote] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(0);

  // LOAD MIDTRANS SCRIPT
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim());
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const [addresses, setAddresses] = useState([
    { name: "Memuat nama...", phone: "Memuat nomor...", detail: "Memuat alamat...", note: "" }
  ]);

  const shippingOptions = [
    { id: 0, name: "JNE - Reguler", price: 15000, desc: "Arrives 2-3 Days" },
    { id: 1, name: "J&T Express", price: 12000, desc: "Arrives 2-3 Days" }
  ];

  const paymentOptions = [
    { id: 0, name: "QRIS", desc: "Scan menggunakan Dana, GoPay", provider: "All Providers" },
    { id: 1, name: "Transfer Bank", desc: "BCA, Mandiri, BNI", provider: "BCA" }
  ];

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [userEmail, setUserEmail] = useState("user@example.com");

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch User Profile
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserEmail(profile.email);
        setAddresses([
          {
            name: profile.nama || "User",
            phone: profile.nomor_telp || "Nomor belum diatur",
            detail: profile.alamat || "Alamat belum diatur (Update profil Anda terlebih dahulu)",
            note: ""
          }
        ]);
      }

      // 2. Fetch Keranjang
      const cartRes = await fetch('/api/cart');
      const items = await cartRes.json();
      if (cartRes.ok) {
        setCartItems(items);
        const sub = items.reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0);
        setSubtotal(sub);
      }
    };
    fetchData();
  }, []);

  const totalAmount = subtotal + shippingOptions[selectedShipping].price;

  const openModal = (type: string) => {
    if (type === "Notes") setNoteInput(productNote);
    setModal({ isOpen: true, type });
  };
  const closeModal = () => setModal({ isOpen: false, type: "" });

  const saveNote = () => {
    setProductNote(noteInput.trim());
    closeModal();
  };

  // FUNGSI CHECKOUT MIDTRANS
  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: `ORDER-${Date.now()}`,
          totalAmount: totalAmount,
          userDetails: {
            nama: addresses[selectedAddress].name,
            email: userEmail,
            nomor_telp: addresses[selectedAddress].phone
          }
        }),
      });

      const data = await response.json();

      if (data.token) {
        if ((window as any).snap) {
          (window as any).snap.pay(data.token, {
            onSuccess: (result: any) => { alert("Bayar Berhasil!"); router.push('/DashboardProduct'); },
            onPending: (result: any) => { alert("Selesaikan pembayaran ya!"); },
            onError: (result: any) => { alert("Yah, gagal bayar."); }
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

  return (
    <div className="checkout-view">

      {/* ── Sticky Header ── */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </button>
        <span className="header-title">Selesaikan Pesananmu</span>
      </div>

      <div className="checkout-container">
        <div className="main-layout">

          {/* ── Left: Detail Columns ── */}
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
                <h3 className="user-title">{addresses[selectedAddress].name}</h3>
                <p className="address-desc">{addresses[selectedAddress].detail}</p>
                <p className="user-phone">{addresses[selectedAddress].phone}</p>
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
              
              {cartItems.map((item, idx) => (
                <div key={idx} className="card-inner-white product-layout" style={{ marginBottom: idx !== cartItems.length - 1 ? 15 : 0 }}>
                  <div className="product-image-box">
                    <img src={item.image || "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200"} alt={item.name} />
                  </div>
                  <div className="product-details">
                    <div className="flex-space">
                      <h3 className="method-title">{item.name}</h3>
                      <span className="bold-price">Rp {Number(item.price).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="qty-chip">QTY {item.quantity}</div>
                    {/* Only show Note button for the first item as a global order note representation */}
                    {idx === 0 && (
                      <div
                        className="notes-action"
                        onClick={() => openModal("Notes")}
                      >
                        {productNote ? `📝 ${productNote}` : "+ Tambah catatan"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label">
                  <Icon className="icon" path={mdiCreditCardOutline} size={0.75} />
                  Metode Pembayaran
                </span>
                <button className="change-btn" onClick={() => openModal("Payment")}>Ganti</button>
              </div>
              <div className="card-inner-white flex-space">
                <div>
                  <h3 className="method-title">{paymentOptions[selectedPayment].name}</h3>
                  <p className="arrival-txt">{paymentOptions[selectedPayment].provider}</p>
                </div>
              </div>
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
              <div className="total-value">
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>

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

      {/* ── Modal ── */}
      {modal.isOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-nav">
              <h3 className="modal-h3">
                {modal.type === "Address" && "Pilih Alamat"}
                {modal.type === "Shipping" && "Pilih Pengiriman"}
                {modal.type === "Payment" && "Pilih Pembayaran"}
                {modal.type === "Notes" && "Catatan Pesanan"}
              </h3>
              <button className="close-x" onClick={closeModal}>
                <Icon path={mdiClose} size={0.7} />
              </button>
            </div>

            <div className="modal-content scrollable-list">

              {/* Notes */}
              {modal.type === "Notes" && (
                <div className="notes-modal-body">
                  <p className="notes-modal-desc">Catatan ini akan diteruskan ke tim Panganesia saat memproses pesananmu.</p>
                  <textarea
                    className="notes-textarea"
                    placeholder="Contoh: tolong dikemas rapi, jangan dilipat..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    maxLength={200}
                    autoFocus
                  />
                  <div className="notes-char-count">{noteInput.length}/200</div>
                  <button className="confirm-btn" onClick={saveNote}>
                    Simpan Catatan
                  </button>
                  {productNote && (
                    <button
                      className="notes-delete-btn"
                      onClick={() => { setProductNote(""); setNoteInput(""); closeModal(); }}
                    >
                      Hapus Catatan
                    </button>
                  )}
                </div>
              )}

              {/* Address */}
              {modal.type === "Address" && (
                <>
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className={`option-item ${selectedAddress === idx ? 'active' : ''}`}
                      onClick={() => { setSelectedAddress(idx); closeModal(); }}
                    >
                      <div className="option-info">
                        <strong>{addr.name}</strong>
                        <p>{addr.detail}</p>
                      </div>
                      {selectedAddress === idx && <div className="check-dot" />}
                    </div>
                  ))}
                  <button className="add-btn-modal" onClick={() => { closeModal(); router.push('/profile'); }}>
                    <Icon path={mdiPlus} size={0.8} /> Ubah / Tambah Alamat di Profil
                  </button>
                </>
              )}

              {/* Shipping */}
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
                    {selectedShipping === idx && <div className="check-dot" />}
                  </div>
                </div>
              ))}

              {/* Payment */}
              {modal.type === "Payment" && paymentOptions.map((pay, idx) => (
                <div
                  key={idx}
                  className={`option-item ${selectedPayment === idx ? 'active' : ''}`}
                  onClick={() => { setSelectedPayment(idx); closeModal(); }}
                >
                  <div className="option-info">
                    <strong>{pay.name}</strong>
                    <p>{pay.desc}</p>
                  </div>
                  {selectedPayment === idx && <div className="check-dot" />}
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
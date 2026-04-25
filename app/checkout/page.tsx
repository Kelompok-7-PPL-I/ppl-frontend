"use client";

import React, { useState } from 'react';
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
  
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(0);

  const addresses = [
    { name: "Amanda Toshiba", phone: "+62 828 9810 6967", detail: "Jl. KH. Noer Ali No. 193, Bekasi Selatan", note: "(Gerbang warna coklat)" },
    { name: "Amanda (Kantor)", phone: "+62 828 9810 6967", detail: "Gedung Cyber 2 Lt. 10, Kuningan, Jakarta Selatan", note: "(Titip di Resepsionis)" },
    { name: "Rumah Orang Tua", phone: "+62 812 3456 7890", detail: "Perumahan Harapan Indah Blok B12, Bekasi", note: "(Pagar Hitam)" }
  ];

  const shippingOptions = [
    { id: 0, name: "JNE - Reguler", price: 15000, desc: "Arrives 2-3 Days" },
    { id: 1, name: "J&T Express", price: 12000, desc: "Arrives 2-3 Days" },
    { id: 2, name: "SiCepat Best", price: 18000, desc: "Arrives Tomorrow" },
    { id: 3, name: "Instant Delivery", price: 35000, desc: "Arrives in 2 Hours" }
  ];

  const paymentOptions = [
    { id: 0, name: "QRIS", desc: "Scan menggunakan Dana, GoPay, ShopeePay", provider: "All Providers" },
    { id: 1, name: "E-Wallet", desc: "GoPay, OVO, Dana", provider: "GoPay" },
    { id: 2, name: "Transfer Bank", desc: "BCA, Mandiri, BNI", provider: "BCA" }
  ];

  const openModal = (type: string) => {
    if (type === "Notes") setNoteInput(productNote);
    setModal({ isOpen: true, type });
  };
  const closeModal = () => setModal({ isOpen: false, type: "" });

  const saveNote = () => {
    setProductNote(noteInput.trim());
    closeModal();
  };

  const handleCheckout = () => {
    router.push('/payment'); 
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
                <p className="address-note">{addresses[selectedAddress].note}</p>
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
              <div className="card-inner-white product-layout">
                <div className="product-image-box">
                  <img src="https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200" alt="Jagung Manis" />
                </div>
                <div className="product-details">
                  <div className="flex-space">
                    <h3 className="method-title">Jagung Manis</h3>
                    <span className="bold-price">Rp 30.000</span>
                  </div>
                  <div className="qty-chip">QTY 2</div>
                  <div
                    className="notes-action"
                    onClick={() => openModal("Notes")}
                  >
                    {productNote ? `📝 ${productNote}` : "+ Tambah catatan"}
                  </div>
                </div>
              </div>
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
              <div className="card-inner-white">
                <h3 className="method-title">{paymentOptions[selectedPayment].name}</h3>
                <p className="arrival-txt">{paymentOptions[selectedPayment].provider}</p>
              </div>
            </div>

          </div>

          {/* ── Right: Summary ── */}
          <aside className="summary-side">
            <div className="payment-summary-card">
              <h2 className="summary-heading">Ringkasan Pembayaran</h2>

              <div className="summary-row">
                <span>Subtotal (1 item)</span>
                <span>Rp 30.000</span>
              </div>
              <div className="summary-row">
                <span>Biaya Pengiriman</span>
                <span>Rp {shippingOptions[selectedShipping].price.toLocaleString("id-ID")}</span>
              </div>
              <div className="summary-row">
                <span>Biaya Layanan</span>
                <span>Rp 2.000</span>
              </div>

              <hr className="summary-divider" />

              <div className="total-meta">TOTAL PEMBAYARAN</div>
              <div className="total-value">
                Rp {(32000 + shippingOptions[selectedShipping].price).toLocaleString("id-ID")}
              </div>

              <button className="main-checkout-btn" onClick={handleCheckout}>
                Bayar Sekarang
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
                  <button className="add-btn-modal">
                    <Icon path={mdiPlus} size={0.75} /> Tambah Alamat Baru
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
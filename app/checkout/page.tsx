// page.tsx
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
  mdiPlus
} from '@mdi/js';
import './page.css';

export default function CheckoutPage() {
  const router = useRouter();
  const [modal, setModal] = useState({ isOpen: false, type: "" });
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
      // 1. Fetch User Profile (untuk Alamat & Nomor Telp)
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

  const openModal = (type: string) => setModal({ isOpen: true, type });
  const closeModal = () => setModal({ isOpen: false, type: "" });

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
      <div className="checkout-container">
        <header className="header-section">
          <button className="back-btn" onClick={() => window.history.back()}>
            <Icon path={mdiChevronLeft} size={1} /> Back
          </button>
          <h1 className="main-headline">Let's Complete Your Order!</h1>
        </header>

        <div className="main-layout">
          <div className="details-side">
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label"><Icon className="icon" path={mdiMapMarker} size={0.8} /> Delivery Address</span>
                <button className="change-btn" onClick={() => openModal("Address")}>Change</button>
              </div>
              <div className="card-inner-white">
                <h3 className="user-title">{addresses[selectedAddress].name}</h3>
                <p className="address-desc">{addresses[selectedAddress].detail}</p>
                <p className="user-phone">{addresses[selectedAddress].phone}</p>
              </div>
            </div>

            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label"><Icon className="icon" path={mdiTruckDelivery} size={0.8} /> Shipping</span>
                <button className="change-btn" onClick={() => openModal("Shipping")}>Change</button>
              </div>
              <div className="card-inner-white flex-space">
                <div>
                  <h3 className="method-title">{shippingOptions[selectedShipping].name}</h3>
                  <p className="arrival-txt">{shippingOptions[selectedShipping].desc}</p>
                </div>
                <span className="green-price">Rp {shippingOptions[selectedShipping].price.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <aside className="summary-side">
            <div className="payment-summary-card">
              <h2 className="summary-heading">Detail Payment</h2>
              <div className="summary-row"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
              <div className="summary-row"><span>Shipping</span><span>Rp {shippingOptions[selectedShipping].price.toLocaleString('id-ID')}</span></div>
              <hr className="summary-divider" />
              <div className="total-meta">TOTAL AMOUNT</div>
              <div className="total-value">Rp {totalAmount.toLocaleString('id-ID')}</div>
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

      {/* MODAL POPUP */}
      {modal.isOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-nav">
              <h3 className="modal-h3">Select {modal.type}</h3>
              <button className="close-x" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-content scrollable-list">
              
              {/* Logic Address */}
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
                      {selectedAddress === idx && <div className="check-dot"></div>}
                    </div>
                  ))}
                  <button className="add-btn-modal" onClick={() => { closeModal(); router.push('/profile'); }}>
                    <Icon path={mdiPlus} size={0.8} /> Ubah / Tambah Alamat di Profil
                  </button>
                </>
              )}

              {/* Logic Shipping */}
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
                  <span className="price-label">Rp {ship.price.toLocaleString('id-ID')}</span>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
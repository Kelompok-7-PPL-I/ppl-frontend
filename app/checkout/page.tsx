"use client";

import React, { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { useRouter } from "next/navigation";
import {
  mdiMapMarker,
  mdiTruckDelivery,
  mdiClipboardTextOutline,
  mdiChevronLeft,
  mdiPlus,
  mdiClose,
} from "@mdi/js";
import "./page.css";

// ─── Types ──────────────────────────────────────────────────────
interface Address {
  id_alamat: string;
  label_alamat: string;
  nama_penerima: string;
  nomor_telepon: string;
  alamat_lengkap: string;
  provinsi?: string;
  kecamatan?: string;
  kelurahan?: string;
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
  note?: string;
}

type CheckoutMode = "cart" | "selected_cart" | "buy_now";

// ─── Helpers ────────────────────────────────────────────────────
const getCheckoutMode = (): CheckoutMode => {
  if (typeof window === "undefined") return "cart";

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  if (mode === "selected-cart") return "selected_cart";
  if (mode === "buy-now") return "buy_now";

  return "cart";
};

const safeParseItems = (raw: string | null): CartItem[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error("Gagal parse checkout items:", error);
    return [];
  }
};

const normalizeItems = (items: any[]): CartItem[] => {
  return items
    .map((item) => ({
      id: item.id ?? item.id_produk ?? item.id_keranjang,
      name: item.name ?? item.nama_produk ?? item.produk?.nama_produk ?? "Produk",
      price: Number(item.price ?? item.harga ?? item.produk?.harga ?? 0),
      quantity: Number(item.quantity ?? item.jumlah ?? 1),
      image: item.image ?? item.gambar_url ?? item.produk?.gambar_url ?? "",
      note: item.note ?? "",
    }))
    .filter((item) => item.id !== undefined && item.price >= 0 && item.quantity > 0);
};

const calculateSubtotal = (items: CartItem[]) => {
  return items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
};

// ─── Component ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();

  const [modal, setModal] = useState({ isOpen: false, type: "" });

  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [noteInput, setNoteInput] = useState("");
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);

  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment] = useState(0);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [userId, setUserId] = useState<string | null>(null);

  const shippingOptions = [
    { id: 0, name: "JNE - Reguler", price: 15000, desc: "Arrives 2-3 Days" },
    { id: 1, name: "J&T Express", price: 12000, desc: "Arrives 2-3 Days" },
  ];

  const paymentOptions = [
    {
      id: 0,
      name: "QRIS",
      desc: "Scan menggunakan Dana, GoPay",
      provider: "All Providers",
    },
    {
      id: 1,
      name: "Transfer Bank",
      desc: "BCA, Mandiri, BNI",
      provider: "BCA",
    },
  ];

  // ── Load Midtrans Snap ───────────────────────────────────────
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://app.sandbox.midtrans.com/snap/snap.js"]'
    );

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim()
    );
    script.async = true;

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // ── Fetch Profile + Addresses + Checkout Items ───────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch("/api/profile");

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserEmail(profile.email || "user@example.com");
          setUserId(profile.id || null);
        }

        const addrRes = await fetch("/api/addresses");

        if (addrRes.ok) {
          const addrData: Address[] = await addrRes.json();
          setAddresses(addrData);

          const utamaIdx = addrData.findIndex((addr) => addr.is_utama);
          setSelectedAddressIdx(utamaIdx >= 0 ? utamaIdx : 0);
        }

        const mode = getCheckoutMode();

        if (mode === "selected_cart") {
          const rawItems = sessionStorage.getItem("checkoutItems");
          const selectedItems = normalizeItems(safeParseItems(rawItems));

          setCartItems(selectedItems);
          setSubtotal(calculateSubtotal(selectedItems));
          return;
        }

        if (mode === "buy_now") {
          const rawItem = sessionStorage.getItem("buyNowItem");
          const buyNowItems = normalizeItems(safeParseItems(rawItem));

          setCartItems(buyNowItems);
          setSubtotal(calculateSubtotal(buyNowItems));
          return;
        }

        const cartRes = await fetch("/api/cart");

        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const items = normalizeItems(cartData);

          setCartItems(items);
          setSubtotal(calculateSubtotal(items));
        }
      } catch (error) {
        console.error("Gagal memuat checkout data:", error);
        setCartItems([]);
        setSubtotal(0);
      }
    };

    fetchData();
  }, []);

  const totalAmount = subtotal + shippingOptions[selectedShipping].price;
  const selectedAddress = addresses[selectedAddressIdx] ?? null;

  // ── Modal helpers ────────────────────────────────────────────
  const openModal = (type: string, noteIdx?: number) => {
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

  const saveNote = () => {
    if (activeNoteIdx !== null) {
      setItemNotes((prev) => ({
        ...prev,
        [activeNoteIdx]: noteInput.trim(),
      }));
    }

    closeModal();
  };

  const deleteNote = () => {
    if (activeNoteIdx !== null) {
      setItemNotes((prev) => {
        const nextNotes = { ...prev };
        delete nextNotes[activeNoteIdx];
        return nextNotes;
      });

      setNoteInput("");
    }

    closeModal();
  };

  // ── Checkout ─────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    if (cartItems.length === 0 || subtotal <= 0) {
      alert("Tidak ada produk untuk checkout.");
      return;
    }

    setIsLoading(true);

    try {
      const orderId = `ORDER-${Date.now()}`;
      const mode = getCheckoutMode();

      const itemsPayload = cartItems.map((item, idx) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        note: itemNotes[idx] ?? "",
      }));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          orderId,
          totalAmount,
          subtotal,
          shippingCost: shippingOptions[selectedShipping].price,
          shippingMethod: shippingOptions[selectedShipping].name,
          paymentMethod: paymentOptions[selectedPayment].name,
          userDetails: {
            id: userId,
            nama: selectedAddress.nama_penerima,
            email: userEmail,
            nomor_telp: selectedAddress.nomor_telepon,
          },
          shippingAddress: {
            label: selectedAddress.label_alamat,
            nama_penerima: selectedAddress.nama_penerima,
            nomor_telepon: selectedAddress.nomor_telepon,
            alamat_lengkap: selectedAddress.alamat_lengkap,
            kota_kabupaten: selectedAddress.kota_kabupaten,
            kode_pos: selectedAddress.kode_pos,
          },
          items: itemsPayload,
        }),
      });

      const data = await response.json();

      console.log("Checkout response:", data);
      console.log("Snap ready:", !!(window as any).snap);

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
                .then((res) => res.json())
                .then((res) => {
                  console.log("Status update response:", res);

                  sessionStorage.removeItem("checkoutItems");
                  sessionStorage.removeItem("buyNowItem");

                  alert("Bayar Berhasil!");
                  router.push("/DashboardProduct");
                })
                .catch((err) => {
                  console.error("Status update error:", err);

                  sessionStorage.removeItem("checkoutItems");
                  sessionStorage.removeItem("buyNowItem");

                  alert("Bayar Berhasil!");
                  router.push("/DashboardProduct");
                });
            },
            onPending: () => {
              alert("Selesaikan pembayaran ya!");
            },
            onError: () => {
              alert("Yah, gagal bayar.");
            },
            onClose: () => {
              console.log("User menutup popup Midtrans.");
            },
          });
        } else {
          alert("Sistem Midtrans belum siap. Coba refresh halaman.");
        }
      } else if (data.error) {
        alert("Gagal Checkout: " + data.error);
      } else {
        console.error("Invalid checkout response:", data);
        alert("Gagal Checkout: token Midtrans tidak ditemukan.");
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

                <button
                  className="change-btn"
                  onClick={() => openModal("Address")}
                >
                  Ganti
                </button>
              </div>

              <div className="card-inner-white">
                {selectedAddress ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          background: "var(--green-light)",
                          color: "var(--green-dark)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedAddress.label_alamat}
                        {selectedAddress.is_utama && " · Utama"}
                      </span>
                    </div>

                    <h3 className="user-title">
                      {selectedAddress.nama_penerima}
                    </h3>

                    <p className="address-desc">
                      {selectedAddress.alamat_lengkap},{" "}
                      {selectedAddress.kelurahan && `${selectedAddress.kelurahan}, `}
                      {selectedAddress.kecamatan && `${selectedAddress.kecamatan}, `}
                      {selectedAddress.kota_kabupaten}
                      {selectedAddress.provinsi && `, ${selectedAddress.provinsi}`}{" "}
                      {selectedAddress.kode_pos}
                    </p>

                    <p className="user-phone">
                      {selectedAddress.nomor_telepon}
                    </p>
                  </>
                ) : (
                  <p
                    className="address-desc"
                    style={{
                      fontStyle: "italic",
                      color: "var(--text-muted)",
                    }}
                  >
                    Belum ada alamat. Tambahkan di profil terlebih dahulu.
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label">
                  <Icon
                    className="icon"
                    path={mdiTruckDelivery}
                    size={0.75}
                  />
                  Metode Pengiriman
                </span>

                <button
                  className="change-btn"
                  onClick={() => openModal("Shipping")}
                >
                  Ganti
                </button>
              </div>

              <div className="card-inner-white flex-space">
                <div>
                  <h3 className="method-title">
                    {shippingOptions[selectedShipping].name}
                  </h3>
                  <p className="arrival-txt">
                    {shippingOptions[selectedShipping].desc}
                  </p>
                </div>

                <span className="green-price">
                  Rp{" "}
                  {shippingOptions[selectedShipping].price.toLocaleString(
                    "id-ID"
                  )}
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div className="card-outer">
              <div className="card-top-row">
                <span className="section-label">
                  <Icon
                    className="icon"
                    path={mdiClipboardTextOutline}
                    size={0.75}
                  />
                  Detail Pesanan
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="card-inner-white">
                  <p
                    className="address-desc"
                    style={{
                      fontStyle: "italic",
                      color: "var(--text-muted)",
                    }}
                  >
                    Belum ada produk untuk checkout.
                  </p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="card-inner-white product-layout"
                    style={{
                      marginBottom: idx !== cartItems.length - 1 ? 15 : 0,
                    }}
                  >
                    <div className="product-image-box">
                      <img
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200"
                        }
                        alt={item.name}
                      />
                    </div>

                    <div className="product-details">
                      <div className="flex-space">
                        <h3 className="method-title">{item.name}</h3>
                        <span className="bold-price">
                          Rp {Number(item.price).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="qty-chip">QTY {item.quantity}</div>

                      <div
                        className="notes-action"
                        onClick={() => openModal("Notes", idx)}
                      >
                        {itemNotes[idx]
                          ? `📝 ${itemNotes[idx]}`
                          : "+ Tambah catatan"}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                <span>
                  Rp{" "}
                  {shippingOptions[selectedShipping].price.toLocaleString(
                    "id-ID"
                  )}
                </span>
              </div>

              <hr className="summary-divider" />

              <div className="total-meta">TOTAL PEMBAYARAN</div>
              <div className="total-value">
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>

              <button
                className="main-checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading || subtotal === 0 || cartItems.length === 0}
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-nav">
              <h3 className="modal-h3">
                {modal.type === "Address" && "Pilih Alamat"}
                {modal.type === "Shipping" && "Pilih Pengiriman"}
                {modal.type === "Notes" && "Catatan Pesanan"}
              </h3>

              <button className="close-x" onClick={closeModal}>
                <Icon path={mdiClose} size={0.7} />
              </button>
            </div>

            <div className="modal-content scrollable-list">
              {/* Notes Modal */}
              {modal.type === "Notes" && (
                <div className="notes-modal-body">
                  <p className="notes-modal-desc">
                    Catatan ini akan diteruskan ke tim Panganesia saat
                    memproses pesananmu.
                  </p>

                  <textarea
                    className="notes-textarea"
                    placeholder="Contoh: tolong dikemas rapi, jangan dilipat..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    maxLength={200}
                    autoFocus
                  />

                  <div className="notes-char-count">
                    {noteInput.length}/200
                  </div>

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

              {/* Address Modal */}
              {modal.type === "Address" && (
                <>
                  {addresses.length === 0 ? (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        textAlign: "center",
                        padding: "20px 0",
                      }}
                    >
                      Belum ada alamat tersimpan.
                    </p>
                  ) : (
                    addresses.map((addr, idx) => (
                      <div
                        key={addr.id_alamat}
                        className={`option-item ${
                          selectedAddressIdx === idx ? "active" : ""
                        }`}
                        onClick={() => {
                          setSelectedAddressIdx(idx);
                          closeModal();
                        }}
                      >
                        <div className="option-info">
                          <strong>
                            {addr.nama_penerima}
                            {addr.is_utama && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  color: "var(--green-mid)",
                                  fontWeight: 700,
                                }}
                              >
                                (Utama)
                              </span>
                            )}
                          </strong>

                          <p>
                            {addr.label_alamat} — {addr.alamat_lengkap},{" "}
                            {addr.kelurahan && `${addr.kelurahan}, `}
                            {addr.kecamatan && `${addr.kecamatan}, `}
                            {addr.kota_kabupaten}
                            {addr.provinsi && `, ${addr.provinsi}`}
                          </p>

                          <p style={{ marginTop: 2 }}>
                            {addr.nomor_telepon}
                          </p>
                        </div>

                        {selectedAddressIdx === idx && (
                          <div className="check-dot" />
                        )}
                      </div>
                    ))
                  )}

                  <button
                    className="add-btn-modal"
                    onClick={() => {
                      closeModal();
                      router.push("/profile");
                    }}
                  >
                    <Icon path={mdiPlus} size={0.8} /> Ubah / Tambah Alamat di
                    Profil
                  </button>
                </>
              )}

              {/* Shipping Modal */}
              {modal.type === "Shipping" &&
                shippingOptions.map((ship, idx) => (
                  <div
                    key={ship.id}
                    className={`option-item ${
                      selectedShipping === idx ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedShipping(idx);
                      closeModal();
                    }}
                  >
                    <div className="option-info">
                      <strong>{ship.name}</strong>
                      <p>{ship.desc}</p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span className="price-label">
                        Rp {ship.price.toLocaleString("id-ID")}
                      </span>

                      {selectedShipping === idx && (
                        <div className="check-dot" />
                      )}
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
"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Icon from "@mdi/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
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

type CheckoutMode = "cart" | "selected_cart" | "buy_now" | "reorder";

// ─── Helpers ────────────────────────────────────────────────────
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

// ─── Helper: update status pembayaran ke server ──────────────────
// Dipanggil di onSuccess Midtrans untuk kedua flow (normal & reorder).
// Mengirim { status: "dibayar" } ke PATCH /api/orders/[id]/status
// sesuai dengan handler yang ada di orders/[id]/status/route.ts.
const updateOrderStatus = async (pesananId: number): Promise<boolean> => {
  try {
    const res = await fetch(`/api/orders/${pesananId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dibayar" }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("updateOrderStatus failed:", res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return false;
  }
};

// ─── Component ──────────────────────────────────────────────────
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const getCheckoutMode = (): CheckoutMode => {
    const mode = searchParams.get("mode");
    if (mode === "selected-cart") return "selected_cart";
    if (mode === "buy-now") return "buy_now";
    if (mode === "reorder") return "reorder";
    return "cart";
  };

  const mode = getCheckoutMode();
  const isReorderMode = mode === "reorder";

  // Ref untuk menyimpan raw reorder items supaya tidak hilang saat re-render
  const reorderItemsRef = useRef<string | null>(null);
  // Ref untuk mencegah prefetch dipanggil lebih dari sekali
  const prefetchCalledRef = useRef(false);

  const [modal, setModal] = useState({ isOpen: false, type: "" });
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [noteInput, setNoteInput] = useState("");
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSnapReady, setIsSnapReady] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment] = useState(0);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [userId, setUserId] = useState<string | null>(null);

  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [pesananId, setPesananId] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

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

  const selectedAddress = addresses[selectedAddressIdx] ?? null;

  // ── Load Midtrans Snap ───────────────────────────────────────
  useEffect(() => {
    if ((window as any).snap) {
      setIsSnapReady(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://app.sandbox.midtrans.com/snap/snap.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setIsSnapReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim()
    );
    script.async = false;
    script.onload = () => {
      console.log("Snap.js loaded, snap ready:", !!(window as any).snap);
      setIsSnapReady(true);
    };
    script.onerror = () => console.error("Gagal load Snap.js");
    document.head.appendChild(script);
    return () => {};
  }, []);

  // ── Fetch Profile + Addresses ────────────────────────────────
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileRes, addrRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/addresses"),
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserEmail(profile.email || "user@example.com");
          setUserId(profile.id || null);
        }

        if (addrRes.ok) {
          const addrData: Address[] = await addrRes.json();
          setAddresses(addrData);
          const utamaIdx = addrData.findIndex((addr) => addr.is_utama);
          setSelectedAddressIdx(utamaIdx >= 0 ? utamaIdx : 0);
        }
      } catch (error) {
        console.error("Gagal memuat data user:", error);
      }
    };
    fetchUserData();
  }, []);

  // ── Fetch Items sesuai mode checkout ─────────────────────────
  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (mode === "selected_cart") {
          const rawItems = sessionStorage.getItem("checkoutItems");
          const items = normalizeItems(safeParseItems(rawItems));
          setCartItems(items);
          setSubtotal(calculateSubtotal(items));
          return;
        }

        if (mode === "buy_now") {
          const rawItem = sessionStorage.getItem("buyNowItem");
          const items = normalizeItems(safeParseItems(rawItem));
          setCartItems(items);
          setSubtotal(calculateSubtotal(items));
          return;
        }

        if (mode === "reorder") {
          // Simpan ke ref sekali, lalu hapus dari sessionStorage
          if (reorderItemsRef.current === null) {
            reorderItemsRef.current = sessionStorage.getItem("reorderItems");
            sessionStorage.removeItem("reorderItems");
          }

          const items = normalizeItems(safeParseItems(reorderItemsRef.current));

          if (items.length > 0) {
            setCartItems(items);
            setSubtotal(calculateSubtotal(items));
          } else {
            toast.warning("Data pesanan tidak ditemukan, silakan coba lagi.");
            router.push("/orders");
          }
          return;
        }

        // default: cart
        const cartRes = await fetch("/api/cart");
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const items = normalizeItems(cartData);
          setCartItems(items);
          setSubtotal(calculateSubtotal(items));
        }
      } catch (error) {
        console.error("Gagal memuat items:", error);
      }
    };

    fetchItems();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prefetch token KHUSUS mode reorder ──────────────────────
  useEffect(() => {
    if (!isReorderMode) return;
    if (prefetchCalledRef.current) return;
    if (isPreparing) return;
    if (snapToken) return;
    if (!selectedAddress) return;
    if (cartItems.length === 0) return;
    if (subtotal === 0) return;
    if (!userId) return;

    prefetchCalledRef.current = true;

    const prefetchToken = async () => {
      setIsPreparing(true);
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "reorder",
            orderId: `ORDER-${Date.now()}`,
            totalAmount: subtotal + shippingOptions[selectedShipping].price,
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
            items: cartItems.map((item, idx) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
              note: itemNotes[idx] ?? "",
            })),
          }),
        });

        const data = await response.json();
        if (data.token && data.pesananId) {
          setSnapToken(data.token);
          setPesananId(data.pesananId);
          console.log("Token reorder pre-fetched, pesananId:", data.pesananId);
        } else {
          console.error("Prefetch response tidak lengkap:", data);
          toast.danger("Gagal menyiapkan pembayaran: " + (data.error || "pesananId tidak ditemukan"));
          prefetchCalledRef.current = false;
        }
      } catch (err) {
        console.error("Prefetch token error:", err);
        toast.danger("Gagal menyiapkan pembayaran, coba refresh halaman.");
        prefetchCalledRef.current = false;
      } finally {
        setIsPreparing(false);
      }
    };

    prefetchToken();
  }, [isReorderMode, selectedAddress, cartItems, subtotal, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAmount = subtotal + shippingOptions[selectedShipping].price;

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

  // ── Bersihkan session storage setelah bayar ──────────────────
  const clearCheckoutSession = () => {
    sessionStorage.removeItem("checkoutItems");
    sessionStorage.removeItem("buyNowItem");
    sessionStorage.removeItem("reorderItems");
  };

  // ── Checkout ─────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedAddress) {
      toast.warning("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    if (cartItems.length === 0 || subtotal <= 0) {
      toast.warning("Tidak ada produk untuk checkout.");
      return;
    }

    // ── REORDER: pakai token yang sudah di-prefetch ──────────
    if (isReorderMode) {
      if (isPreparing || !snapToken) {
        toast.warning("Sistem pembayaran sedang disiapkan, tunggu sebentar lalu coba lagi.");
        return;
      }

      if (!isSnapReady || !(window as any).snap) {
        toast.warning("Sistem pembayaran belum siap, tunggu sebentar lalu coba lagi.");
        return;
      }

      // Validasi pesananId ada sebelum lanjut
      if (!pesananId) {
        toast.danger("ID pesanan tidak ditemukan, coba refresh halaman.");
        return;
      }

      try {
        if (typeof (window as any).snap?.hide === "function") {
          (window as any).snap.hide();
        }
      } catch (_) { /* ignore */ }

      (window as any).snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          console.log("Midtrans onSuccess (reorder), pesananId:", pesananId, result);
          const ok = await updateOrderStatus(pesananId);
          if (!ok) {
            // Gagal update tapi bayar sudah berhasil — tetap redirect
            // supaya user tidak bingung. Admin bisa fix manual di Supabase.
            console.warn("Status update gagal, tapi pembayaran sukses. Update manual di Supabase.");
          }
          clearCheckoutSession();
          toast.success("Bayar Berhasil!");
          router.push("/DashboardProduct");
        },
        onPending: () => {
          toast.warning("Selesaikan pembayaran ya!");
        },
        onError: () => {
          toast.danger("Yah, gagal bayar.");
        },
        onClose: () => {
          console.log("User menutup popup Midtrans (reorder).");
        },
      });

      return;
    }

    // ── FLOW NORMAL: cart / selected_cart / buy_now ──────────
    if (!isSnapReady) {
      toast.warning("Sistem pembayaran belum siap, tunggu sebentar lalu coba lagi.");
      return;
    }

    setIsLoading(true);

    try {
      const orderId = `ORDER-${Date.now()}`;

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

      if (!data.token) {
        toast.danger("Gagal Checkout: " + (data.error || "token Midtrans tidak ditemukan."));
        setIsLoading(false);
        return;
      }

      // Validasi pesananId dari response checkout
      if (!data.pesananId) {
        console.error("pesananId tidak ada di response checkout:", data);
        toast.danger("Gagal Checkout: ID pesanan tidak ditemukan.");
        setIsLoading(false);
        return;
      }

      if (!(window as any).snap) {
        toast.danger("Sistem Midtrans belum siap. Coba refresh halaman.");
        setIsLoading(false);
        return;
      }

      try {
        if (typeof (window as any).snap?.hide === "function") {
          (window as any).snap.hide();
        }
      } catch (_) { /* ignore */ }

      (window as any).snap.pay(data.token, {
        onSuccess: async (result: any) => {
          console.log("Midtrans onSuccess, pesananId:", data.pesananId, result);
          const ok = await updateOrderStatus(data.pesananId);
          if (!ok) {
            console.warn("Status update gagal, tapi pembayaran sukses. Update manual di Supabase.");
          }
          clearCheckoutSession();
          toast.success("Bayar Berhasil!");
          router.push("/DashboardProduct");
        },
        onPending: () => {
          toast.warning("Selesaikan pembayaran ya!");
          setIsLoading(false);
        },
        onError: () => {
          toast.danger("Yah, gagal bayar.");
          setIsLoading(false);
        },
        onClose: () => {
          console.log("User menutup popup Midtrans.");
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error(err);
      toast.danger("Sistem sibuk, coba lagi nanti.");
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
                disabled={
                  subtotal === 0 ||
                  cartItems.length === 0 ||
                  (isReorderMode ? isPreparing || !snapToken : isLoading)
                }
              >
                {isReorderMode
                  ? isPreparing
                    ? "Menyiapkan Pembayaran..."
                    : snapToken
                    ? "CHECKOUT"
                    : "Memuat..."
                  : isLoading
                  ? "LOADING..."
                  : "CHECKOUT"}
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

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="checkout-view"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <p>Memuat...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
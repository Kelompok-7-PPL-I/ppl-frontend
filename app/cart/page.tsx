"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import {
  mdiChevronLeft,
  mdiDeleteOutline,
  mdiMinus,
  mdiPlus,
  mdiCartOutline,
} from "@mdi/js";
import styles from "./CartPage.module.css";

interface CartItem {
  id_keranjang: number;
  id_produk: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  checked: boolean;
}

export default function CartPage() {
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();

      if (res.ok) {
        setCartItems(data);
      }
    } catch (err) {
      console.error("Gagal mengambil keranjang", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchCart();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleCheckoutSelectedItems = () => {
    const selectedItems = cartItems
      .filter((item) => item.checked)
      .map((item) => ({
        id: item.id_produk,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

    if (selectedItems.length === 0) {
      showToast("Pilih minimal satu produk dulu");
      return;
    }

    sessionStorage.setItem("checkoutItems", JSON.stringify(selectedItems));
    router.push("/checkout?mode=selected-cart");
  };

  const updateQty = async (id_keranjang: number, delta: number) => {
    const item = cartItems.find((i) => i.id_keranjang === id_keranjang);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);

    setCartItems((prev) =>
      prev.map((i) =>
        i.id_keranjang === id_keranjang ? { ...i, quantity: newQty } : i
      )
    );

    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_keranjang, quantity: newQty }),
    });
  };

  const toggleCheck = (id_keranjang: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id_keranjang === id_keranjang
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  const toggleSelectAll = () => {
    const allChecked =
      cartItems.length > 0 && cartItems.every((item) => item.checked);

    setCartItems((prev) =>
      prev.map((item) => ({ ...item, checked: !allChecked }))
    );
  };

  const removeItem = async (id_keranjang: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id_keranjang !== id_keranjang)
    );

    setConfirmId(null);
    showToast("Produk dihapus dari keranjang");

    await fetch(`/api/cart?id=${id_keranjang}`, {
      method: "DELETE",
    });
  };

  const subtotal = cartItems
    .filter((item) => item.checked)
    .reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  const selectedCount = cartItems.filter((item) => item.checked).length;

  const allChecked =
    cartItems.length > 0 && cartItems.every((item) => item.checked);

  const formatPrice = (price: number) =>
    isClient ? `Rp ${price.toLocaleString("id-ID")}` : "Rp 0";

  return (
    <div className={styles["cart-view"]}>
      {toast && <div className={styles["cart-toast"]}>{toast}</div>}

      {confirmId !== null && (
        <div className={styles["cart-confirm-overlay"]}>
          <div className={styles["cart-confirm-box"]}>
            <p className={styles["cart-confirm-title"]}>Hapus produk?</p>
            <p className={styles["cart-confirm-sub"]}>
              Produk ini akan dihapus dari keranjangmu.
            </p>

            <div className={styles["cart-confirm-btns"]}>
              <button
                className={styles["cart-confirm-cancel"]}
                onClick={() => setConfirmId(null)}
              >
                Batal
              </button>

              <button
                className={styles["cart-confirm-ok"]}
                onClick={() => removeItem(confirmId)}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles["cart-header"]}>
        <button className={styles["back-btn"]} onClick={() => window.history.back()}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </button>

        <span className={styles["cart-header-title"]}>Keranjang Belanja</span>
        <span className={styles["cart-header-badge"]}>{cartItems.length}</span>
      </div>

      <div className={styles["cart-container"]}>
        {!isLoading && cartItems.length === 0 && (
          <div className={styles["cart-empty"]}>
            <div className={styles["cart-empty-icon"]}>
              <Icon path={mdiCartOutline} size={1.6} color="#c8b97a" />
            </div>

            <p className={styles["cart-empty-title"]}>Keranjangmu kosong</p>
            <p className={styles["cart-empty-sub"]}>
              Yuk mulai belanja produk pangan lokal pilihan!
            </p>
          </div>
        )}

        <div className={styles["cart-list"]}>
          {isLoading ? (
            <p style={{ textAlign: "center", marginTop: 20 }}>
              Memuat keranjang...
            </p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id_keranjang} className={styles["cart-item-wrapper"]}>
                <div
                  className={`${styles["item-checkbox-custom"]} ${
                    item.checked ? styles.checked : ""
                  }`}
                  onClick={() => toggleCheck(item.id_keranjang)}
                />

                <div className={`${styles["item-card"]} ${item.checked ? styles.selected : ""}`}>
                  <img src={item.image} alt={item.name} className={styles["item-img"]} />

                  <div className={styles["item-info"]}>
                    <div className={styles["item-header"]}>
                      <h3 className={styles["item-name"]}>{item.name}</h3>

                      <button
                        className={styles["btn-hapus-icon"]}
                        onClick={() => setConfirmId(item.id_keranjang)}
                        title="Hapus produk"
                      >
                        <Icon path={mdiDeleteOutline} size={0.7} />
                      </button>
                    </div>

                    <div className={styles["item-price-unit"]}>
                      {formatPrice(item.price)} / pcs
                    </div>

                    <div className={styles["item-controls"]}>
                      <div className={styles["qty-box"]}>
                        <button
                          className={styles["qty-btn"]}
                          onClick={() => updateQty(item.id_keranjang, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Icon path={mdiMinus} size={0.55} />
                        </button>

                        <span className={styles["qty-number"]}>{item.quantity}</span>

                        <button
                          className={styles["qty-btn"]}
                          onClick={() => updateQty(item.id_keranjang, 1)}
                        >
                          <Icon path={mdiPlus} size={0.55} />
                        </button>
                      </div>

                      <span className={styles["item-total-price"]}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles["cart-summary"]}>
            <p className={styles["cart-summary-title"]}>Ringkasan Belanja</p>

            <div className={styles["cart-summary-row"]}>
              <span>Subtotal produk</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className={`${styles["cart-summary-row"]} ${styles.total}`}>
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        )}
      </div>

      <footer className={styles["cart-footer"]}>
        <div className={styles["footer-content"]}>
          <div className={styles["select-all-label"]} onClick={toggleSelectAll}>
            <div
              className={`${styles["footer-checkbox-custom"]} ${
                allChecked ? styles.checked : ""
              }`}
            />

            <div className={styles["footer-label-wrap"]}>
              <span className={styles["all-checkout-text"]}>Semua</span>
              <span className={styles["selected-count-text"]}>
                {selectedCount} dipilih
              </span>
            </div>
          </div>

          <div className={styles["checkout-group"]}>
            <div className={styles["subtotal-box"]}>
              <span className={styles["label-sub"]}>Total Pembayaran</span>
              <span className={styles["value-sub"]}>{formatPrice(subtotal)}</span>
            </div>

            <button
              className={styles["btn-checkout-main"]}
              disabled={subtotal === 0}
              onClick={handleCheckoutSelectedItems}
            >
              Beli Sekarang
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
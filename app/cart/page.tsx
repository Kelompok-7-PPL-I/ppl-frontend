"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiDeleteOutline, mdiMinus, mdiPlus, mdiCartOutline } from '@mdi/js';
import './page.css';

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
  const [toast, setToast] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
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
    setTimeout(() => setToast(''), 2000);
  };

  const updateQty = async (id_keranjang: number, delta: number) => {
    const item = cartItems.find(i => i.id_keranjang === id_keranjang);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);

    // Optimistic update
    setCartItems(prev => prev.map(i =>
      i.id_keranjang === id_keranjang ? { ...i, quantity: newQty } : i
    ));

    await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_keranjang, quantity: newQty })
    });
  };

  const toggleCheck = (id_keranjang: number) => {
    setCartItems(prev => prev.map(item =>
      item.id_keranjang === id_keranjang ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleSelectAll = () => {
    const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);
    setCartItems(prev => prev.map(item => ({ ...item, checked: !allChecked })));
  };

  const removeItem = async (id_keranjang: number) => {
    // Optimistic remove
    setCartItems(prev => prev.filter(item => item.id_keranjang !== id_keranjang));
    setConfirmId(null);
    showToast('Produk dihapus dari keranjang');
    await fetch(`/api/cart?id=${id_keranjang}`, { method: 'DELETE' });
  };

  const subtotal = cartItems
    .filter(item => item.checked)
    .reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const selectedCount = cartItems.filter(i => i.checked).length;
  const allChecked = cartItems.length > 0 && cartItems.every(i => i.checked);

  const formatPrice = (p: number) =>
    isClient ? `Rp ${p.toLocaleString('id-ID')}` : 'Rp 0';

  return (
    <div className="cart-view">

      {/* Toast */}
      {toast && <div className="cart-toast">{toast}</div>}

      {/* Confirm Modal */}
      {confirmId !== null && (
        <div className="cart-confirm-overlay">
          <div className="cart-confirm-box">
            <p className="cart-confirm-title">Hapus produk?</p>
            <p className="cart-confirm-sub">Produk ini akan dihapus dari keranjangmu.</p>
            <div className="cart-confirm-btns">
              <button className="cart-confirm-cancel" onClick={() => setConfirmId(null)}>Batal</button>
              <button className="cart-confirm-ok" onClick={() => removeItem(confirmId)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="cart-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </button>
        <span className="cart-header-title">Keranjang Belanja</span>
        <span className="cart-header-badge">{cartItems.length}</span>
      </div>

      <div className="cart-container">

        {/* Empty State */}
        {!isLoading && cartItems.length === 0 && (
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <Icon path={mdiCartOutline} size={1.6} color="#c8b97a" />
            </div>
            <p className="cart-empty-title">Keranjangmu kosong</p>
            <p className="cart-empty-sub">Yuk mulai belanja produk pangan lokal pilihan!</p>
          </div>
        )}

        {/* Cart Items */}
        <div className="cart-list">
          {isLoading ? (
            <p style={{textAlign:'center', marginTop:20}}>Memuat keranjang...</p>
          ) : cartItems.map((item) => (
            <div key={item.id_keranjang} className="cart-item-wrapper">
              <div
                className={`item-checkbox-custom ${item.checked ? 'checked' : ''}`}
                onClick={() => toggleCheck(item.id_keranjang)}
              />
              <div className={`item-card ${item.checked ? 'selected' : ''}`}>
                <img src={item.image} alt={item.name} className="item-img" />
                <div className="item-info">

                  {/* Nama + Tombol Hapus pojok kanan atas */}
                  <div className="item-header">
                    <h3 className="item-name">{item.name}</h3>
                    <button
                      className="btn-hapus-icon"
                      onClick={() => setConfirmId(item.id_keranjang)}
                      title="Hapus produk"
                    >
                      <Icon path={mdiDeleteOutline} size={0.7} />
                    </button>
                  </div>

                  {/* Harga satuan */}
                  <div className="item-price-unit">{formatPrice(item.price)} / pcs</div>

                  {/* Qty + Total harga */}
                  <div className="item-controls">
                    <div className="qty-box">
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(item.id_keranjang, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Icon path={mdiMinus} size={0.55} />
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(item.id_keranjang, 1)}
                      >
                        <Icon path={mdiPlus} size={0.55} />
                      </button>
                    </div>
                    <span className="item-total-price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {cartItems.length > 0 && (
          <div className="cart-summary">
            <p className="cart-summary-title">Ringkasan Belanja</p>
            <div className="cart-summary-row">
              <span>Subtotal produk</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="cart-footer">
        <div className="footer-content">
          <div className="select-all-label" onClick={toggleSelectAll}>
            <div className={`footer-checkbox-custom ${allChecked ? 'checked' : ''}`} />
            <div className="footer-label-wrap">
              <span className="all-checkout-text">Semua</span>
              <span className="selected-count-text">{selectedCount} dipilih</span>
            </div>
          </div>

          <div className="checkout-group">
            <div className="subtotal-box">
              <span className="label-sub">Total Pembayaran</span>
              <span className="value-sub">{formatPrice(subtotal)}</span>
            </div>
            <button
              className="btn-checkout-main"
              disabled={subtotal === 0}
              onClick={() => router.push('/checkout')}
            >
              Beli Sekarang
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@mdi/react';
import { mdiDeleteOutline, mdiPlus, mdiMinus, mdiChevronLeft} from '@mdi/js';
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
    
    await fetch(`/api/cart?id=${id_keranjang}`, { method: 'DELETE' });
  };

  const subtotal = cartItems
    .filter(item => item.checked)
    .reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const formatPrice = (p: number) => isClient ? `Rp ${p.toLocaleString('id-ID')}` : "Rp 0";

  return (
    <div className="cart-view">
      <div className="cart-container">
          <button className="back-btn" onClick={() => window.history.back()}>
             <Icon path={mdiChevronLeft} size={1} /> Back
          </button>
        <div className="cart-list">
          {isLoading ? <p style={{textAlign:'center', marginTop:20}}>Memuat keranjang...</p> : cartItems.length === 0 ? <p style={{textAlign:'center', marginTop:20}}>Keranjang kosong</p> : cartItems.map((item) => (
            <div key={item.id_keranjang} className="cart-item-wrapper">
              <input 
                type="checkbox" 
                className="item-checkbox" 
                checked={item.checked} 
                onChange={() => toggleCheck(item.id_keranjang)}
              />
              <div className="item-card">
                <img src={item.image} alt={item.name} className="item-img" />
                <div className="item-info">
                  <div className="item-header">
                    <h3 className="item-name">{item.name}</h3>
                    <button className="btn-hapus-top" onClick={() => removeItem(item.id_keranjang)}>
                      <Icon path={mdiDeleteOutline} size={0.7} color="red" />
                      HAPUS
                    </button>
                  </div>
                  
                  <div className="item-controls">
                    <div className="qty-box">
                      <button onClick={() => updateQty(item.id_keranjang, -1)}>
                        <Icon path={mdiMinus} size={0.8} color="black" />
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id_keranjang, 1)}>
                        <Icon path={mdiPlus} size={0.8} color="black" />
                      </button>
                    </div>
                    <span className="item-price-text">{formatPrice(item.price)}</span>
                  </div>
                  
                  <button className="btn-hapus-text" onClick={() => removeItem(item.id_keranjang)}>Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="cart-footer">
        <div className="footer-content">
          <label className="select-all-label">
            <input 
              type="checkbox" 
              className="footer-checkbox"
              checked={cartItems.length > 0 && cartItems.every(i => i.checked)} 
              onChange={toggleSelectAll}
            />
            <span className="all-checkout-text">All Checkout</span>
          </label>
          
          <div className="checkout-group">
            <div className="subtotal-box">
              <span className="label-sub">Subtotal</span>
              <span className="value-sub">{formatPrice(subtotal)}</span>
            </div>
            <button 
              className="btn-checkout-main" 
              disabled={subtotal === 0}
              onClick={() => router.push('/checkout')}
            >
              Checkout
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
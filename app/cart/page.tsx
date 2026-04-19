"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@mdi/react';
import { mdiDeleteOutline, mdiPlus, mdiMinus, mdiChevronLeft} from '@mdi/js';
import './page.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  checked: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Data simulasi (Mock Data)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, name: "Jagung Susu Keju", price: 30000, quantity: 2, image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400", checked: false },
    { id: 2, name: "Jagung Susu Keju", price: 30000, quantity: 2, image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400", checked: false },
    { id: 3, name: "Jagung Susu Keju", price: 30000, quantity: 2, image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400", checked: false },
  ]);

  useEffect(() => setIsClient(true), []);

  const updateQty = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const toggleCheck = (id: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleSelectAll = () => {
    const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);
    setCartItems(prev => prev.map(item => ({ ...item, checked: !allChecked })));
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
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
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item-wrapper">
              <input 
                type="checkbox" 
                className="item-checkbox" 
                checked={item.checked} 
                onChange={() => toggleCheck(item.id)}
              />
              <div className="item-card">
                <img src={item.image} alt={item.name} className="item-img" />
                <div className="item-info">
                  <div className="item-header">
                    <h3 className="item-name">{item.name}</h3>
                    <button className="btn-hapus-top" onClick={() => removeItem(item.id)}>
                      <Icon path={mdiDeleteOutline} size={0.7} color="red" />
                      HAPUS
                    </button>
                  </div>
                  
                  <div className="item-controls">
                    <div className="qty-box">
                      <button onClick={() => updateQty(item.id, -1)}>
                        <Icon path={mdiMinus} size={0.8} color="black" />
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)}>
                        <Icon path={mdiPlus} size={0.8} color="black" />
                      </button>
                    </div>
                    <span className="item-price-text">{formatPrice(item.price)}</span>
                  </div>
                  
                  <button className="btn-hapus-text" onClick={() => removeItem(item.id)}>Hapus</button>
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
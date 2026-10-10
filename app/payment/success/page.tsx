"use client";
import './status.css';
import { useRouter } from 'next/navigation';

export default function PaymentSuccess() {
  const router = useRouter();
  
  return (
    <div className="status-view">
      <div className="status-card-center">
        <div className="icon-circle success-bg">
          <svg viewBox="0 0 24 24" className="icon-svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        
        <h1 className="status-title">Payment Successful!</h1>
        <p className="status-subtitle">Your order is being processed and will be delivered soon</p>

        <div className="receipt-box">
          <h4 className="receipt-heading">RINCIAN PEMBAYARAN</h4>
          <div className="receipt-row"><span>Metode Pembayaran</span><span>Qris</span></div>
          <div className="receipt-row"><span>ID Transaksi</span><span>TO01-1234</span></div>
          <hr className="receipt-line" />
          <div className="receipt-row total-row">
            <span>Total Pembayaran</span>
            <span className="total-green">Rp 47.000</span>
          </div>
        </div>

        <button className="btn-status-action" onClick={() => router.push('/orders')}>
          View Order
        </button>
      </div>
    </div>
  );
}
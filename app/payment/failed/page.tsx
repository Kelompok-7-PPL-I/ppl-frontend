"use client";
import './status.css';
import { useRouter } from 'next/navigation';

export default function PaymentFailed() {
  const router = useRouter();

  return (
    <div className="status-view">
      <div className="status-card-center">
        <div className="icon-circle failed-bg">
          <span className="exclamation">!</span>
        </div>
        
        <h1 className="status-title">Payment Failed</h1>
        <p className="status-subtitle">Something went wrong with your transaction. Please check your payment details and try again.</p>

        <div className="receipt-box">
          <h4 className="receipt-heading">RINCIAN PEMBAYARAN</h4>
          <div className="receipt-row"><span>Metode Pembayaran</span><span>Qris</span></div>
          <div className="receipt-row"><span>ID Transaksi</span><span>TO01-1234</span></div>
          <hr className="receipt-line" />
          <div className="receipt-row total-row">
            <span>Total Pembayaran</span>
            <span className="total-green">Rp 70.000</span>
          </div>
        </div>

        <button className="btn-status-action" onClick={() => router.push('/payment')}>
          Try Again
        </button>
      </div>
    </div>
  );
}
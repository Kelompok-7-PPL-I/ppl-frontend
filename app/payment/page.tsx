"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@mdi/react';
import { 
  mdiChevronLeft,
} from '@mdi/js';
import './page.css';

export default function PaymentPage() {
const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(86399);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

const handleSimulateSuccess = () => router.push('/payment/success');
const handleSimulateFailed = () => router.push('/payment/failed');

<div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
  <button onClick={handleSimulateSuccess} className="btn-test">Simulasi Berhasil</button>
  <button onClick={handleSimulateFailed} className="btn-test-red">Simulasi Gagal</button>
</div>

  return (
    <div className="payment-view">
      <div className="payment-container">
        {/* Header navigasi */}
        <header className="payment-header">
          <button className="back-btn" onClick={() => window.history.back()}>
             <Icon path={mdiChevronLeft} size={1} /> Back
          </button>
          <h1 className="payment-main-title">Pembayaran</h1>
        </header>

        <div className="payment-content-grid">
          {/* Sisi Kiri: Status & Instruksi */}
          <div className="payment-info-side">
            <div className="payment-summary-box">
              <div className="summary-item-row">
                <span className="summary-label">Total Pembayaran</span>
                <span className="summary-value-highlight">Rp 81.592</span>
              </div>
              <div className="summary-item-row">
                <span className="summary-label">Bayar dalam</span>
                <div className="timer-container">
                  <span className="timer-countdown">{formatTime(timeLeft)}</span>
                  <p className="timer-deadline">Jatuh tempo 1 April 2026, 21:02</p>
                </div>
              </div>
            </div>

            <div className="qris-instructions">
              <h3 className="instructions-title">Petunjuk Pembayaran QRIS</h3>
              <ul className="instructions-list">
                <li>
                  <span className="step-badge">1</span>
                  <p>Simpan atau screenshot Kode QR, yang berlaku selama 20 menit. Kamu bisa muat ulang untuk dapatkan kode baru.</p>
                </li>
                <li>
                  <span className="step-badge">2</span>
                  <p>Scan Kode QR dengan m-banking, dompet elektronik, atau aplikasi pembayaran lain.</p>
                </li>
                <li>
                  <span className="step-badge">3</span>
                  <p>Pastikan rincian pembayaran telah sesuai, lalu lanjutkan pembayaran Anda.</p>
                </li>
                <li>
                  <span className="step-badge">4</span>
                  <p>Transaksi akan secara otomatis terbayar dan diperbarui setelah pembayaran berhasil.</p>
                </li>
                <li>
                  <span className="step-badge">5</span>
                  <p>Simpan bukti pembayaran untuk verifikasi lebih lanjut jika diperlukan di masa mendatang.</p>
                </li>
                <li>
                  <span className="step-badge">6</span>
                  <p>Pembayaran tidak dapat diproses jika menggunakan metode pembayaran yang tidak didukung.</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Sisi Kanan: QR Code */}
          <div className="payment-qr-side">
            <div className="qr-wrapper">
              <div className="qr-code-frame">
                {/* Gunakan API QR Generator agar selalu muncul QR yang valid untuk testing */}
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAYMENT_ID_12345" 
                  alt="QR Code" 
                  className="main-qr-image" 
                />
              </div>

              <p className="qr-id-number">NMID:ID2025444802321</p>
              
              <button className="btn-save-qr" onClick={() => alert('QR Code Berhasil Disimpan!')}>
                Simpan Kode QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
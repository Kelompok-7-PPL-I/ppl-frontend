"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiDownload, mdiReload } from '@mdi/js';
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

  const isUrgent = timeLeft < 300; // merah kalau < 5 menit

  const handleSimulateSuccess = () => router.push('/payment/success');
  const handleSimulateFailed = () => router.push('/payment/failed');

  return (
    <div className="payment-view">

      {/* ── Sticky Header ── */}
      <div className="payment-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </button>
        <span className="header-title">Pembayaran</span>
      </div>

      <div className="payment-container">
        <div className="payment-content-grid">

          {/* ── Kiri: Info & Instruksi ── */}
          <div className="payment-info-side">

            {/* Summary Box */}
            <div className="payment-summary-box">
              <div className="summary-item-row">
                <span className="summary-label">Total Pembayaran</span>
                <span className="summary-value-highlight">Rp 81.592</span>
              </div>
              <div className="summary-divider-line" />
              <div className="summary-item-row">
                <span className="summary-label">Bayar dalam</span>
                <div className="timer-container">
                  <span className={`timer-countdown ${isUrgent ? 'urgent' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                  <p className="timer-deadline">Jatuh tempo 1 April 2026, 21:02</p>
                </div>
              </div>
            </div>

            {/* Instruksi */}
            <div className="qris-instructions">
              <h3 className="instructions-title">Petunjuk Pembayaran QRIS</h3>
              <ul className="instructions-list">
                {[
                  "Simpan atau screenshot Kode QR, yang berlaku selama 20 menit. Kamu bisa muat ulang untuk dapatkan kode baru.",
                  "Scan Kode QR dengan m-banking, dompet elektronik, atau aplikasi pembayaran lain.",
                  "Pastikan rincian pembayaran telah sesuai, lalu lanjutkan pembayaran Anda.",
                  "Transaksi akan secara otomatis terbayar dan diperbarui setelah pembayaran berhasil.",
                  "Simpan bukti pembayaran untuk verifikasi lebih lanjut jika diperlukan di masa mendatang.",
                  "Pembayaran tidak dapat diproses jika menggunakan metode pembayaran yang tidak didukung.",
                ].map((text, i) => (
                  <li key={i}>
                    <span className="step-badge">{i + 1}</span>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Simulasi buttons */}
            <div className="simulate-row">
              <button onClick={handleSimulateSuccess} className="btn-simulate-success">
                Simulasi Berhasil
              </button>
              <button onClick={handleSimulateFailed} className="btn-simulate-failed">
                Simulasi Gagal
              </button>
            </div>
          </div>

          {/* ── Kanan: QR Code ── */}
          <div className="payment-qr-side">
            <div className="qr-wrapper">
              <div className="qr-label-top">Scan untuk membayar</div>
              <div className="qr-code-frame">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAYMENT_ID_12345"
                  alt="QR Code"
                  className="main-qr-image"
                />
              </div>
              <p className="qr-id-number">NMID:ID2025444802321</p>
              <button className="btn-save-qr" onClick={() => alert('QR Code Berhasil Disimpan!')}>
                <Icon path={mdiDownload} size={0.75} />
                Simpan Kode QR
              </button>
              <button className="btn-reload-qr" onClick={() => alert('QR Code diperbarui!')}>
                <Icon path={mdiReload} size={0.65} />
                Muat ulang QR
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
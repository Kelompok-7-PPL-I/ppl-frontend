'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';
import { useToast } from "@/app/context/ToastContext";
import './page.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [resetErrors, setResetErrors] = useState<{password?: string; confirmPassword?: string}>({});

  useEffect(() => {
    // Mengambil parameter token dari URL
    const searchParams = new URLSearchParams(window.location.search);
    setToken(searchParams.get('token'));
  }, []);

  const requirements = [
    { re: /.{8,}/, label: "Minimal 8 Karakter" },
    { re: /[A-Z]/, label: "Minimal 1 Huruf Besar" },
    { re: /[0-9]/, label: "Minimal 1 Angka" },
    { re: /^[a-zA-Z0-9.]+$/, label: "Karakter Aman" },
  ];
  
  const metReqs = requirements.filter(req => req.re.test(password)).length;
  const isMatch = password === confirmPassword && confirmPassword !== "";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (metReqs < 4 || !isMatch) return;
    
    if (!token) {
        setError("Token tidak ada. Silakan request link reset yang baru.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengubah password.");
      }

      toast.success("Password berhasil diperbarui! Silakan login kembali dengan password baru.");
      router.push('/auth'); 

    } catch (err: any) {
      toast.danger("Error: " + err.message);
      setLoading(false);
    }
  };

const handleUpdateClick = () => {
  const errors: {password?: string; confirmPassword?: string} = {};
  
  if (!password) {
    errors.password = "Password wajib diisi";
  } else if (metReqs < 4) {
    errors.password = "Password tidak memenuhi syarat";
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi";
  } else if (!isMatch) {
    errors.confirmPassword = "Password tidak cocok";
  }

  if (Object.keys(errors).length > 0) {
    setResetErrors(errors);
    return; // ← tambah return biar tidak lanjut
  }

  // Kalau valid, panggil handleUpdate
  handleUpdate({ preventDefault: () => {} } as React.FormEvent);
};

  return (
    <main className="auth-page">
      <section className="map-container" />

      <section className="form-container">
        <div className="form-card">
          
      <div className="view-section">
          <header className="form-header">
            <h2 className="form-title">New Password</h2>
            <p className="form-subtitle">Silakan masukkan kata sandi baru untuk akun Panganesia kamu.</p>
          </header>

          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleUpdateClick(); }} className="auth-form">
            <div className="input-wrapper">
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="New Password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setResetErrors(prev => ({...prev, password: undefined}));
                }}
                className={`input-field ${resetErrors.password ? 'input-error' : ''}`}
                suppressHydrationWarning
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="password-toggle">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="requirement-grid">
              {requirements.map((req, i) => {
                const met = req.re.test(password);
                return (
                  <div key={i} className={`req-item ${met ? "met" : "unmet"}`}>
                    {met ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                    <span>{req.label}</span>
                  </div>
                )
              })}
            </div>
            {resetErrors.password && <span className="error-text">{resetErrors.password}</span>}


            <div className="input-wrapper">
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setResetErrors(prev => ({...prev, confirmPassword: undefined}));
                }}
                className={`input-field ${confirmPassword ? (isMatch ? 'match' : 'no-match') : ''} ${resetErrors.confirmPassword ? 'input-error' : ''}`}
                suppressHydrationWarning
              />
            </div>
            {resetErrors.confirmPassword && <span className="error-text">{resetErrors.confirmPassword}</span>}

            <div onClick={handleUpdateClick}>
              <button 
                disabled={loading || metReqs < 4 || !isMatch} 
                className="btn-submit"
                style={{ pointerEvents: 'none' }}
              >
                {loading ? 'Updating...' : 'Update Password'} <ShieldCheck size={18} />
              </button>
            </div>
          </form>

        </div>
        </div>
      </section>
    </main>
  );
}
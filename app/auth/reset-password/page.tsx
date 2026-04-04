'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import './page.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ 
      password: password 
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert("Password berhasil diperbarui! Silakan login kembali.");
      router.push('/auth'); 
    }
  };

  return (
    <main className="auth-page">
      
      <section className="map-container" />

      <section className="form-container">
        <div className="form-card">
          
          <header className="form-header">
            <h2 className="form-title">New Password</h2>
            <p className="form-subtitle">Silakan masukkan kata sandi baru untuk akun Panganesia kamu.</p>
          </header>

          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="auth-form">
            <div className="input-wrapper">
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="New Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
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

            <div className="input-wrapper">
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`input-field ${confirmPassword ? (isMatch ? 'match' : 'no-match') : ''}`} 
              />
            </div>

            <button 
              disabled={loading || metReqs < 4 || !isMatch} 
              className="btn-submit"
            >
              {loading ? 'Updating...' : 'Update Password'} <ShieldCheck size={18} />
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}
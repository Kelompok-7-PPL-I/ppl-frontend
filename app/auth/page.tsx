'use client';

import './page.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Check, X, ArrowLeft, Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  // State Management
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States (Initialized with empty strings to avoid Uncontrolled/Controlled error)
  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Reset messages when switching between Login/Register
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [view]);

  // Password Requirements Logic
  const requirements = [
    { re: /.{8,}/, label: "Minimal 8 Karakter" },
    { re: /[A-Z]/, label: "Minimal 1 Huruf Besar" },
    { re: /[0-9]/, label: "Minimal 1 Angka" },
    { re: /^[a-zA-Z0-9.]+$/, label: "Karakter Aman" },
  ];

  const metReqs = requirements.filter(req => req.re.test(regData.password)).length;
  const isMatch = regData.password === regData.confirmPassword && regData.confirmPassword !== "";
  const isAllMet = metReqs === requirements.length;

  const getStrength = () => {
    if (regData.password.length === 0) return { label: "", color: "bg-white/10", text: "text-white/30" };
    if (metReqs <= 1) return { label: "Lemah", color: "bg-red-500", text: "text-red-500" };
    if (metReqs <= 3) return { label: "Normal", color: "bg-yellow-500", text: "text-yellow-500" };
    return { label: "Kuat", color: "bg-green-500", text: "text-green-500" };
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/DashboardProduct');
      router.refresh();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllMet || !isMatch) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: regData.email,
      password: regData.password,
      options: { 
        data: { full_name: `${regData.firstName} ${regData.lastName}` },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccessMsg("Pendaftaran berhasil! Silakan cek email kamu untuk verifikasi.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccessMsg("Link reset password telah dikirim ke email kamu!");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/DashboardProduct` },
    });
  };

  return (
    <main className="auth-page">
      <section className="map-container" />
      
      <section className="form-container">
        <div className="form-card">
          {error && <div className="error-alert" style={{color: '#ff4d4d', fontSize: '14px', textAlign: 'center', marginBottom: '10px'}}>{error}</div>}
          {successMsg && <div className="success-alert" style={{color: '#4ade80', fontSize: '14px', textAlign: 'center', marginBottom: '10px'}}>{successMsg}</div>}

          {view === 'forgot' ? (
            <div className="view-section">
              <button className="btn-back" onClick={() => setView('login')}>
                <ArrowLeft size={16}/> Kembali ke Login
              </button>
              <header className="form-header">
                <h2 className="form-title">Lupa Password</h2>
              </header>
              <form className="auth-form" onSubmit={handleForgotPassword}>
                <div className="input-wrapper input-with-icon">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="input-field"
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    required 
                  />
                </div>
                <button className="btn-submit" disabled={loading}>
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'} <ArrowRight size={18} />
                </button>
              </form>
            </div>
          ) : (
            <>
              {view === 'login' ? (
                <section className="view-section">
                  <header className="form-header">
                    <h2 className="form-title">Masuk</h2>
                  </header>
                  <form className="auth-form" onSubmit={handleLogin}>
                    <div className="input-wrapper input-with-icon">
                      <Mail size={18} />
                      <input 
                        type="email" 
                        placeholder="Email" 
                        className="input-field"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    {loginEmail.length > 3 && (
                      <div className="view-section">
                        <div className="input-wrapper">
                          <input 
                            type={showLoginPassword ? "text" : "password"} 
                            placeholder="Password" 
                            className="input-field"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                          <button type="button" className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                            {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <div className="forgot-password-wrapper">
                          <button type="button" className="btn-link-forgot" onClick={() => setView('forgot')}>
                            Lupa kata sandi?
                          </button>
                        </div>
                      </div>
                    )}

                    <button className="btn-submit" disabled={loading}>
                      {loading ? 'Memproses...' : 'Login'} <ArrowRight size={18} />
                    </button>

                    <div className="separator">ATAU</div>
                    
                    <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
                      <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" width={20} />
                      <span>Masuk dengan Google</span>
                    </button>
                  </form>
                </section>
              ) : (
                <section className="view-section">
                  <header className="form-header">
                    <h2 className="form-title">Daftar Akun</h2>
                  </header>
                  <form className="auth-form" onSubmit={handleRegister}>
                    <div className="row-inputs">
                      <input 
                        type="text" 
                        placeholder="Nama Depan" 
                        className="input-field" 
                        value={regData.firstName}
                        required 
                        onChange={(e) => setRegData({...regData, firstName: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Nama Belakang" 
                        className="input-field" 
                        value={regData.lastName}
                        autoComplete="off"
                        required 
                        onChange={(e) => setRegData({...regData, lastName: e.target.value})}
                      />
                    </div>
                    
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className="input-field" 
                      value={regData.email}
                      required 
                      onChange={(e) => setRegData({...regData, email: e.target.value})}
                    />

                    <div className="input-wrapper">
                      <input 
                        type={showRegPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="input-field" 
                        value={regData.password}
                        required 
                        onChange={(e) => setRegData({...regData, password: e.target.value})}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                        {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {regData.password && (
                      <div className="strength-meter">
                        <div className="strength-label">
                          <span className={getStrength().text}>Kekuatan: {getStrength().label}</span>
                          <span>{metReqs}/4 Syarat</span>
                        </div>
                        <div className="strength-bar-bg">
                          <div 
                            className={`strength-bar-fill ${getStrength().color}`} 
                            style={{ width: `${(metReqs / 4) * 100}%` }} 
                          />
                        </div>
                        <div className="requirement-grid">
                          {requirements.map((req, i) => {
                            const isMet = req.re.test(regData.password);
                            return (
                              <div key={i} className={`req-item ${isMet ? 'met' : 'unmet'}`}>
                                {isMet ? <Check size={10} /> : <X size={10} />}
                                <span>{req.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="input-wrapper">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Konfirmasi Password" 
                        className={`input-field ${regData.confirmPassword ? (isMatch ? 'match' : 'no-match') : ''}`}
                        value={regData.confirmPassword}
                        required 
                        onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    <button className="btn-submit" disabled={!isAllMet || !isMatch || loading}>
                      {loading ? 'Memproses...' : 'Daftar Sekarang'} <ArrowRight size={18} />
                    </button>

                    <div className="separator">ATAU</div>

                    <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
                      <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" width={20} />
                      <span>Daftar dengan Google</span>
                    </button>
                  </form>
                </section>
              )}

              <button className="btn-link" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
                {view === 'login' ? (
                  <>Belum punya akun? <span className="highlight-yellow">Daftar</span></>
                ) : (
                  <>Sudah punya akun? <span className="highlight-yellow">Masuk</span></>
                )}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
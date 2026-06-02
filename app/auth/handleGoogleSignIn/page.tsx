"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function HandleGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/DashboardProduct" });
    } catch (err: any) {
      setError("Gagal masuk dengan Google. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return null; // atau return komponen UI kalau ada
}

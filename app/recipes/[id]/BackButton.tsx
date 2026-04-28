"use client"; // Wajib agar bisa pakai useRouter

import { useRouter } from "next/navigation";
import "./page.css";

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="back-link"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
    >
      Back
    </button>
  );
}
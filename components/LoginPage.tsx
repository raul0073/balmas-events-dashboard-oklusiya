"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [shaking, setShaking]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(username.trim(), password);
    if (!ok) {
      setError("שם משתמש או סיסמה שגויים");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="min-h-screen bg-pikud-navy flex items-center justify-center px-4">

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

      <div className={`relative w-full max-w-sm ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-pikud-navy px-8 pt-8 pb-6 text-center border-b-4 border-pikud-orange">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pikud-orange rounded-2xl mb-4 shadow-lg">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-white font-black text-xl leading-tight">חמ&quot;ל אוכלוסייה</h1>
            <p className="text-white/50 text-sm mt-1">גדוד 996 | פיקוד העורף</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            <div className="text-center">
              <p className="text-gray-500 text-sm">נדרשת הזדהות לכניסה למערכת</p>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                autoComplete="username"
                autoFocus
                placeholder="הכנס שם משתמש"
                className="w-full h-11 px-4 rounded-lg border-2 border-gray-200 text-pikud-navy text-sm font-medium focus:outline-none focus:border-pikud-navy transition-colors placeholder:text-gray-300"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">סיסמה</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  placeholder="הכנס סיסמה"
                  className="w-full h-11 px-4 pl-11 rounded-lg border-2 border-gray-200 text-pikud-navy text-sm font-medium focus:outline-none focus:border-pikud-navy transition-colors placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-red-600 text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-11 bg-pikud-orange hover:bg-pikud-orange-dark text-white font-bold text-base rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              כניסה למערכת
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-gray-300 text-xs">גישה מורשית בלבד</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

import React, { useState } from 'react';
import { Shield } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Email/NIP dan password wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal masuk');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-sky-300 to-sky-200 text-slate-800 relative font-sans no-print">
      
      {/* Upper Content Spacer */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        
        {/* Instansi Logo Emblem */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md mb-3 border border-sky-100">
            {/* SVG Logo approximating the RSPB logo */}
            <svg viewBox="0 0 100 100" className="w-10 h-10 text-emerald-500 fill-current">
              <path d="M50,10 C27.9,10 10,27.9 10,50 C10,72.1 27.9,90 50,90 C72.1,90 90,72.1 90,50 C90,27.9 72.1,10 50,10 Z M50,82 C32.3,82 18,67.7 18,50 C18,32.3 32.3,18 50,18 C67.7,18 82,32.3 82,50 C82,67.7 67.7,82 50,82 Z" className="text-sky-500" />
              <path d="M50,25 C36.2,25 25,36.2 25,50 C25,63.8 36.2,75 50,75 C63.8,75 75,63.8 75,50 C75,36.2 63.8,25 50,25 Z M50,67 C40.6,67 33,59.4 33,50 C33,40.6 40.6,33 50,33 C59.4,33 67,40.6 67,50 C67,59.4 59.4,67 50,67 Z" className="text-emerald-500" />
              <rect x="46" y="38" width="8" height="24" className="text-emerald-500" />
              <rect x="38" y="46" width="24" height="8" className="text-emerald-500" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">
            SIPEKAL RSPB
          </h1>
          <p className="text-xs text-sky-100 font-semibold mt-1">
            Silakan masuk untuk absen
          </p>
        </div>

        {/* Input fields card */}
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-sky-100 space-y-6 text-left">
          
          <div>
            <label className="block text-slate-400 font-bold text-xs uppercase tracking-wide mb-1.5 pl-0.5">
              Email / NIP
            </label>
            <input
              type="text"
              required
              placeholder="Ketik email atau NIP"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-sky-400 font-semibold text-slate-800 placeholder-slate-300"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold text-xs uppercase tracking-wide mb-1.5 pl-0.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-sky-400 font-semibold text-slate-800 placeholder-slate-300"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-2.5 rounded-xl text-center">
              {errorMsg}
            </div>
          )}
          
          {/* Invisible submit button to support keyboard enter key */}
          <button type="submit" className="hidden" />

        </form>

        {/* Footer */}
        <div className="text-sky-900/60 font-semibold text-xs mt-6">
          Developed by stmuliarrh
        </div>

      </div>

      {/* Full Width Login Button fixed to bottom */}
      <div className="w-full">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 md:py-5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-sm tracking-widest uppercase transition-all select-none shadow-inner"
        >
          {loading ? 'MEMPROSES MASUK...' : 'MASUK SEKARANG'}
        </button>
      </div>

    </div>
  );
}

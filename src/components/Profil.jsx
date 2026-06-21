import React, { useState } from 'react';
import { Camera, Save, User, ShieldAlert } from 'lucide-react';

export default function Profil({ user, onUpdateUser }) {
  const [password, setPassword] = useState('');
  const [submittingPass, setSubmittingPass] = useState(false);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  // Handle Photo Upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Str = reader.result;
      
      setSubmittingPhoto(true);
      try {
        const response = await fetch('/.netlify/functions/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            foto_profil: base64Str,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Gagal mengunggah foto');
        }

        alert('Foto profil berhasil diperbarui!');
        onUpdateUser(data.user); // Update global user state
      } catch (err) {
        alert(err.message);
      } finally {
        setSubmittingPhoto(false);
      }
    };
    reader.onerror = (error) => {
      console.error('Error base64 conversion:', error);
      alert('Gagal memproses file foto.');
    };
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      alert('Ketik kata sandi baru Anda');
      return;
    }

    setSubmittingPass(true);
    try {
      const response = await fetch('/.netlify/functions/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah kata sandi');
      }

      alert('Kata sandi berhasil diubah!');
      setPassword('');
      onUpdateUser(data.user); // Update global user state
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingPass(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative pb-20 no-print">
      
      {/* Header */}
      <div className="bg-sky-400 p-4 pt-6 px-6 flex items-center justify-between text-sky-950 shadow-sm border-b border-sky-300">
        <h2 className="text-lg font-bold">Profil</h2>
      </div>

      <div className="p-4 md:p-6 space-y-4 max-w-md mx-auto w-full flex-1">
        
        {/* Photo Upload Card */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative group">
            {user?.foto_profil ? (
              <img 
                src={user.foto_profil} 
                alt="Profile Large" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white bg-slate-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center shadow-md">
                <User size={48} className="text-slate-400" />
              </div>
            )}
            
            {/* Upload Circle Button */}
            <label 
              htmlFor="profile-upload" 
              className={`absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full cursor-pointer shadow-md transition-colors flex items-center justify-center ${
                submittingPhoto ? 'animate-pulse' : ''
              }`}
            >
              <Camera size={14} />
              <input 
                type="file" 
                id="profile-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoChange}
                disabled={submittingPhoto}
              />
            </label>
          </div>
          {submittingPhoto && (
            <span className="text-[10px] text-purple-600 font-bold mt-2 animate-pulse">
              Mengunggah...
            </span>
          )}
        </div>

        {/* Form Profil Karyawan (Disabled/Read-only) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Informasi Karyawan
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Id Karyawan
            </label>
            <input
              type="text"
              disabled
              value={user?.id || '-'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nama
            </label>
            <input
              type="text"
              disabled
              value={user?.nama || '-'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Jam Kerja
            </label>
            <input
              type="text"
              disabled
              value={user?.jam_kerja || '5 Hari Kerja'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Lokasi Penempatan
            </label>
            <input
              type="text"
              disabled
              value={user?.lokasi_penempatan || 'RSUD PAMBALAH BATUNG Baru'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            disabled
            className="w-full py-3 bg-pink-500/50 text-white rounded-xl font-bold text-sm cursor-not-allowed"
          >
            Simpan (Profil Terkunci)
          </button>
        </div>

        {/* Update Password Form (Editable) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Update Password
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Kode Pegawai
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password baru
              </label>
              <input
                type="password"
                required
                placeholder="Ketik password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 font-semibold text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPass}
              className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-sm transition-all active:scale-98 shadow-md"
            >
              {submittingPass ? 'MENYIMPAN...' : 'Simpan'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

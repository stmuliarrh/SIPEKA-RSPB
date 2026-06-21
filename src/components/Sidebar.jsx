import React from 'react';
import { Home, Camera, FileText, LogOut, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose, user, onNavigate, onLogout }) {
  if (!isOpen) return null;

  const menuItems = [
    { name: 'Home', icon: Home, screen: 'home' },
    { name: 'Absen', icon: Camera, screen: 'absen' },
    { name: 'Riwayat', icon: FileText, screen: 'riwayat' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex no-print">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl transition-transform duration-300 transform translate-x-0">
        
        {/* Profile Header */}
        <div className="bg-sky-400 p-6 flex items-center justify-between text-slate-800 relative border-b border-sky-300">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user?.foto_profil ? (
                <img 
                  src={user.foto_profil} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white bg-slate-100 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center shadow-md">
                  <div className="w-10 h-10 rounded-full bg-slate-400" />
                </div>
              )}
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg leading-tight text-sky-950">
                {user?.nama || 'Pengawai Baru'}
              </h3>
              <p className="text-xs text-sky-900 font-semibold mt-1">
                NIP: {user?.nip || '-'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-sky-500/20 text-sky-950 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 text-left">
            Menu Utama
          </p>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.screen}
                onClick={() => {
                  onNavigate(item.screen);
                  onClose();
                }}
                className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-all font-medium text-left group"
              >
                <div className="p-2 rounded-lg bg-sky-50 text-sky-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                  <Icon size={20} />
                </div>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer with logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium text-left group"
          >
            <div className="p-2 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
              <LogOut size={20} />
            </div>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

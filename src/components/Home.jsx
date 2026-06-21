import React, { useState, useEffect } from 'react';
import { Menu, MapPin, Fingerprint, RefreshCw } from 'lucide-react';

const SHIFTS = [
  { id: 'shift_pagi', name: 'SHIFT PAGI', hours: '08:00:00 – 14:00:00' },
  { id: '5_hari', name: '5 Hari Kerja', hours: '08:00:00 – 11:30:00' },
  { id: 'shift_siang', name: 'SHIFT SIANG', hours: '14:00:00 – 21:00:00' },
  { id: 'shift_malam', name: 'SHIFT MALAM', hours: '21:00:00 – 08:00:00' },
  { id: '6_hari', name: '6 hari kerja', hours: '08:00:00 – 14:00:00' },
  { id: 'koperasi_sore', name: 'Koperasi - Sore', hours: '15:00:00 – 20:30:00' },
  { id: 'driver_pagi', name: 'Driver Pagi', hours: '08:00:00 – 14:00:00' },
  { id: 'driver_siang', name: 'Driver Siang', hours: '13:30:30 – 20:30:00' },
  { id: 'driver_subuh', name: 'Driver Subuh', hours: '05:00:00 – 12:00:00' },
];

export default function Home({ 
  user, 
  onOpenSidebar, 
  activeShift, 
  setActiveShift, 
  locationStatus, 
  onNavigate,
  todayRecord,
  onRefresh
}) {
  const [time, setTime] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time clock: HH.MM.SS (using dots as shown in screenshots)
  const formatTime = (date) => {
    const hrs = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    return `${hrs}.${mins}.${secs}`;
  };

  // Get Indonesian date format
  const formatDateIndo = (date) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = time.getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative pb-20 no-print">
      
      {/* Top Banner Greeting */}
      <div className="bg-sky-100 p-4 pt-6 px-6 flex items-center justify-between text-slate-800">
        <div className="text-left">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-tight">
            {getGreeting()}, {user?.nama || 'Karyawan'}
          </h2>
          
          {/* Location Status Badge */}
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-red-500 font-semibold">
            <MapPin size={14} className="fill-red-500/20 text-red-500 animate-pulse" />
            <span>{locationStatus || 'Mendeteksi Lokasi...'}</span>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="p-4 md:p-6 space-y-4 max-w-md mx-auto w-full flex-1">
        
        {/* Clock & Date Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Sidebar Toggle Button */}
          <button 
            onClick={onOpenSidebar}
            className="absolute left-4 top-4 p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Clock Display */}
          <div className="text-5xl md:text-6xl font-black text-sky-500 font-mono tracking-wider mt-4">
            {formatTime(time)}
          </div>
          
          {/* Date Display */}
          <div className="text-slate-600 font-semibold mt-2 text-sm">
            {formatDateIndo(time)}
          </div>

          {/* Check In / Check Out Status Bar */}
          <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-700 font-mono">
                {todayRecord?.check_in ? todayRecord.check_in : '--:--:--'}
              </div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
                Check In
              </div>
              {todayRecord?.status_check_in && (
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                  todayRecord.status_check_in === 'Tepat Waktu' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {todayRecord.status_check_in}
                </span>
              )}
            </div>
            
            <div className="border-l border-slate-100">
              <div className="text-2xl font-bold text-slate-700 font-mono">
                {todayRecord?.check_out ? todayRecord.check_out : '--:--:--'}
              </div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
                Check Out
              </div>
              {todayRecord?.status_check_out && (
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                  todayRecord.status_check_out === 'Tepat Waktu' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {todayRecord.status_check_out}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shift Selection Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
            <span>Shift Hari Ini</span>
          </div>

          <div className="text-sky-500 font-bold text-sm mb-3">
            {activeShift?.name} | {activeShift?.hours}
          </div>

          {/* Shift Badge Pills Grid */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {SHIFTS.map((shift) => {
              const isSelected = activeShift?.id === shift.id;
              return (
                <button
                  key={shift.id}
                  onClick={() => setActiveShift(shift)}
                  className={`text-xs px-3 py-2 rounded-xl border transition-all font-semibold ${
                    isSelected 
                      ? 'bg-sky-500 border-sky-500 text-white shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {shift.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fingerprint Actions Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
          <div className="text-left flex-1 pr-4">
            <p className="text-slate-600 font-semibold text-sm leading-snug">
              {todayRecord?.check_out 
                ? 'Presensi kehadiran hari ini telah selesai.' 
                : todayRecord?.check_in 
                  ? 'Tekan tombol di samping untuk check out (pulang)' 
                  : 'Tekan tombol di samping untuk check in (masuk)'}
            </p>
          </div>
          
          <button 
            disabled={!!todayRecord?.check_out}
            onClick={() => onNavigate('absen')}
            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center shadow-md ${
              todayRecord?.check_out
                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
                : 'bg-teal-50 border-teal-500 text-teal-600 hover:bg-teal-100 hover:scale-105 active:scale-95'
            }`}
          >
            <Fingerprint size={32} />
          </button>
        </div>

        {/* Refresh Page Button */}
        <button 
          onClick={onRefresh}
          className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm"
        >
          <RefreshCw size={18} className="animate-spin-hover" />
          <span>MUAT ULANG HALAMAN</span>
        </button>

      </div>
    </div>
  );
}

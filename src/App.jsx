import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import Absen from './components/Absen';
import Riwayat from './components/Riwayat';
import Profil from './components/Profil';
import Sidebar from './components/Sidebar';
import { Home as HomeIcon, Camera, Calendar, User } from 'lucide-react';

const LOCATIONS = [
  { name: 'RSUD PEMBALAH BATUNG LAMA', lat: -2.4241, lon: 115.2476 },
  { name: 'RSUD PEMBALAH BATUNG BARU', lat: -2.4115, lon: 115.2584 },
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('home'); // home, absen, riwayat, profil
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeShift, setActiveShift] = useState({
    id: 'shift_pagi',
    name: 'SHIFT PAGI',
    hours: '08:00:00 – 14:00:00'
  });
  const [locationStatus, setLocationStatus] = useState('Mendeteksi Lokasi...');
  const [historyData, setHistoryData] = useState({ records: [], summary: { hadir: 0, terlambat: 0, sakit: 0, izin: 0 } });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);

  // 1. Check local storage for session
  useEffect(() => {
    const savedUser = localStorage.getItem('sipekal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Fetch history when user is set or screen changed to home/riwayat
  const fetchLogs = async (currentUser) => {
    const activeUser = currentUser || user;
    if (!activeUser) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`/.netlify/functions/history?userId=${activeUser.id}`);
      const data = await response.json();
      if (response.ok) {
        setHistoryData(data);
        
        // Find today's check-in record
        const now = new Date();
        const witaOffset = 8 * 60;
        const witaTime = new Date(now.getTime() + (now.getTimezoneOffset() + witaOffset) * 60000);
        const y = witaTime.getFullYear();
        const m = String(witaTime.getMonth() + 1).padStart(2, '0');
        const d = String(witaTime.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const todayRec = data.records.find(r => r.tanggal === todayStr);
        setTodayRecord(todayRec || null);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, screen]);

  // 3. Monitor Location permission and distance status
  useEffect(() => {
    if (!user) return;

    const checkGPS = () => {
      if (!navigator.geolocation) {
        setLocationStatus('GPS tidak didukung browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          let minDistance = Infinity;
          LOCATIONS.forEach(loc => {
            const dist = getDistance(lat, lon, loc.lat, loc.lon);
            if (dist < minDistance) minDistance = dist;
          });

          if (minDistance <= 100) {
            setLocationStatus('GPS Aktif (Di area RSUD)');
          } else {
            setLocationStatus(`GPS Aktif (Di luar area: ${minDistance.toFixed(0)}m)`);
          }
        },
        (error) => {
          setLocationStatus('GPS Tidak Aktif');
        },
        { enableHighAccuracy: true }
      );
    };

    checkGPS();
    const interval = setInterval(checkGPS, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('sipekal_user', JSON.stringify(userData));
    fetchLogs(userData);
    setScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setTodayRecord(null);
    setHistoryData({ records: [], summary: { hadir: 0, terlambat: 0, sakit: 0, izin: 0 } });
    localStorage.removeItem('sipekal_user');
  };

  const handleUpdateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('sipekal_user', JSON.stringify(updatedUserData));
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative select-none">
      
      {/* Sidebar Navigation Drawer */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onNavigate={setScreen}
        onLogout={handleLogout}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col">
        {screen === 'home' && (
          <Home 
            user={user}
            onOpenSidebar={() => setSidebarOpen(true)}
            activeShift={activeShift}
            setActiveShift={setActiveShift}
            locationStatus={locationStatus}
            onNavigate={setScreen}
            todayRecord={todayRecord}
            onRefresh={() => fetchLogs()}
          />
        )}
        {screen === 'absen' && (
          <Absen 
            user={user}
            activeShift={activeShift}
            todayRecord={todayRecord}
            onNavigate={setScreen}
            onAttendanceSuccess={() => fetchLogs()}
          />
        )}
        {screen === 'riwayat' && (
          <Riwayat 
            user={user}
            historyData={historyData}
            onRefresh={() => fetchLogs()}
            loading={loadingHistory}
          />
        )}
        {screen === 'profil' && (
          <Profil 
            user={user}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-40 shadow-md no-print max-w-lg mx-auto rounded-t-2xl">
        <button
          onClick={() => setScreen('home')}
          className={`flex flex-col items-center justify-center space-y-1 w-16 h-full transition-colors ${
            screen === 'home' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HomeIcon size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setScreen('absen')}
          className={`flex flex-col items-center justify-center space-y-1 w-16 h-full transition-colors ${
            screen === 'absen' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Camera size={20} />
          <span className="text-[10px] font-bold">Absen</span>
        </button>

        <button
          onClick={() => setScreen('riwayat')}
          className={`flex flex-col items-center justify-center space-y-1 w-16 h-full transition-colors ${
            screen === 'riwayat' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar size={20} />
          <span className="text-[10px] font-bold">Cuty</span>
        </button>

        <button
          onClick={() => setScreen('profil')}
          className={`flex flex-col items-center justify-center space-y-1 w-16 h-full transition-colors ${
            screen === 'profil' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={20} />
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </nav>

    </div>
  );
}

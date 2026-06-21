import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, AlertCircle, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';

const LOCATIONS = [
  { name: 'RSUD PEMBALAH BATUNG LAMA', lat: -2.4241, lon: 115.2476 },
  { name: 'RSUD PEMBALAH BATUNG BARU', lat: -2.4115, lon: 115.2584 },
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

export default function Absen({ user, activeShift, todayRecord, onNavigate, onAttendanceSuccess }) {
  const webcamRef = useRef(null);
  const [time, setTime] = useState(new Date());
  
  // Geolocation states
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [distanceInfo, setDistanceInfo] = useState({ minDistance: null, nearestLoc: null });
  const [loadingGPS, setLoadingGPS] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  
  // Simulation mode states
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedLocIdx, setSimulatedLocIdx] = useState(1); // Default is Baru (idx 1)

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Time ticks
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time clock: HH.MM.SS
  const formatTime = (date) => {
    const hrs = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    return `${hrs}.${mins}.${secs}`;
  };

  const formatDateIndo = (date) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get GPS Coordinates
  const fetchGPS = () => {
    if (isSimulated) {
      const target = LOCATIONS[simulatedLocIdx];
      // Simulate slightly within the boundary (e.g., offset by 0.0001 degrees ~ 10m)
      const lat = target.lat + 0.00005;
      const lon = target.lon + 0.00005;
      setCoords({ latitude: lat, longitude: lon });
      setLoadingGPS(false);
      setGpsError(null);
      return;
    }

    setLoadingGPS(true);
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung Geolocation.');
      setLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsError(null);
        setLoadingGPS(false);
      },
      (error) => {
        console.error('GPS Error:', error);
        let msg = 'Gagal mengakses GPS. Harap berikan izin akses lokasi.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak. Aktifkan lokasi perangkat Anda.';
        }
        setGpsError(msg);
        setLoadingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Run GPS lookup when mount or when simulation toggled
  useEffect(() => {
    fetchGPS();
  }, [isSimulated, simulatedLocIdx]);

  // Recalculate distance when coordinates change
  useEffect(() => {
    if (coords.latitude && coords.longitude) {
      let minDistance = Infinity;
      let nearestLoc = null;

      LOCATIONS.forEach((loc) => {
        const dist = getDistance(coords.latitude, coords.longitude, loc.lat, loc.lon);
        if (dist < minDistance) {
          minDistance = dist;
          nearestLoc = loc;
        }
      });

      setDistanceInfo({ minDistance, nearestLoc });
    }
  }, [coords]);

  const handleCaptureAndSubmit = async () => {
    if (!webcamRef.current) return;
    const base64Image = webcamRef.current.getScreenshot();
    if (!base64Image) {
      alert('Gagal mengambil foto dari kamera. Coba lagi.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const type = todayRecord?.check_in ? 'check_out' : 'check_in';
    const apiEndpoint = '/.netlify/functions/attendance';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          foto: base64Image,
          type,
          shift: activeShift.name + ' (' + activeShift.hours + ')',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan absensi');
      }

      // Success
      alert(data.message);
      onAttendanceSuccess();
      onNavigate('home');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckOut = !!todayRecord?.check_in;
  const isButtonLocked = loadingGPS || !!gpsError || (distanceInfo.minDistance !== null && distanceInfo.minDistance > 100);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative pb-20 no-print">
      
      {/* Header */}
      <div className="bg-sky-400 p-4 pt-6 px-6 flex items-center text-sky-950 shadow-sm border-b border-sky-300">
        <button 
          onClick={() => onNavigate('home')} 
          className="p-1 rounded-full hover:bg-sky-500/20 mr-3 text-sky-950 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">Absensi Kehadiran</h2>
      </div>

      <div className="p-4 md:p-6 space-y-4 max-w-md mx-auto w-full flex-1">
        
        {/* Clock Banner Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-sky-500 font-mono tracking-wider">
            {formatTime(time)}
          </div>
          <div className="text-slate-500 font-semibold text-xs mt-1">
            {formatDateIndo(time)}
          </div>
        </div>

        {/* GPS Simulation Dev-Panel */}
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
              Developer Tool: Simulasi GPS
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isSimulated}
                onChange={(e) => setIsSimulated(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
          
          {isSimulated && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-orange-700">
                Pilih lokasi RSUD untuk simulasi posisi Anda di dalam radius 100 meter:
              </p>
              <div className="flex gap-2">
                {LOCATIONS.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSimulatedLocIdx(idx)}
                    className={`text-[10px] px-2 py-1.5 rounded-lg border font-bold ${
                      simulatedLocIdx === idx
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'bg-white border-orange-200 text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    {idx === 0 ? 'Lama' : 'Baru'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Distance Status Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Status Validasi Radius (100 Meter)
          </div>

          {loadingGPS ? (
            <div className="text-sm font-semibold text-slate-500 animate-pulse flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-ping"></span>
              <span>MENGECEK JARAK...</span>
            </div>
          ) : gpsError ? (
            <div className="flex items-center space-x-2 text-red-500 text-sm font-semibold">
              <AlertCircle size={18} />
              <span>{gpsError}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {distanceInfo.minDistance <= 100 ? (
                  <CheckCircle size={18} className="text-green-500 fill-green-50" />
                ) : (
                  <AlertCircle size={18} className="text-red-500 fill-red-50" />
                )}
                <span className={`text-sm font-bold ${
                  distanceInfo.minDistance <= 100 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {distanceInfo.minDistance <= 100 
                    ? 'Berada di area RSUD' 
                    : 'Di luar area RSUD'}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Jarak terdekat: <span className="text-slate-800 font-bold">{distanceInfo.minDistance?.toFixed(1)} meter</span> dari <span className="text-slate-800 font-bold">{distanceInfo.nearestLoc?.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Camera Preview Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 self-start">
            Kamera Verifikasi Wajah
          </div>
          
          <div className="w-full aspect-[4/3] max-w-sm rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'user',
                width: 640,
                height: 480
              }}
              className="w-full h-full object-cover"
            />
            
            {/* Target Area Overlay */}
            <div className="absolute inset-0 border-[30px] border-slate-900/30 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-3/4 border-2 border-dashed border-sky-400/80 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Error message if failed */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-4 rounded-xl text-left">
            ✕ {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold transition-all active:scale-98 shadow-sm"
          >
            BATAL
          </button>
          
          <button
            disabled={isButtonLocked || submitting}
            onClick={handleCaptureAndSubmit}
            className={`py-3.5 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm ${
              isButtonLocked || submitting
                ? 'bg-slate-300 cursor-not-allowed text-slate-400'
                : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            <Camera size={18} />
            <span>
              {submitting 
                ? 'MENYIMPAN...' 
                : isCheckOut 
                  ? 'ABSEN PULANG' 
                  : 'ABSEN MASUK'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

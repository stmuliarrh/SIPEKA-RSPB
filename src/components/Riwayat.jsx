import React, { useState, useEffect } from 'react';
import { Calendar, Printer, RefreshCw, X, ChevronRight, Eye, PlusCircle } from 'lucide-react';

export default function Riwayat({ user, historyData, onRefresh, loading }) {
  const [startDate, setStartDate] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null); // Detail modal
  const [showLeaveModal, setShowLeaveModal] = useState(false); // Leave submission
  const [leaveStatus, setLeaveStatus] = useState('Izin');
  const [leaveDate, setLeaveDate] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Sync records and apply filters
  useEffect(() => {
    if (historyData?.records) {
      applyFilter();
    }
  }, [historyData, startDate]);

  const applyFilter = () => {
    if (!historyData?.records) return;
    if (!startDate) {
      setFilteredRecords(historyData.records);
      return;
    }
    // Filter records where date is >= startDate
    const filtered = historyData.records.filter(r => r.tanggal >= startDate);
    setFilteredRecords(filtered);
  };

  const handleClearFilter = () => {
    setStartDate('');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      alert('Pilih tanggal cuti/izin');
      return;
    }

    setSubmittingLeave(true);
    try {
      const response = await fetch('/.netlify/functions/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tanggal: leaveDate,
          status: leaveStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengajukan izin/sakit');
      }

      alert(data.message);
      setShowLeaveModal(false);
      setLeaveDate('');
      onRefresh(); // Refresh logs
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Re-calculate statistics for the current filtered list
  const getSummary = () => {
    let hadir = 0;
    let terlambat = 0;
    let sakit = 0;
    let izin = 0;

    filteredRecords.forEach(r => {
      if (r.status === 'Hadir') {
        hadir++;
        if (r.status_check_in === 'Terlambat') {
          terlambat++;
        }
      } else if (r.status === 'Sakit') {
        sakit++;
      } else if (r.status === 'Izin' || r.status === 'Cuti') {
        izin++;
      }
    });

    return { hadir, terlambat, sakit, izin };
  };

  const summary = getSummary();

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = months[parseInt(parts[1], 10) - 1];
    const day = parts[2];
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative pb-20">
      
      {/* Printable Document Header (Hidden in Browser, visible in Print) */}
      <div className="hidden print-header text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wide">LAPORAN REKAPITULASI PRESENSI KARYAWAN</h1>
        <h2 className="text-base font-bold text-sky-700 mt-1">SIPEKAL RSPB v1.0</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 text-left text-sm max-w-xl mx-auto border-t border-b border-black py-4">
          <div>
            <p><span className="font-bold">Nama Karyawan:</span> {user?.nama}</p>
            <p><span className="font-bold">NIP:</span> {user?.nip}</p>
          </div>
          <div>
            <p><span className="font-bold">Lokasi Penempatan:</span> {user?.lokasi_penempatan}</p>
            <p><span className="font-bold">Jam Kerja:</span> {user?.jam_kerja}</p>
          </div>
        </div>
      </div>

      {/* Screen Title */}
      <div className="bg-sky-400 p-4 pt-6 px-6 flex items-center justify-between text-sky-950 shadow-sm border-b border-sky-300 no-print">
        <h2 className="text-lg font-bold">Riwayat & Cuty</h2>
        
        {/* Submit Leave Button */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-sky-950 text-white rounded-xl text-xs font-bold hover:bg-sky-900 transition-colors shadow-sm"
        >
          <PlusCircle size={14} />
          <span>Ajukan Izin/Sakit</span>
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full flex-1">
        
        {/* Filters Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Calendar size={18} />
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 text-slate-800 font-semibold"
              />
            </div>
            {startDate && (
              <button 
                onClick={handleClearFilter}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={applyFilter}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              ✓ Tampilkan
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Printer size={16} />
              <span>🖨️ Cetak</span>
            </button>
          </div>
        </div>

        {/* Tabular Attendance Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-container">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">No</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Absen Masuk</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Absen Pulang</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
                      <RefreshCw className="animate-spin inline-block mr-2 text-sky-400" />
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
                      Tidak ada data absensi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-800 font-bold text-left">
                        {formatDateReadable(record.tanggal)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-left">
                        {record.status === 'Hadir' ? (
                          record.check_in ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-700">{record.check_in}</span>
                              <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 w-max ${
                                record.status_check_in === 'Tepat Waktu' 
                                  ? 'bg-green-50 text-green-600 badge-tepat-waktu' 
                                  : 'bg-red-50 text-red-600 badge-telat'
                              }`}>
                                {record.status_check_in}
                              </span>
                            </div>
                          ) : '--:--:--'
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-left">
                        {record.status === 'Hadir' ? (
                          record.check_out ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-700">{record.check_out}</span>
                              <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 w-max ${
                                record.status_check_out === 'Tepat Waktu' 
                                  ? 'bg-green-50 text-green-600 badge-tepat-waktu' 
                                  : 'bg-orange-50 text-orange-600 badge-telat'
                              }`}>
                                {record.status_check_out}
                              </span>
                            </div>
                          ) : '--:--:--'
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-left">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                          record.status === 'Hadir' 
                            ? 'bg-green-100 text-green-800' 
                            : record.status === 'Sakit' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 no-print text-left">
                        {record.status === 'Hadir' && (record.foto_in || record.foto_out) ? (
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition-colors flex items-center space-x-1 text-xs font-bold"
                          >
                            <Eye size={14} />
                            <span>Detail</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Table Recap Badges */}
          <div className="bg-slate-50 px-4 py-3.5 border-t border-slate-150 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Rekapitulasi:</span>
            <span className="text-xs font-extrabold px-3 py-1 bg-green-100 text-green-800 rounded-full badge-rekap">
              Hadir: {summary.hadir}
            </span>
            <span className="text-xs font-extrabold px-3 py-1 bg-red-100 text-red-800 rounded-full badge-rekap">
              Terlambat: {summary.terlambat}
            </span>
            <span className="text-xs font-extrabold px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full badge-rekap">
              Sakit: {summary.sakit}
            </span>
            <span className="text-xs font-extrabold px-3 py-1 bg-purple-100 text-purple-800 rounded-full badge-rekap">
              Izin: {summary.izin}
            </span>
          </div>
        </div>

      </div>

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 no-print">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setShowLeaveModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4 text-left">
              Form Pengajuan Cuti / Izin
            </h3>

            <form onSubmit={handleSubmitLeave} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipe Cuti / Izin
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Izin', 'Sakit', 'Cuti'].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setLeaveStatus(type)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        leaveStatus === type 
                          ? 'bg-sky-500 border-sky-500 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal Pengajuan
                </label>
                <input
                  type="date"
                  required
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm transition-all shadow-md mt-6"
              >
                {submittingLeave ? 'MENYIMPAN...' : 'AJUKAN SEKARANG'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Detail Viewer Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4 text-left">
              Detail Absensi - {formatDateReadable(selectedRecord.tanggal)}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              
              {/* Check In Details */}
              {selectedRecord.check_in && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-green-600">
                    Masuk ({selectedRecord.status_check_in})
                  </div>
                  
                  {selectedRecord.foto_in ? (
                    <img 
                      src={selectedRecord.foto_in} 
                      alt="Selfie Check In" 
                      className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200 mb-3 bg-slate-100"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-slate-200 text-slate-400 text-xs flex items-center justify-center rounded-lg mb-3">
                      Tidak ada foto
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600">Waktu: <span className="font-mono font-bold text-slate-800">{selectedRecord.check_in}</span></p>
                    <p className="text-slate-600">Jarak: <span className="font-bold text-slate-800">{Number(selectedRecord.distance_in)?.toFixed(1)}m</span></p>
                    <p className="text-slate-600 overflow-hidden text-ellipsis">Coords: <span className="font-mono font-bold text-slate-800 text-[10px]">{Number(selectedRecord.latitude_in)?.toFixed(5)}, {Number(selectedRecord.longitude_in)?.toFixed(5)}</span></p>
                  </div>
                </div>
              )}

              {/* Check Out Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-orange-600">
                  Pulang ({selectedRecord.status_check_out || 'Belum Absen'})
                </div>
                
                {selectedRecord.check_out ? (
                  <>
                    {selectedRecord.foto_out ? (
                      <img 
                        src={selectedRecord.foto_out} 
                        alt="Selfie Check Out" 
                        className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200 mb-3 bg-slate-100"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-slate-200 text-slate-400 text-xs flex items-center justify-center rounded-lg mb-3">
                        Tidak ada foto
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-600">Waktu: <span className="font-mono font-bold text-slate-800">{selectedRecord.check_out}</span></p>
                      <p className="text-slate-600">Jarak: <span className="font-bold text-slate-800">{Number(selectedRecord.distance_out)?.toFixed(1)}m</span></p>
                      <p className="text-slate-600 overflow-hidden text-ellipsis">Coords: <span className="font-mono font-bold text-slate-800 text-[10px]">{Number(selectedRecord.latitude_out)?.toFixed(5)}, {Number(selectedRecord.longitude_out)?.toFixed(5)}</span></p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold">
                    Karyawan belum melakukan absen pulang.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

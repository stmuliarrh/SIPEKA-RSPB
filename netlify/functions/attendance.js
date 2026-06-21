import { getPool } from './utils/db.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// RSUD Coordinates
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

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Successful preflight' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON body' }),
    };
  }

  const { userId, latitude, longitude, foto, type, shift } = body;

  if (!userId || latitude === undefined || longitude === undefined || !foto || !type || !shift) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Semua parameter (userId, latitude, longitude, foto, type, shift) wajib diisi' }),
    };
  }

  // Calculate distances to both RSUD locations
  let minDistance = Infinity;
  let targetLocationName = '';

  for (const loc of LOCATIONS) {
    const dist = getDistance(Number(latitude), Number(longitude), loc.lat, loc.lon);
    if (dist < minDistance) {
      minDistance = dist;
      targetLocationName = loc.name;
    }
  }

  // Geofence validation (100 meters)
  if (minDistance > 100) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: `Presensi ditolak. Anda berada di luar radius 100 meter dari RSUD. Jarak terdekat: ${minDistance.toFixed(1)} meter (dari ${targetLocationName}).`,
        distance: minDistance,
      }),
    };
  }

  const pool = getPool();

  // Get current date and time in WITA (UTC+8)
  const now = new Date();
  const witaOffset = 8 * 60; // 8 hours in minutes
  const witaTime = new Date(now.getTime() + (now.getTimezoneOffset() + witaOffset) * 60000);

  const year = witaTime.getFullYear();
  const month = String(witaTime.getMonth() + 1).padStart(2, '0');
  const day = String(witaTime.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(witaTime.getHours()).padStart(2, '0');
  const minutes = String(witaTime.getMinutes()).padStart(2, '0');
  const seconds = String(witaTime.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  // Parse shift times (format expectation: contains "HH:MM:SS" twice, e.g., "SHIFT PAGI (08:00:00 – 14:00:00)")
  const timeMatches = shift.match(/\d{2}:\d{2}:\d{2}/g);
  let shiftStart = '08:00:00';
  let shiftEnd = '14:00:00';

  if (timeMatches && timeMatches.length >= 2) {
    shiftStart = timeMatches[0];
    shiftEnd = timeMatches[1];
  }

  try {
    if (type === 'check_in') {
      // Determine if check-in is late (terlambat) or on-time (tepat waktu)
      // Check if current time is past shift start time
      const isLate = timeStr > shiftStart;
      const statusCheckIn = isLate ? 'Terlambat' : 'Tepat Waktu';

      const query = `
        INSERT INTO absensi (user_id, tanggal, check_in, status_check_in, status, latitude_in, longitude_in, foto_in, distance_in)
        VALUES ($1, $2, $3, $4, 'Hadir', $5, $6, $7, $8)
        ON CONFLICT (user_id, tanggal) 
        DO UPDATE SET 
          check_in = COALESCE(absensi.check_in, EXCLUDED.check_in),
          status_check_in = COALESCE(absensi.status_check_in, EXCLUDED.status_check_in),
          latitude_in = COALESCE(absensi.latitude_in, EXCLUDED.latitude_in),
          longitude_in = COALESCE(absensi.longitude_in, EXCLUDED.longitude_in),
          foto_in = COALESCE(absensi.foto_in, EXCLUDED.foto_in),
          distance_in = COALESCE(absensi.distance_in, EXCLUDED.distance_in)
        RETURNING *
      `;
      const res = await pool.query(query, [
        userId,
        dateStr,
        timeStr,
        statusCheckIn,
        latitude,
        longitude,
        foto,
        minDistance,
      ]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Absen Masuk Berhasil (${statusCheckIn})`,
          attendance: res.rows[0],
        }),
      };

    } else if (type === 'check_out') {
      // Determine check-out status: did they leave early?
      const isEarly = timeStr < shiftEnd;
      // If it's night shift (e.g. 21:00:00 - 08:00:00), check logic might differ, but a basic string compare works for simple cases.
      // If shift crosses midnight (start > end), e.g. 21:00:00 - 08:00:00
      let statusCheckOut = 'Tepat Waktu';
      if (shiftStart > shiftEnd) {
        // Night shift crosses midnight.
        // If current time is after midnight (e.g. 05:00:00) but before end time (08:00:00), it's early.
        // If current time is before midnight (e.g. 23:00:00), it's also early (checked out early on same day).
        if (timeStr > shiftEnd && timeStr < shiftStart) {
          statusCheckOut = 'Pulang Cepat';
        } else if (timeStr < shiftEnd) {
          statusCheckOut = 'Pulang Cepat';
        }
      } else {
        statusCheckOut = isEarly ? 'Pulang Cepat' : 'Tepat Waktu';
      }

      // Check if check-in exists for today. If not, we still allow check-out (or create record).
      const checkQuery = 'SELECT id FROM absensi WHERE user_id = $1 AND tanggal = $2';
      const checkRes = await pool.query(checkQuery, [userId, dateStr]);

      let query;
      let params;

      if (checkRes.rows.length === 0) {
        // No check-in today. Create row with check-out only.
        query = `
          INSERT INTO absensi (user_id, tanggal, check_out, status_check_out, status, latitude_out, longitude_out, foto_out, distance_out)
          VALUES ($1, $2, $3, $4, 'Hadir', $5, $6, $7, $8)
          RETURNING *
        `;
        params = [userId, dateStr, timeStr, statusCheckOut, latitude, longitude, foto, minDistance];
      } else {
        // Update existing row
        query = `
          UPDATE absensi 
          SET 
            check_out = $1, 
            status_check_out = $2, 
            latitude_out = $3, 
            longitude_out = $4, 
            foto_out = $5, 
            distance_out = $6
          WHERE user_id = $7 AND tanggal = $8
          RETURNING *
        `;
        params = [timeStr, statusCheckOut, latitude, longitude, foto, minDistance, userId, dateStr];
      }

      const res = await pool.query(query, params);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Absen Pulang Berhasil (${statusCheckOut})`,
          attendance: res.rows[0],
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Tipe absen tidak valid. Harus "check_in" atau "check_out"' }),
    };

  } catch (err) {
    console.error('Attendance submit error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Terjadi kesalahan sistem saat menyimpan data', error: err.message }),
    };
  }
}

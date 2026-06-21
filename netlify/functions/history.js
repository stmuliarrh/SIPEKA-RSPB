import { getPool } from './utils/db.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Successful preflight' }),
    };
  }

  // Support both GET and POST requests
  let userId, startDate;

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      userId = body.userId;
      startDate = body.startDate;
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid JSON body' }),
      };
    }
  } else if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    userId = params.userId;
    startDate = params.startDate;
  } else {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'userId is required' }),
    };
  }

  const pool = getPool();

  try {
    let query = 'SELECT id, user_id, TO_CHAR(tanggal, \'YYYY-MM-DD\') as tanggal, check_in, check_out, status_check_in, status_check_out, status, latitude_in, longitude_in, latitude_out, longitude_out, foto_in, foto_out, distance_in, distance_out FROM absensi WHERE user_id = $1';
    const params = [userId];

    if (startDate) {
      query += ' AND tanggal >= $2';
      params.push(startDate);
    }

    query += ' ORDER BY tanggal DESC';

    const res = await pool.query(query, params);
    const records = res.rows;

    // Calculate Summary Statistics based on the returned records
    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalSakit = 0;
    let totalIzin = 0;

    records.forEach(r => {
      if (r.status === 'Hadir') {
        totalHadir++;
        if (r.status_check_in === 'Terlambat') {
          totalTerlambat++;
        }
      } else if (r.status === 'Sakit') {
        totalSakit++;
      } else if (r.status === 'Izin' || r.status === 'Cuti') {
        totalIzin++;
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        records,
        summary: {
          hadir: totalHadir,
          terlambat: totalTerlambat,
          sakit: totalSakit,
          izin: totalIzin
        }
      }),
    };
  } catch (err) {
    console.error('Fetch history error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Gagal mengambil riwayat absensi', error: err.message }),
    };
  }
}

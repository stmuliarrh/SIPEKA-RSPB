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

  const { userId, tanggal, status } = body;

  if (!userId || !tanggal || !status) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'userId, tanggal, and status (Sakit/Izin/Cuti) are required' }),
    };
  }

  if (!['Sakit', 'Izin', 'Cuti'].includes(status)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Status must be Sakit, Izin, or Cuti' }),
    };
  }

  const pool = getPool();

  try {
    const query = `
      INSERT INTO absensi (user_id, tanggal, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, tanggal) 
      DO UPDATE SET status = EXCLUDED.status, check_in = NULL, check_out = NULL
      RETURNING *
    `;
    const res = await pool.query(query, [userId, tanggal, status]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Pengajuan ${status} berhasil disimpan untuk tanggal ${tanggal}`,
        attendance: res.rows[0],
      }),
    };
  } catch (err) {
    console.error('Submit leave error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Gagal mengajukan izin/sakit', error: err.message }),
    };
  }
}

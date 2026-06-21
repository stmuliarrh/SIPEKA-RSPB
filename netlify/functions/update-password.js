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

  const { email, password, foto_profil } = body;

  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Email / Kode Pegawai is required' }),
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const pool = getPool();

  try {
    // Check if the user exists
    const checkQuery = 'SELECT id FROM users WHERE LOWER(email) = $1 OR LOWER(nip) = $1';
    const checkRes = await pool.query(checkQuery, [trimmedEmail]);

    if (checkRes.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Karyawan tidak ditemukan' }),
      };
    }

    const userId = checkRes.rows[0].id;
    let updateQuery;
    let queryParams;

    if (password && foto_profil) {
      updateQuery = 'UPDATE users SET password = $1, foto_profil = $2 WHERE id = $3 RETURNING id, email, nama, nip, jam_kerja, lokasi_penempatan, foto_profil';
      queryParams = [password, foto_profil, userId];
    } else if (password) {
      updateQuery = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, email, nama, nip, jam_kerja, lokasi_penempatan, foto_profil';
      queryParams = [password, userId];
    } else if (foto_profil) {
      updateQuery = 'UPDATE users SET foto_profil = $1 WHERE id = $2 RETURNING id, email, nama, nip, jam_kerja, lokasi_penempatan, foto_profil';
      queryParams = [foto_profil, userId];
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Tidak ada data untuk diperbarui' }),
      };
    }

    const res = await pool.query(updateQuery, queryParams);
    const updatedUser = res.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Data berhasil diperbarui',
        user: updatedUser
      }),
    };
  } catch (err) {
    console.error('Update profile error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Gagal memperbarui data', error: err.message }),
    };
  }
}

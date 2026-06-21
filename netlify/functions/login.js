import { getPool } from './utils/db.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function handler(event, context) {
  // Handle preflight OPTIONS request
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

  const { identifier, password } = body;

  if (!identifier || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Email/NIP and password are required' }),
    };
  }

  const trimmedIdentifier = identifier.trim().toLowerCase();
  const pool = getPool();

  try {
    // 1. Search for existing user
    const query = `
      SELECT id, email, password, nama, nip, jam_kerja, lokasi_penempatan, foto_profil 
      FROM users 
      WHERE LOWER(email) = $1 OR LOWER(nip) = $1
    `;
    const res = await pool.query(query, [trimmedIdentifier]);

    if (res.rows.length > 0) {
      const user = res.rows[0];
      if (user.password === password) {
        // Remove password from returned object
        delete user.password;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Login successful', user }),
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Kata sandi salah' }),
        };
      }
    }

    // 2. User does not exist. Check if default password was used
    if (password === 'rspb123') {
      // Auto-register new employee
      let email, nip, nama;
      if (trimmedIdentifier.includes('@')) {
        email = trimmedIdentifier;
        nip = trimmedIdentifier.split('@')[0];
        // Capitalize parts of the email for a nicer default name
        nama = nip
          .split('.')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        nip = trimmedIdentifier;
        email = `${trimmedIdentifier}@rspb.com`;
        nama = `Pegawai ${trimmedIdentifier.toUpperCase()}`;
      }

      const insertQuery = `
        INSERT INTO users (email, password, nama, nip, jam_kerja, lokasi_penempatan)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, nama, nip, jam_kerja, lokasi_penempatan, foto_profil
      `;
      const insertRes = await pool.query(insertQuery, [
        email,
        'rspb123',
        nama,
        nip,
        '5 Hari Kerja',
        'RSUD PAMBALAH BATUNG Baru',
      ]);

      const newUser = insertRes.rows[0];
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Akun karyawan baru berhasil dibuat dan masuk otomatis',
          user: newUser,
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Akun tidak ditemukan. Gunakan password default "rspb123" untuk mendaftar akun baru.' }),
    };

  } catch (err) {
    console.error('Login error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Terjadi kesalahan pada server backend', error: err.message }),
    };
  }
}

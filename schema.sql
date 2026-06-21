-- SQL Schema for SIPEKAL RSPB v1.0
-- Setup tables and seed initial employee

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE NOT NULL,
    jam_kerja VARCHAR(100) DEFAULT '5 Hari Kerja',
    lokasi_penempatan VARCHAR(255) DEFAULT 'RSUD PAMBALAH BATUNG Baru',
    foto_profil TEXT
);

-- 2. Create Absensi Table
CREATE TABLE IF NOT EXISTS absensi (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status_check_in VARCHAR(50),
    status_check_out VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Hadir', -- Hadir, Sakit, Izin, Terlambat
    latitude_in NUMERIC,
    longitude_in NUMERIC,
    latitude_out NUMERIC,
    longitude_out NUMERIC,
    foto_in TEXT,
    foto_out TEXT,
    distance_in NUMERIC,
    distance_out NUMERIC,
    UNIQUE(user_id, tanggal)
);

-- 3. Seed Default User (Maulida Jihan Nabela A.Md., RMIK)
INSERT INTO users (id, email, password, nama, nip, jam_kerja, lokasi_penempatan)
VALUES (48, 'maulida.alb99@gmail.com', 'rspb123', 'Maulida Jihan Nabela A.Md., RMIK', '48', '5 Hari Kerja', 'RSUD PAMBALAH BATUNG Baru')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    nama = EXCLUDED.nama,
    nip = EXCLUDED.nip,
    jam_kerja = EXCLUDED.jam_kerja,
    lokasi_penempatan = EXCLUDED.lokasi_penempatan;

-- Reset SERIAL sequence for user id to start after the seeded 48
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;

import fs from 'fs';
import nodePath from 'path';
import { createRequire } from 'module';
import type { config as SqlConfig, ConnectionPool } from 'mssql';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sql = require('mssql') as typeof import('mssql');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require('nodemailer') as typeof import('nodemailer');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as typeof import('bcryptjs');

// ---------------------------------------------------------------------------
// 1. LOAD ENVIRONMENT VARIABLES FROM .ENV
// ---------------------------------------------------------------------------
try {
  const envPath = nodePath.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error('[API Server] Failed to load .env file', e);
}

// ---------------------------------------------------------------------------
// 2. SQL SERVER CONNECTION POOL
// ---------------------------------------------------------------------------
const dbConfig: SqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
    encrypt: true,
    useUTC: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: ConnectionPool | null = null;

async function getPool(): Promise<ConnectionPool> {
  if (!pool || !pool.connected) {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('[API Server] SQL Server pool connected.');
  }
  return pool;
}

// ---------------------------------------------------------------------------
// 3. EMAIL OTP SENDER
// ---------------------------------------------------------------------------
async function sendOtpEmail(to: string, nama: string, otpCode: string): Promise<void> {
  const smtpHost = process.env.SMTP_SERVER;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[OTP Email] SMTP belum dikonfigurasi lengkap di .env — email tidak dikirim.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // false untuk port 587 (STARTTLS)
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false, // izinkan sertifikat self-signed jika diperlukan
    },
  });

  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '5';

  await transporter.sendMail({
    from: `"Check Data System" <${process.env.SMTP_FROM || smtpUser}>`,
    to,
    subject: '🔐 Kode OTP Login - CheckData',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: #013b52; padding: 24px 32px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">CheckData Verification</h2>
          <p style="color: #94d2e0; margin: 4px 0 0; font-size: 13px;">PT Sapta Indra Sejati</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 15px;">Halo <strong>${nama}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">Berikut adalah kode OTP Anda untuk masuk ke sistem CheckData:</p>
          <div style="background: #ffffff; border: 2px dashed #013b52; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Kode OTP Anda</p>
            <h1 style="letter-spacing: 10px; font-size: 40px; margin: 0; color: #013b52; font-weight: 700;">${otpCode}</h1>
          </div>
          <p style="color: #374151; font-size: 14px;">⏰ Kode ini berlaku selama <strong>${expiryMinutes} menit</strong>.</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            Jika Anda tidak meminta kode ini, abaikan email ini. Jangan bagikan kode ini kepada siapapun.
          </p>
        </div>
      </div>
    `,
    text: `Halo ${nama}, kode OTP Anda untuk login ke Check Data adalah: ${otpCode}. Kode berlaku selama ${expiryMinutes} menit.`,
  });

  console.log(`[OTP Email] Berhasil dikirim ke ${to}`);
}

// ---------------------------------------------------------------------------
// 4. PASSWORD HASHING HELPERS
// ---------------------------------------------------------------------------
const BCRYPT_SALT_ROUNDS = 10;

async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
  // Legacy plaintext fallback: re-hash on successful login is recommended,
  // but for now we allow plaintext passwords to keep existing accounts working.
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(plainPassword, storedHash);
  }
  return plainPassword === storedHash;
}

// ---------------------------------------------------------------------------
// 5. INTERFACES
// ---------------------------------------------------------------------------
interface Customer {
  code: string;
  nik: string;
  nama: string;
  tglLahir: string;
  jenisKelamin: string;
  alamat: string;
  noHp: string;
  status: string;
}

// ---------------------------------------------------------------------------
// 6. API MIDDLEWARE ROUTER
// ---------------------------------------------------------------------------
export async function apiMiddleware(req: any, res: any, _next: any) {
  const urlParts = req.url.split('?');
  const routePath = urlParts[0];
  const queryParams = new URLSearchParams(urlParts[1] || '');
  const method = req.method;

  // JSON helper responders
  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  const getBody = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch (e) { reject(e); }
      });
    });
  };

  console.log(`[API Server] ${method} ${req.url}`);

  try {
    const db = await getPool();

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/auth/login
    // sp_User_GetByEmail -> sp_User_UpdateOtp
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath === '/auth/login') {
      const body = await getBody();
      if (!body.email || !body.password) {
        return sendJson(400, { message: 'Email dan password wajib diisi.' });
      }

      // 1. Ambil user berdasarkan email
      const userRes = await db.request()
        .input('Email', sql.VarChar(100), body.email.trim())
        .execute('sp_User_GetByEmail');

      const dbUser = userRes.recordset[0];

      const passwordValid = dbUser && await verifyPassword(body.password, dbUser.password);
      if (!passwordValid) {
        return sendJson(401, { message: 'Email atau password salah. Silakan coba lagi.' });
      }
      if (dbUser.status !== 'aktif') {
        return sendJson(403, { message: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.' });
      }

      // 2. Generate OTP 6 digit & simpan ke DB
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
      const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await db.request()
        .input('Email', sql.VarChar(100), dbUser.email)
        .input('OtpCode', sql.VarChar(6), otpCode)
        .input('OtpExpiry', sql.DateTime, otpExpiry)
        .execute('sp_User_UpdateOtp');

      // 3. Kirim OTP ke email user secara asinkron (background) tanpa await
      sendOtpEmail(dbUser.email, dbUser.nama, otpCode).catch((emailErr: any) => {
        console.error('[OTP Email] Failed to send email in background:', emailErr.message);
      });

      return sendJson(200, {
        email: dbUser.email,
        group: dbUser.user_group,
        nama: dbUser.nama,
      });
    }

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/auth/verify-otp
    // Verifikasi dengan GETUTCDATE() untuk menghindari masalah timezone
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath === '/auth/verify-otp') {
      const body = await getBody();
      if (!body.email || !body.otpCode) {
        return sendJson(400, { message: 'Email dan kode OTP wajib diisi.' });
      }

      const email = body.email.trim();
      const otpCode = body.otpCode.trim();

      // Gunakan GETUTCDATE() agar perbandingan waktu tidak terpengaruh timezone server
      const verifyRes = await db.request()
        .input('Email', sql.VarChar(100), email)
        .input('OtpCode', sql.VarChar(6), otpCode)
        .query(`
          SELECT id, username, nama, email, user_group, status, otp_code, otp_expiry
          FROM users
          WHERE email = @Email
            AND otp_code = @OtpCode
            AND otp_expiry >= GETUTCDATE()
        `);

      console.log('[API Server] Verify OTP:', {
        email,
        otpCode,
        found: verifyRes.recordset.length > 0,
        serverUtc: new Date().toISOString(),
      });

      const verifiedUser = verifyRes.recordset[0];
      if (!verifiedUser) {
        return sendJson(400, { message: 'Kode OTP tidak valid atau telah kedaluwarsa.' });
      }

      return sendJson(200, {
        success: true,
        message: 'OTP Valid',
        group: verifiedUser.user_group,
        nama: verifiedUser.nama,
      });
    }

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/auth/change-password
    // sp_User_ChangePassword
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath === '/auth/change-password') {
      const body = await getBody();
      if (!body.email || !body.oldPassword || !body.newPassword || !body.confirmPassword) {
        return sendJson(400, { message: 'Semua field password wajib diisi.' });
      }

      if (body.newPassword !== body.confirmPassword) {
        return sendJson(400, { message: 'Password baru dan konfirmasi password tidak cocok.' });
      }

      // 1. Ambil user berdasarkan email untuk verifikasi password lama
      const userRes = await db.request()
        .input('Email', sql.VarChar(100), body.email.trim())
        .execute('sp_User_GetByEmail');

      const dbUser = userRes.recordset[0];
      const oldPasswordValid = dbUser && await verifyPassword(body.oldPassword, dbUser.password);
      if (!oldPasswordValid) {
        return sendJson(400, { message: 'Password lama tidak sesuai.' });
      }

      // 2. Hash password baru dan update
      const hashedNewPassword = await hashPassword(body.newPassword);
      await db.request()
        .input('Email', sql.VarChar(100), body.email.trim())
        .input('NewPassword', sql.VarChar(255), hashedNewPassword)
        .execute('sp_User_ChangePassword');

      return sendJson(200, { message: 'Password berhasil diubah.' });
    }

    // -----------------------------------------------------------------------
    // ROUTE: GET /api/user
    // sp_User_GetAll
    // -----------------------------------------------------------------------
    if (method === 'GET' && routePath === '/user') {
      const usersRes = await db.request().execute('sp_User_GetAll');

      // Jangan kirim kolom password ke frontend
      const users = usersRes.recordset.map((u: any) => ({
        id: u.id,
        username: u.username,
        nama: u.nama,
        email: u.email,
        perusahaan: u.perusahaan,
        group: u.user_group,
        status: u.status,
      }));

      return sendJson(200, users);
    }

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/user
    // sp_User_Insert
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath === '/user') {
      const body = await getBody();
      if (!body.username || !body.nama || !body.email || !body.perusahaan) {
        return sendJson(400, { message: 'Username, Nama, Email, dan Perusahaan wajib diisi.' });
      }

      const rawPassword = body.password || 'semangatpagi!!!';
      const hashedPassword = await hashPassword(rawPassword);

      const insertRes = await db.request()
        .input('Username', sql.VarChar(50), body.username)
        .input('Nama', sql.VarChar(100), body.nama)
        .input('Email', sql.VarChar(100), body.email)
        .input('Password', sql.VarChar(255), hashedPassword)
        .input('Perusahaan', sql.VarChar(100), body.perusahaan)
        .input('UserGroup', sql.VarChar(50), body.group || 'Checker')
        .input('Status', sql.VarChar(20), body.status || 'aktif')
        .execute('sp_User_Insert');

      const newId = insertRes.recordset[0]?.NewId;
      return sendJson(200, { id: newId, message: 'User berhasil ditambahkan.' });
    }

    // -----------------------------------------------------------------------
    // ROUTE: PUT /api/user/:id
    // sp_User_Update
    // -----------------------------------------------------------------------
    if (method === 'PUT' && routePath.startsWith('/user/') && !routePath.endsWith('/reset')) {
      const id = parseInt(routePath.split('/')[2]);
      const body = await getBody();

      if (!id || !body.username || !body.nama || !body.email || !body.perusahaan) {
        return sendJson(400, { message: 'Username, Nama, Email, dan Perusahaan wajib diisi.' });
      }

      await db.request()
        .input('Id', sql.Int, id)
        .input('Username', sql.VarChar(50), body.username)
        .input('Nama', sql.VarChar(100), body.nama)
        .input('Email', sql.VarChar(100), body.email)
        .input('Perusahaan', sql.VarChar(100), body.perusahaan)
        .input('UserGroup', sql.VarChar(50), body.group)
        .input('Status', sql.VarChar(20), body.status)
        .execute('sp_User_Update');

      return sendJson(200, { message: 'User berhasil diperbarui.' });
    }

    // -----------------------------------------------------------------------
    // ROUTE: DELETE /api/user/:id
    // sp_User_Delete
    // -----------------------------------------------------------------------
    if (method === 'DELETE' && routePath.startsWith('/user/')) {
      const id = parseInt(routePath.split('/')[2]);
      if (!id) return sendJson(400, { message: 'ID User tidak valid.' });

      await db.request()
        .input('Id', sql.Int, id)
        .execute('sp_User_Delete');

      return sendJson(200, { message: 'User berhasil dihapus.' });
    }

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/user/:id/reset
    // sp_User_ResetPassword
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath.startsWith('/user/') && routePath.endsWith('/reset')) {
      const id = parseInt(routePath.split('/')[2]);
      if (!id) return sendJson(400, { message: 'ID User tidak valid.' });

      const defaultPassword = 'semangatpagi!!!';
      const hashedDefault = await hashPassword(defaultPassword);

      await db.request()
        .input('Id', sql.Int, id)
        .input('Password', sql.VarChar(255), hashedDefault)
        .execute('sp_User_ResetPassword');

      return sendJson(200, { message: "Password berhasil di-reset menjadi 'semangatpagi!!!'" });
    }

    // -----------------------------------------------------------------------
    // ROUTE: GET /api/customer
    // sp_Customer_GetAll
    // -----------------------------------------------------------------------
    if (method === 'GET' && routePath === '/customer') {
      const search = queryParams.get('search') || '';

      const customersRes = await db.request()
        .input('Search', sql.VarChar(100), search.trim() || null)
        .execute('sp_Customer_GetAll');

      return sendJson(200, customersRes.recordset);
    }

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/customer/check  (harus sebelum /customer/:nik)
    // sp_Customer_Check + evaluasi logika bisnis
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath === '/customer/check') {
      const body = await getBody();
      if (!body.code || !body.nama || !body.nik) {
        return sendJson(400, { message: 'Code, Nama, dan NIK wajib diisi.' });
      }

      const codeVal = body.code.trim();
      const namaInput = body.nama.trim();
      const namaVal = namaInput.toLowerCase();
      const nikVal = body.nik.trim();

      // SP mengembalikan baris yang cocok berdasarkan NIK exact atau Nama partial (LIKE)
      const checkRes = await db.request()
        .input('Code', sql.VarChar(20), codeVal)
        .input('Nama', sql.VarChar(100), namaInput)
        .input('Nik', sql.VarChar(20), nikVal)
        .execute('sp_Customer_Check');

      const rows: Customer[] = checkRes.recordset;

      // Verifikasi berdasarkan NIK. Nama hanya digunakan untuk memvalidasi record
      // yang ditemukan oleh NIK. Jika NIK tidak ditemukan, hasilnya not_found
      // meskipun nama cocok (privasi & keamanan data).
      const exactNik = rows.find(c => c.nik === nikVal);
      const partialNik = rows.find(c => c.nik.includes(nikVal) && c.nik !== nikVal);

      let alertType: string;
      let matchedCustomer: Customer | null = null;

      if (exactNik) {
        matchedCustomer = exactNik;
        const namaCocok =
          exactNik.nama.toLowerCase() === namaVal ||
          exactNik.nama.toLowerCase().includes(namaVal);

        alertType = namaCocok
          ? (exactNik.code === codeVal ? 'match' : 'id_match_nama_mismatch')
          : 'id_match_nama_mismatch';
      } else if (partialNik) {
        matchedCustomer = partialNik;
        const namaCocok =
          partialNik.nama.toLowerCase() === namaVal ||
          partialNik.nama.toLowerCase().includes(namaVal);

        alertType = namaCocok
          ? (partialNik.code === codeVal ? 'match' : 'id_match_nama_mismatch')
          : 'id_match_nama_mismatch';
      } else {
        // NIK tidak ditemukan (meskipun nama cocok) → data dianggap tidak ditemukan
        alertType = 'not_found';
        matchedCustomer = null;
      }

      return sendJson(200, {
        nik: nikVal,
        nama: body.nama.trim(),
        alertType,
        customer: matchedCustomer,
      });
    }

    // -----------------------------------------------------------------------
    // ROUTE: POST /api/customer
    // sp_Customer_Insert
    // -----------------------------------------------------------------------
    if (method === 'POST' && routePath === '/customer') {
      const body = await getBody();
      if (!body.code || !body.nama || !body.nik) {
        return sendJson(400, { message: 'Code, Nama, dan NIK wajib diisi.' });
      }

      await db.request()
        .input('Code', sql.VarChar(20), body.code)
        .input('Nik', sql.VarChar(20), body.nik)
        .input('Nama', sql.VarChar(100), body.nama)
        .input('TglLahir', sql.Date, body.tglLahir || null)
        .input('JenisKelamin', sql.VarChar(20), body.jenisKelamin || '')
        .input('Alamat', sql.Text, body.alamat || null)
        .input('NoHp', sql.VarChar(20), body.noHp || null)
        .input('Status', sql.VarChar(20), body.status || 'aktif')
        .execute('sp_Customer_Insert');

      return sendJson(200, { message: 'Customer berhasil ditambahkan.' });
    }

    // -----------------------------------------------------------------------
    // ROUTE: PUT /api/customer/:nik
    // sp_Customer_Update
    // -----------------------------------------------------------------------
    if (method === 'PUT' && routePath.startsWith('/customer/')) {
      const nik = routePath.split('/')[2];
      const body = await getBody();

      if (!nik || !body.code || !body.nama || !body.nik) {
        return sendJson(400, { message: 'Code, Nama, dan NIK wajib diisi.' });
      }

      await db.request()
        .input('Nik', sql.VarChar(20), nik)
        .input('Code', sql.VarChar(20), body.code)
        .input('Nama', sql.VarChar(100), body.nama)
        .input('TglLahir', sql.Date, body.tglLahir || null)
        .input('JenisKelamin', sql.VarChar(20), body.jenisKelamin || '')
        .input('Alamat', sql.Text, body.alamat || null)
        .input('NoHp', sql.VarChar(20), body.noHp || null)
        .input('Status', sql.VarChar(20), body.status)
        .execute('sp_Customer_Update');

      return sendJson(200, { message: 'Customer berhasil diperbarui.' });
    }

    // -----------------------------------------------------------------------
    // ROUTE: DELETE /api/customer/:nik
    // sp_Customer_Delete
    // -----------------------------------------------------------------------
    if (method === 'DELETE' && routePath.startsWith('/customer/')) {
      const nik = routePath.split('/')[2];
      if (!nik) return sendJson(400, { message: 'NIK tidak valid.' });

      await db.request()
        .input('Nik', sql.VarChar(20), nik)
        .execute('sp_Customer_Delete');

      return sendJson(200, { message: 'Customer berhasil dihapus.' });
    }

    // Route not found
    return sendJson(404, { message: `Route ${method} ${routePath} tidak ditemukan.` });

  } catch (e: any) {
    console.error('[API Server ERROR]', e);
    return sendJson(500, { message: 'Internal Server Error', error: e.message });
  }
}

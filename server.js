/**
 * ==============================================================================
 * VANATOR LICENSE & DISCORD ADMIN SERVER (Zero-Dependency Node.js Backend)
 * ==============================================================================
 * Özellikler:
 * - Harici 'npm install' gerektirmez (Node.js dahili modülleriyle çalışır).
 * - Render, Vercel, Railway, Glitch veya kendi sunucunda tek tıkla çalışır.
 * - Discord ID tabanlı admin yetkilendirme.
 * - Dinamik süreli (1 Gün, 7 Gün, 30 Gün, Lifetime) key üretimi.
 * - Otomatik HWID (Donanım Kimliği) kilitleme (Tek PC koruması).
 * - Otomatik kalıcı veritabanı (database.json).
 * ==============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Varsayılan Veritabanı Yapısı
const defaultDb = {
  masterOwnerDiscordId: "894125632145896325", // Kurucu Discord ID
  adminDiscordIds: [
    "894125632145896325"
  ],
  keys: [
    {
      key: "VANATOR-LIFE-9988-77AA",
      durationDays: 9999,
      durationLabel: "Ömür Boyu (Lifetime)",
      customer: "VIP Müşteri",
      discordId: "124578963258",
      createdAt: new Date().toISOString(),
      activatedAt: null,
      expiresAt: null,
      hwid: null,
      active: true
    }
  ]
};

// Veritabanını Yükle veya Oluştur
function loadDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
      return defaultDb;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[Vanator Server] Veritabanı yüklenirken hata:', err.message);
    return defaultDb;
  }
}

function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[Vanator Server] Veritabanı kaydedilirken hata:', err.message);
  }
}

let db = loadDatabase();

// CORS ve JSON Cevap Yardımcısı
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Discord-Id, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Request Body Okuyucu
function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Rastgele Key Üretici
function generateLicenseString(days) {
  const chars = 'ABCDEF0123456789';
  function seg(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }
  const prefix = days >= 9999 ? 'LIFE' : days <= 1 ? 'TRIL' : 'VANT';
  return `VANATOR-${prefix}-${seg(4)}-${seg(4)}`;
}

// HTTP Sunucusu
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Discord-Id, Authorization'
    });
    return res.end();
  }

  console.log(`[${new Date().toLocaleTimeString()}] ${method} ${pathname}`);

  // 1. Durum Kontrolü (Health check)
  if (method === 'GET' && pathname === '/api/status') {
    return sendJson(res, 200, {
      status: 'online',
      name: 'Vanator License Core',
      version: '9.2',
      activeKeysCount: db.keys.filter(k => k.active).length,
      adminsCount: db.adminDiscordIds.length
    });
  }

  // 2. Admin Kontrolü: GET /api/check-admin?discordId=12345
  if (method === 'GET' && pathname === '/api/check-admin') {
    const discordId = (parsedUrl.query.discordId || '').trim();
    if (!discordId) {
      return sendJson(res, 400, { success: false, message: 'discordId parametresi eksik.' });
    }
    const isAdmin = db.adminDiscordIds.includes(discordId);
    return sendJson(res, 200, {
      success: true,
      discordId: discordId,
      isAdmin: isAdmin,
      isMasterOwner: discordId === db.masterOwnerDiscordId
    });
  }

  // 3. Admin Ekleme: POST /api/admin/add
  if (method === 'POST' && pathname === '/api/admin/add') {
    const body = await parseRequestBody(req);
    const requesterId = req.headers['x-admin-discord-id'] || body.requesterDiscordId;

    if (!db.adminDiscordIds.includes(requesterId)) {
      return sendJson(res, 403, { success: false, message: 'Yetkisiz erişim. Bu işlemi sadece yetkili adminler yapabilir.' });
    }

    const newAdminId = (body.newAdminDiscordId || '').trim();
    if (!newAdminId || newAdminId.length < 5) {
      return sendJson(res, 400, { success: false, message: 'Geçersiz Discord ID.' });
    }

    if (!db.adminDiscordIds.includes(newAdminId)) {
      db.adminDiscordIds.push(newAdminId);
      saveDatabase(db);
    }

    return sendJson(res, 200, {
      success: true,
      message: `${newAdminId} başarıyla yetkili yapıldı.`,
      admins: db.adminDiscordIds
    });
  }

  // 4. Admin Silme: POST /api/admin/remove
  if (method === 'POST' && pathname === '/api/admin/remove') {
    const body = await parseRequestBody(req);
    const requesterId = req.headers['x-admin-discord-id'] || body.requesterDiscordId;

    if (requesterId !== db.masterOwnerDiscordId) {
      return sendJson(res, 403, { success: false, message: 'Sadece Ana Kurucu admin yetkisini silebilir.' });
    }

    const targetId = (body.targetDiscordId || '').trim();
    if (targetId === db.masterOwnerDiscordId) {
      return sendJson(res, 400, { success: false, message: 'Ana kurucu yetkiden çıkarılamaz.' });
    }

    db.adminDiscordIds = db.adminDiscordIds.filter(id => id !== targetId);
    saveDatabase(db);

    return sendJson(res, 200, {
      success: true,
      message: `${targetId} yetkisi kaldırıldı.`,
      admins: db.adminDiscordIds
    });
  }

  // 5. Key Üretme: POST /api/keys/create
  if (method === 'POST' && pathname === '/api/keys/create') {
    const body = await parseRequestBody(req);
    const requesterId = req.headers['x-admin-discord-id'] || body.requesterDiscordId;

    if (!db.adminDiscordIds.includes(requesterId)) {
      return sendJson(res, 403, { success: false, message: 'Key üretmek için admin yetkisi gereklidir.' });
    }

    const days = parseInt(body.durationDays || '30', 10);
    const customer = (body.customer || 'Bilinmiyor').trim();
    const customerDiscordId = (body.customerDiscordId || '').trim();

    let durationLabel = `${days} Günlük`;
    if (days >= 9999) durationLabel = 'Ömür Boyu (Lifetime)';
    if (days === 1) durationLabel = '1 Günlük (Trial)';

    const keyString = generateLicenseString(days);
    const keyRecord = {
      key: keyString,
      durationDays: days,
      durationLabel: durationLabel,
      customer: customer,
      discordId: customerDiscordId,
      createdBy: requesterId,
      createdAt: new Date().toISOString(),
      activatedAt: null,
      expiresAt: null,
      hwid: null,
      active: true
    };

    db.keys.unshift(keyRecord);
    saveDatabase(db);

    return sendJson(res, 200, {
      success: true,
      key: keyRecord
    });
  }

  // 6. Key Listeleme: GET /api/keys/list
  if (method === 'GET' && pathname === '/api/keys/list') {
    const requesterId = req.headers['x-admin-discord-id'] || parsedUrl.query.adminId;
    if (!db.adminDiscordIds.includes(requesterId)) {
      return sendJson(res, 403, { success: false, message: 'Yetkisiz erişim.' });
    }
    return sendJson(res, 200, { success: true, keys: db.keys });
  }

  // 7. Key İptal Etme: POST /api/keys/revoke
  if (method === 'POST' && pathname === '/api/keys/revoke') {
    const body = await parseRequestBody(req);
    const requesterId = req.headers['x-admin-discord-id'] || body.requesterDiscordId;

    if (!db.adminDiscordIds.includes(requesterId)) {
      return sendJson(res, 403, { success: false, message: 'Yetkisiz erişim.' });
    }

    const targetKey = (body.key || '').trim();
    const found = db.keys.find(k => k.key === targetKey);
    if (!found) {
      return sendJson(res, 404, { success: false, message: 'Key bulunamadı.' });
    }

    found.active = false;
    saveDatabase(db);
    return sendJson(res, 200, { success: true, message: `${targetKey} iptal edildi.` });
  }

  // 8. Müşteri Tarafı - Key Doğrulama / Etkinleştirme: POST /api/keys/activate
  if (method === 'POST' && pathname === '/api/keys/activate') {
    const body = await parseRequestBody(req);
    const inputKey = (body.key || '').trim();
    const inputHwid = (body.hwid || '').trim();
    const inputDiscord = (body.discordId || '').trim();

    if (!inputKey) {
      return sendJson(res, 400, { success: false, message: 'Lütfen lisans anahtarınızı girin.' });
    }

    const record = db.keys.find(k => k.key.toUpperCase() === inputKey.toUpperCase());
    if (!record) {
      return sendJson(res, 404, { success: false, message: 'Geçersiz lisans anahtarı. Lütfen kontrol edip tekrar deneyin.' });
    }

    if (!record.active) {
      return sendJson(res, 403, { success: false, message: 'Bu lisans anahtarı yönetici tarafından iptal edilmiş.' });
    }

    // İlk defa mı etkinleştiriliyor?
    if (!record.activatedAt) {
      record.activatedAt = new Date().toISOString();
      if (inputHwid) record.hwid = inputHwid;
      if (inputDiscord && !record.discordId) record.discordId = inputDiscord;

      if (record.durationDays >= 9999) {
        record.expiresAt = null; // Lifetime
      } else {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + record.durationDays);
        record.expiresAt = expDate.toISOString();
      }
      saveDatabase(db);
    } else {
      // Daha önce etkinleştirilmiş: HWID Kilidi Kontrolü
      if (record.hwid && inputHwid && record.hwid !== inputHwid) {
        return sendJson(res, 403, {
          success: false,
          message: 'HWID KİLİDİ: Bu lisans başka bir bilgisayara aittir! Başka bilgisayarda kullanılamaz.'
        });
      }

      // Süre Kontrolü (Expiration check)
      if (record.expiresAt) {
        const now = new Date();
        const expiry = new Date(record.expiresAt);
        if (now > expiry) {
          record.active = false;
          saveDatabase(db);
          return sendJson(res, 403, { success: false, message: 'Lisans süreniz dolmuştur! Lütfen yenileyin.' });
        }
      }
    }

    // Kalan Gün Hesaplama
    let daysLeft = 'Ömür Boyu';
    if (record.expiresAt) {
      const diffTime = new Date(record.expiresAt) - new Date();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + ' Gün Kaldı';
    }

    return sendJson(res, 200, {
      success: true,
      valid: true,
      message: 'Lisans doğrulandı!',
      key: record.key,
      durationLabel: record.durationLabel,
      daysLeft: daysLeft,
      expiresAt: record.expiresAt,
      customer: record.customer
    });
  }

  // Bilinmeyen Route
  return sendJson(res, 404, { success: false, message: 'Route not found.' });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VANATOR LICENSE SERVER ÇALIŞIYOR`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Durum Kontrolü: http://localhost:${PORT}/api/status`);
  console.log(`======================================================\n`);
});

# 🚀 Vanator License & Discord Admin Server

Bu sunucu, **Vanator Tweak** uygulamanız için:
- Belirlediğiniz Discord ID'lerine **Admin Paneli yetkisi** verir.
- Müşterilere **1 Günlük, 7 Günlük, 30 Günlük veya Lifetime** lisans anahtarı üretir.
- **HWID Kilidi** uygulayarak keylerin birden fazla bilgisayarda paylaşılmasını engeller.
- Sıfır bağımlılığa sahiptir (`npm install` bile gerektirmez, doğrudan saf Node.js ile çalışır).

---

## ⚡ 1. Kendi Bilgisayarınızda Test Etme

1. Bilgisayarınızda Node.js yüklüyse terminalden bu klasöre gelin:
   ```cmd
   cd server
   node server.js
   ```
2. Sunucu `http://localhost:3000` adresinde çalışmaya başlar.

---

## 🌐 2. İnternete 100% ÜCRETSİZ Yükleme (2 Dakika)

Müşterilerinizin dünyanın her yerinden bağlanabilmesi için sunucuyu internete ücretsiz yükleyebilirsiniz. **Kredi kartı gerektirmez.**

### Yöntem A: Render.com (En Popüler & Kolay)
1. [Render.com](https://render.com) adresine gidin ve ücretsiz bir hesap açın.
2. **New +** butonuna basıp **Web Service** seçin.
3. Bu `server/` klasörünü GitHub deponuza yükleyip Render'a bağlayın.
4. Ayarlar:
   - **Runtime:** Node
   - **Build Command:** *(Boş bırakın)*
   - **Start Command:** `node server.js`
   - **Plan:** Free ($0/month)
5. **Create Web Service** butonuna basın. Size özel bir link verir:  
   `https://vanator-license-xxxx.onrender.com`

---

### Yöntem B: Glitch.com (Tek Tıkla Anında Canlı)
1. [Glitch.com](https://glitch.com) sitesine girin.
2. **New Project** > **Import from GitHub** veya boş bir proje açın.
3. `server.js` ve `package.json` dosyalarını oraya yapıştırın.
4. Glitch anında size canlı bir link verir (`https://projeniz.glitch.me`).

---

## 🔗 Uygulamayı Bu Sunucuya Bağlama

Sunucunuzun canlı linkini (örn: `https://vanator-api.onrender.com`) aldığınızda, `vanator-tweaks/app/index.html` dosyasındaki:
```javascript
const API_URL = "https://sizin-sunucu-linkiniz.com";
```
kısmına yapıştırmanız yeterlidir. Artık her şey tamamen canlı ve buluttan senkronize çalışır!

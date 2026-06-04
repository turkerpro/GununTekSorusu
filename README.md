<div align="center">
  <img src="public/pwa-192x192.svg" alt="Logo" width="120" height="120">
  <br/>
  <h1>Günün Tek Sorusu 🌟</h1>
  <p>
    <b>Yapay Zeka Destekli Minimalist Şükran ve Farkındalık Günlüğü</b>
  </p>
  <br/>
</div>

## 📖 Proje Hakkında

**Günün Tek Sorusu**, karmaşık hayat koşturmacasında insanların her gün sadece tek bir derin soruya odaklanarak kendilerini keşfetmelerini ve içsel huzuru bulmalarını sağlayan yenilikçi bir web uygulamasıdır. 

Uygulama, Google Gemini Yapay Zekası tarafından desteklenmekte olup, sadece kullanıcıya özel yaratıcı ve ilham verici sorular üretmekle kalmaz; aynı zamanda kullanıcının duygusal geçmişini analiz ederek adeta bir yaşam koçu gibi derinlemesine ve şefkatli bir geri bildirim sunar.

## ✨ Özellikler

- 🤖 **Yapay Zeka Destekli Sorular (Gemini AI):** Havuzdaki soruların yanı sıra, yapay zeka tarafından o anki duruma özgü, derinliği olan, samimi sorular üretilir.
- 🧘‍♀️ **Akıllı Duygu Analizi ve Geri Bildirim:** Kullanıcının geçmiş günlerdeki cevaplarını analiz eden AI, ruh halini yansıtan temalar (örn: *Dingin Gökyüzü*) ve haftalık şefkatli geri bildirimler oluşturur.
- 🌍 **Anonim Küresel Akış (Global Feed):** Kullanıcıların o günün sorusuna verdikleri ilham verici cevapları ve hissettikleri emojileri tüm dünyayla anonim olarak paylaşabileceği canlı bir akış.
- 📱 **Progressive Web App (PWA):** Uygulamayı tek tıkla cihazınıza indirebilir, çevrimdışı önbellekleme desteğiyle mobil uygulama deneyimi yaşayabilirsiniz.
- 🎨 **Minimalist & Modern Arayüz:** Göz yormayan şık tasarım, yumuşak geçişler ve Tailwind CSS destekli yüksek kaliteli UI bileşenleri.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion
- **Backend:** Node.js, Express.js
- **Yapay Zeka:** Google Gen AI (Gemini 3.5 Flash)
- **Dağıtım (Deployment):** Vercel (Serverless Functions)

## 🚀 Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edin:

### Ön Koşullar
- Node.js (v18+)
- Bir Google Gemini API Anahtarı

### Adımlar

1. **Projeyi Klonlayın:**
   ```bash
   git clone https://github.com/turkerpro/GununTekSorusu.git
   cd GununTekSorusu
   ```

2. **Gereksinimleri Yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre Değişkenlerini Ayarlayın:**
   - Proje dizininde `.env` adında bir dosya oluşturun.
   - Aşağıdaki değişkeni ekleyin:
   ```env
   GEMINI_API_KEY=sizin_api_anahtariniz_buraya
   ```

4. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   > Uygulama `http://localhost:3000` adresinde çalışmaya başlayacaktır.

## 🌐 Yayına Alma (Vercel)

Proje Vercel ile tam uyumludur (Serverless Functions mimarisi desteklenmektedir). 
1. Vercel'de yeni proje oluşturup bu repoyu bağlayın.
2. Vercel projenizin **Environment Variables** ayarlarına `GEMINI_API_KEY` değerini ekleyin.
3. Deploy butonuna basın! Vercel, `vite build` komutunu ve `/api` klasöründeki Express uygulamasını otomatik tanıyacaktır.

---

<div align="center">
  <i>Sevgiyle ve farkındalıkla geliştirildi.</i>
</div>

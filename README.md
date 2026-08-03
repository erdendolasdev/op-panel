# op-panel v1.0 🚀
> **Özel İşletmeler İçin Süreç Takip & Operasyon Paneli**

`op-panel`, özel işletmelerin iş süreçlerini, departman yüklerini ve günlük operasyonlarını modern bir Kanban panosu ve detaylı listeler üzerinden takip etmelerini sağlayan bulut tabanlı (SaaS) bir yönetim paneli yazılımıdır. 

Herhangi bir sunucu (backend) kurulumu gerektirmeden, doğrudan tarayıcı üzerinden çalışan şık ve minimalist bir mimariye sahiptir.

---

## ✨ Özellikler

* **📊 Gösterge Paneli (Dashboard)**: Chart.js ile çizilen departman iş yükü analizleri, süreç aşaması dağılım grafikleri ve en son operasyonel aktivitelerin anlık takibi.
* **📋 Süreç Takip (Kanban Pano)**: HTML5 Drag & Drop desteği ile süreç kartlarını sürükleyip bırakarak aşama güncelleme ("Yeni Talep", "Planlama", "Yürütülüyor", "Test & Kontrol", "Tamamlandı").
* **🔍 Operasyon Listesi**: Gelişmiş departman, öncelik ve durum filtreleri ile anlık arama desteği sunan süreç yönetim tablosu.
* **🔐 Kullanıcı Üyelik Sistemi (SaaS Auth)**: Kullanıcı kayıt olma, giriş yapma ve çıkış yapma mekanizmaları.
* **☁️ Supabase Entegrasyonu**: Tüm verilerin PostgreSQL bulut veritabanı ile anlık ve kullanıcı bazlı senkronize edilmesi.
* **✨ Hibrit Çalışma Modu (Demo Modu)**: Supabase API anahtarları eklenmediğinde sistem otomatik olarak `localStorage` (Yerel Depolama) moduna geçer. Böylece projeyi indiren herkes anında test edebilir.
* **🎨 Premium Tasarım**: Koyu (Dark) ve Aydınlık (Light) tema desteği, göz yormayan modern cam efekti (Glassmorphism) ve yumuşak geçişli arka plan ışıkları (Glow Mesh).
* **📱 %100 Mobil Uyumlu**: Mıknatıslı Kanban kaydırma (`scroll-snap`), mobil menü perdesi (backdrop blur) ve sağ altta yüzen süreç ekleme butonu (FAB) ile tüm telefon boyutlarında akıcı deneyim.

---

## 📂 Dosya Yapısı

* `index.html` - Uygulama arayüzü ve görünüm alanları.
* `style.css` - Gelişmiş tasarım sistemi ve responsive (mobil) kodlar.
* `app.js` - İş mantığı, Supabase API istemcisi ve üyelik işlemleri.
* `schema.sql` - Supabase veritabanında çalıştırılacak PostgreSQL şeması ve güvenlik kuralları (RLS).

---

## ⚙️ Kurulum & Canlıya Alma (SaaS Yapılandırması)

Projeyi kendinize ait bir SaaS servisine dönüştürerek abonelik modeliyle kiralayabilmek veya kendi işletmenizde bulutta kullanabilmek için:

1. **Supabase Projesi Oluşturun**: [Supabase.com](https://supabase.com) adresine gidin, ücretsiz üye olun ve yeni bir proje oluşturun.
2. **Veritabanını Kurun**: 
   - Projenizdeki **`schema.sql`** dosyasının içeriğini kopyalayın.
   - Supabase panelindeki **SQL Editor** sekmesine yapıştırıp **Run** tuşuna basın. Bu işlem veritabanı tablolarını ve kullanıcı bazlı izolasyon kurallarını (RLS) otomatik oluşturur.
3. **API Anahtarlarını Bağlayın**:
   - Supabase panelinde **Settings -> API** sekmesinden `Project URL` ve `anon public key` değerlerini kopyalayın.
   - Kendi bilgisayarınızdaki **`app.js`** dosyasının en üstündeki şu alanlara yapıştırın:
     ```javascript
     const SUPABASE_URL = 'SENİN_SUPABASE_URL_DEĞERİN';
     const SUPABASE_ANON_KEY = 'SENİN_SUPABASE_ANON_KEY_DEĞERİN';
     ```
4. **Yayınlayın (Hosting)**: Proje klasöründeki dosyaları **GitHub Pages**, **Vercel** veya **Netlify** gibi platformlara (ücretsiz olarak) yükleyerek canlıya alabilirsiniz.

---

## 📝 Lisans

Bu proje kişisel ve ticari kullanıma uygundur. Dilediğiniz gibi özelleştirip kiralayabilir veya kendi sistemlerinizde kullanabilirsiniz.

# op-panel

**Özel işletmeler için süreç takip ve operasyon yönetim paneli.**

Canlı Demo → [erdendolasdev.github.io/op-panel](https://erdendolasdev.github.io/op-panel)

---

## Nedir?

op-panel, küçük ve orta ölçekli işletmelerin iş süreçlerini, departman görevlerini ve günlük operasyonlarını tek bir ekrandan yönetebilmesi için geliştirilmiş, tarayıcı tabanlı bir SaaS yönetim panelidir.

Herhangi bir kurulum gerektirmez. Tarayıcıda açılır, çalışır.

---

## Ne Yapabilirsiniz?

- Süreçlerinizi Kanban panosunda sürükle bırak ile takip edebilirsiniz
- Departman bazlı görev listesi oluşturabilir, filtreleyebilirsiniz
- Gösterge panelinde grafiklerle iş yükünü anlık görebilirsiniz
- Hesap açıp giriş yaparak verilerinizi bulutta saklayabilirsiniz
- Koyu ve açık tema arasında geçiş yapabilirsiniz
- Mobil cihazlardan tam uyumlu olarak kullanabilirsiniz

---

## Teknolojiler

- HTML, CSS, JavaScript (sıfır framework, sıfır derleme adımı)
- Chart.js (grafikler)
- Supabase (bulut veritabanı ve kullanıcı üyelik sistemi)
- GitHub Pages (yayınlama)

---

## Demo Modu

Supabase bağlantısı yapılmadan açıldığında panel otomatik olarak demo moduna geçer. Bu modda kayıt olma, giriş yapma ve tüm özellikler tamamen çalışır; veriler tarayıcı hafızasında saklanır.

---

## Supabase Bağlantısı

Gerçek bulut tabanlı üyelik için `app.js` dosyasının en üstündeki iki satırı doldurun:

```js
const SUPABASE_URL = 'supabase-proje-urliniz';
const SUPABASE_ANON_KEY = 'supabase-anon-keyiniz';
```

Ardından `schema.sql` dosyasını Supabase SQL editöründe çalıştırarak veritabanı tablolarını oluşturun.

---

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Arayüz |
| `style.css` | Tasarım ve mobil uyumluluk |
| `app.js` | İş mantığı ve Supabase entegrasyonu |
| `schema.sql` | Veritabanı şeması (Supabase için) |

---

## Lisans

Kişisel ve ticari kullanıma açıktır.

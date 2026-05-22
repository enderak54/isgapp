# E2E Test Senaryoları — Manuel Test

## 1. Personel Kaydı

**Hazırlık**: Tarayıcıda `/` (ana sayfa) açık.

| # | Adım | Beklenen |
|---|------|----------|
| 1.1 | Tüm zorunlu alanları doldur: TC (11 hane), Ad, Soyad, İSG tarih, Yüksekte tarih, MYK dropdown + tarih + süre, KKD tarih, Sağlık Raporu tarih | Form validasyon hatası yok |
| 1.2 | Her eğitim için geçerlilik süresi seç (1-5 yıl) | Her tarih için süre seçili |
| 1.3 | Bir eğitim alanına PDF dosyası sürükle | Dosya `personel_belgeleri`'ne eklenir, listede görünür |
| 1.4 | "Kaydet" butonuna tıkla | Toast "başarıyla kaydedildi", form temizlenir |
| 1.5 | `/personel` sayfasına git | Yeni kayıt listede görünür, MYK eğitimi yeşil rozetli |
| 1.6 | Aynı TC ile tekrar kayıt dene | Uyarı: "Bu TC ile arşivlenmiş kayıt bulundu" |

## 2. Dosya Yükleme (Drag-Drop)

| # | Adım | Beklenen |
|---|------|----------|
| 2.1 | Personel kaydı aç, bir eğitim alanına JPG sürükle | Dosya yüklenir, thumbnail gösterilir |
| 2.2 | Aynı alana PDF sürükle | PDF simgesi gösterilir, `.pdf` etiketi |
| 2.3 | Dosya adına tıkla | Yeni sekmede dosya açılır |
| 2.4 | .exe dosyası sürüklemeyi dene | Reddedilir, hata mesajı |

## 3. MYK Eğitim Yönetimi

| # | Adım | Beklenen |
|---|------|----------|
| 3.1 | Personel düzenleme modalında MYK dropdown'dan eğitim seç | Dropdown açılır |
| 3.2 | Tarih ve süre seç, "Ekle" butonuna bas | Eğitim listeye eklenir, rozet `label` ile |
| 3.3 | Aynı eğitimi tekrar eklemeyi dene | Engellenmeli (zaten var uyarısı) |
| 3.4 | Eklenen eğitimin yanındaki "Kaldır" butonuna bas | Eğitim listeden kaybolur (soft-delete) |
| 3.5 | `/myk` sayfasında liste görünümü | Eğitimler tarih sütununda, süre dolanlar kırmızı |
| 3.6 | Matris görünümüne geç | Çapraz tablo, her hücrede ✅/❌ |

## 4. Silme / Arşiv

| # | Adım | Beklenen |
|---|------|----------|
| 4.1 | Personel listesinde bir kaydın kilidine tıkla (🔒→🔓) | Kilit açılır, sil butonu görünür |
| 4.2 | Sil butonuna tıkla | Modal açılır: "İşten Ayrılış" / "Hatalı Kayıt" |
| 4.3 | "İşten Ayrılış" seç + onayla | Kayıt listeden kaybolur → Arşiv sekmesinde görünür |
| 4.4 | "Aktif" → "Arşiv" toggle'ına tıkla | Arşivlenen personel listelenir, "Geri Al" + "Sil" butonları var |
| 4.5 | "Geri Al" butonuna tıkla | Personel Aktif listeye döner, arşivden kaybolur |
| 4.6 | Tekrar arşivle, ardından "Hatalı Kayıt" seç + onayla | Kayıt kalıcı silinir (DELETE audit log) |

## 5. Dashboard Uyarıları

| # | Adım | Beklenen |
|---|------|----------|
| 5.1 | Geçmiş tarihli bir eğitim gir (ör. 1 yıl önce + 1 yıl süre = bitmiş) | Dashboard'da kırmızı uyarı |
| 5.2 | 30 gün içinde bitecek eğitim gir | Dashboard'da sarı uyarı |
| 5.3 | `/ayarlar` sayfası, "Uyarı Süreleri" modülü | Her eğitim için gün eşiği değiştirilebilir |

## 6. Menü Düzenleme

| # | Adım | Beklenen |
|---|------|----------|
| 6.1 | `/ayarlar` → "Menü Düzenle" modülünü aç | Tüm menü öğeleri sıralanabilir kartlarda |
| 6.2 | Bir öğeyi sürükle-yeni konuma bırak | Sıra değişir, kaydet butonu aktif |
| 6.3 | "Sırayı Kaydet" butonuna bas | Toast "kaydedildi" |
| 6.4 | Sayfayı yenile | Sidebar yeni sırada görünür |

## 7. Tema / Ayarlar

| # | Adım | Beklenen |
|---|------|----------|
| 7.1 | `/ayarlar` → "Koyu Tema" seç | Tüm sayfalar koyu moda geçer |
| 7.2 | Renk seçici ile accent rengini değiştir | Buton/başlık renkleri güncellenir |
| 7.3 | Yazı tipi boyutunu değiştir | Tüm metinler büyür/küçülür |
| 7.4 | Bir modülü gizle (Ek Modüller → Risk Değerlendirme) | Sidebar'dan kaybolur |

## 8. Sürüm Takip

| # | Adım | Beklenen |
|---|------|----------|
| 8.1 | `/ayarlar` → "Sürüm Takip" modülünü aç | GitHub commit listesi yüklenir |
| 8.2 | Commit'lere tıkla | GitHub'da ilgili commit sayfası açılır |

## 9. İhtar Tutanağı

| # | Adım | Beklenen |
|---|------|----------|
| 9.1 | Yeni ihtar ekle, personel seç, tür/durum/tarih gir | Kaydedilir, listelenir |
| 9.2 | Dosya ekle (görsel/belge) | Yüklenir, thumbnail/simge gösterilir |

## 10. Genel Kontrol

| # | Adım | Beklenen |
|---|------|----------|
| 10.1 | Konsol (F12) → "Audit log failed" hatası yok | Tüm CRUD işlemleri audit_log'a yazılıyor |
| 10.2 | `/audit-log` sayfası | Son işlemler filtrelenebilir şekilde listeleniyor |
| 10.3 | 30 dk bekleme | Oturum zaman aşımı uyarısı (varsa) |
| 10.4 | TC alanına harf gir | Validasyon engeller |
| 10.5 | XSS payload dene: `<script>alert(1)</script>` | Sanitize edilir, zararsız metin olarak kaydedilir |

-- Add mezuniyet (graduation) entries to MYK list
-- Lise, Önlisans ve Lisans düzeyinde ISG/İnşaat/Makine/Elektrik vb. ilgili bölümler

-- Meslek Lisesi Bölümleri
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - İnşaat Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - İnşaat Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Tesisat Teknolojisi ve İklimlendirme)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Tesisat Teknolojisi ve İklimlendirme)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Elektrik-Elektronik Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Elektrik-Elektronik Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Makine Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Makine Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Metal Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Metal Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Harita ve Kadastro)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Harita ve Kadastro)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Yalıtım Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Yalıtım Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Restorasyon)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Restorasyon)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Endüstriyel Otomasyon Teknolojileri)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Endüstriyel Otomasyon Teknolojileri)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Yenilenebilir Enerji Teknolojileri)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Yenilenebilir Enerji Teknolojileri)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Kimya Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Kimya Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Mobilya ve İç Mekan Tasarımı)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Mobilya ve İç Mekan Tasarımı)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Madencilik Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Madencilik Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Seramik ve Cam Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Seramik ve Cam Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Plastik Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Plastik Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Gıda Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Gıda Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Tekstil Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Tekstil Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Motorlu Araçlar Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Motorlu Araçlar Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Tarım Teknolojileri)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Tarım Teknolojileri)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Bilişim Teknolojileri)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Bilişim Teknolojileri)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Çevre Sağlığı)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Çevre Sağlığı)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - İş Sağlığı ve Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - İş Sağlığı ve Güvenliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Laboratuvar Hizmetleri)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Laboratuvar Hizmetleri)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Uçak Bakım)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Uçak Bakım)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Denizcilik)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Denizcilik)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - İtfaiyecilik ve Yangın Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - İtfaiyecilik ve Yangın Güvenliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lise - Sivil Savunma)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lise - Sivil Savunma)');

-- Önlisans Programları
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - İş Sağlığı ve Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - İş Sağlığı ve Güvenliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - İnşaat Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - İnşaat Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Harita ve Kadastro)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Harita ve Kadastro)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Makine)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Makine)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Elektrik)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Elektrik)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Elektronik Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Elektronik Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Otomasyon)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Otomasyon)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Kimya Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Kimya Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Çevre Koruma ve Kontrol)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Çevre Koruma ve Kontrol)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - İtfaiyecilik ve Yangın Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - İtfaiyecilik ve Yangın Güvenliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Sivil Savunma ve İtfaiyecilik)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Sivil Savunma ve İtfaiyecilik)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Madencilik Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Madencilik Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Metalürji)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Metalürji)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Doğalgaz ve Tesisatı Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Doğalgaz ve Tesisatı Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - İklimlendirme ve Soğutma Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - İklimlendirme ve Soğutma Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Gıda Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Gıda Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Tekstil Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Tekstil Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Mobilya ve Dekorasyon)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Mobilya ve Dekorasyon)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Seramik)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Seramik)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Plastik Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Plastik Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Nükleer Teknoloji ve Radyasyon Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Nükleer Teknoloji ve Radyasyon Güvenliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Raylı Sistemler Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Raylı Sistemler Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Uçak Teknolojisi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Uçak Teknolojisi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Deniz Ulaştırma ve İşletme)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Deniz Ulaştırma ve İşletme)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Lojistik)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Lojistik)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Bilgisayar Programcılığı)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Bilgisayar Programcılığı)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - İşletme Yönetimi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - İşletme Yönetimi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Önlisans - Adalet)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Önlisans - Adalet)');

-- Lisans Bölümleri
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - İş Sağlığı ve Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - İş Sağlığı ve Güvenliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - İnşaat Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - İnşaat Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Makine Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Makine Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Elektrik-Elektronik Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Elektrik-Elektronik Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Kimya Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Kimya Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Maden Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Maden Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Metalürji ve Malzeme Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Metalürji ve Malzeme Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Jeoloji Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Jeoloji Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Jeofizik Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Jeofizik Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Harita Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Harita Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Çevre Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Çevre Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Endüstri Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Endüstri Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Gıda Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Gıda Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Tekstil Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Tekstil Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Enerji Sistemleri Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Enerji Sistemleri Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Otomotiv Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Otomotiv Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Uçak Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Uçak Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Gemi İnşaatı ve Gemi Makineleri Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Gemi İnşaatı ve Gemi Makineleri Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Deniz Ulaştırma İşletme Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Deniz Ulaştırma İşletme Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Bilgisayar Mühendisliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Bilgisayar Mühendisliği)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Endüstriyel Tasarım)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Endüstriyel Tasarım)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Mimarlık)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Mimarlık)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Şehir ve Bölge Planlama)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Şehir ve Bölge Planlama)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - İç Mimarlık)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - İç Mimarlık)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Peyzaj Mimarlığı)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Peyzaj Mimarlığı)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - İşletme)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - İşletme)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Sağlık Yönetimi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Sağlık Yönetimi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Hemşirelik)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Hemşirelik)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Tıp)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Tıp)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Hukuk)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Hukuk)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Psikoloji)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Psikoloji)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Sosyal Hizmet)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Sosyal Hizmet)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Ergoterapi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Ergoterapi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Fizyoterapi ve Rehabilitasyon)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Fizyoterapi ve Rehabilitasyon)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Acil Yardım ve Afet Yönetimi)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Acil Yardım ve Afet Yönetimi)');
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Mezuniyet (Lisans - Yangın ve Yangın Güvenliği)' WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Mezuniyet (Lisans - Yangın ve Yangın Güvenliği)');

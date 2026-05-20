-- Mevcut policy'leri temizle ve yeniden oluştur
DROP POLICY IF EXISTS "okuma" ON ayarlar;
DROP POLICY IF EXISTS "yazma" ON ayarlar;

-- Policy'leri yeniden oluştur
CREATE POLICY "okuma" ON ayarlar FOR SELECT USING (true);
CREATE POLICY "yazma" ON ayarlar FOR ALL USING (true);

-- Varsayılan modül ayarlarını ekle (yoksa)
INSERT INTO ayarlar (key, value, type, description) 
SELECT 'dashboard', 'true', 'module', 'İSG Takip'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'dashboard');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'personel', 'true', 'module', 'Personel'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'personel');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'myk', 'true', 'module', 'MYK Belgeleri'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'myk');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'operator', 'true', 'module', 'Operatör Belgeleri'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'operator');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'dosya', 'true', 'module', 'Personel Dosyası'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'dosya');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'talimatlar', 'true', 'module', 'Talimatlar'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'talimatlar');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'santiyeler', 'true', 'module', 'Şantiyeler'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'santiyeler');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'taseronlar', 'true', 'module', 'Taşeronlar'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'taseronlar');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'sorumlular', 'true', 'module', 'Saha Sorumluları'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'sorumlular');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'ekipmanlar', 'true', 'module', 'İş Ekipmanları'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'ekipmanlar');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'kazalar', 'true', 'module', 'İş Kazaları'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'kazalar');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'egitimler', 'true', 'module', 'Eğitimler'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'egitimler');

INSERT INTO ayarlar (key, value, type, description) 
SELECT 'settings', 'true', 'module', 'Ayarlar'
WHERE NOT EXISTS (SELECT 1 FROM ayarlar WHERE key = 'settings');
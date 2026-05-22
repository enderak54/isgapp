-- Add Muvafakatlı to myk_egitim_listesi
INSERT INTO myk_egitim_listesi (ad) 
SELECT 'Muvafakatlı'
WHERE NOT EXISTS (SELECT 1 FROM myk_egitim_listesi WHERE ad = 'Muvafakatlı');

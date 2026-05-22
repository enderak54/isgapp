INSERT INTO ayarlar (key, value, type, description) VALUES
  ('uyari_isg_egitim', '7', 'egitim_uyari', 'İSG Eğitim - bitiş uyarı günü'),
  ('uyari_yuksekte_calisma', '7', 'egitim_uyari', 'Yüksekte Çalışma - bitiş uyarı günü'),
  ('uyari_myk', '30', 'egitim_uyari', 'MYK - bitiş uyarı günü'),
  ('uyari_sertifika', '7', 'egitim_uyari', 'Sertifika - bitiş uyarı günü'),
  ('uyari_operator_belgesi', '7', 'egitim_uyari', 'Operatör Belgesi - bitiş uyarı günü'),
  ('uyari_kkd', '7', 'egitim_uyari', 'KKD - bitiş uyarı günü'),
  ('uyari_oryantasyon', '7', 'egitim_uyari', 'Oryantasyon - bitiş uyarı günü'),
  ('uyari_saglik_raporu', '7', 'egitim_uyari', 'Sağlık Raporu - bitiş uyarı günü')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS egitim_dosyalari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  egitim_kaydi_id UUID NOT NULL REFERENCES egitim_kayitlari(id) ON DELETE CASCADE,
  dosya_url TEXT NOT NULL,
  dosya_adi TEXT NOT NULL,
  dosya_uzantisi TEXT,
  dosya_boyut BIGINT,
  eklenme_tarihi TIMESTAMPTZ DEFAULT now(),
  silinme_tarihi TIMESTAMPTZ
);

ALTER TABLE egitim_dosyalari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "egitim_dosyalari_public_select" ON egitim_dosyalari FOR SELECT USING (true);
CREATE POLICY "egitim_dosyalari_public_insert" ON egitim_dosyalari FOR INSERT WITH CHECK (true);
CREATE POLICY "egitim_dosyalari_public_update" ON egitim_dosyalari FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "egitim_dosyalari_public_delete" ON egitim_dosyalari FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_egitim_dosyalari_kaydi ON egitim_dosyalari(egitim_kaydi_id);

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('egitim-dosyalari', 'egitim-dosyalari', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage bucket RLS policies
CREATE POLICY "egitim_dosyalari_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'egitim-dosyalari');
CREATE POLICY "egitim_dosyalari_public_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'egitim-dosyalari');
CREATE POLICY "egitim_dosyalari_public_update" ON storage.objects FOR UPDATE USING (bucket_id = 'egitim-dosyalari') WITH CHECK (bucket_id = 'egitim-dosyalari');
CREATE POLICY "egitim_dosyalari_public_delete" ON storage.objects FOR DELETE USING (bucket_id = 'egitim-dosyalari');

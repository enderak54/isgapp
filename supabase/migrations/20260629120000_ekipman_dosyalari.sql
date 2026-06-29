-- Add firma_adi column to is_ekipmanlari
ALTER TABLE is_ekipmanlari ADD COLUMN IF NOT EXISTS firma_adi TEXT;

-- Create ekipman_dosyalari table
CREATE TABLE IF NOT EXISTS ekipman_dosyalari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ekipman_id UUID NOT NULL REFERENCES is_ekipmanlari(id) ON DELETE CASCADE,
  dosya_url TEXT NOT NULL,
  dosya_adi TEXT NOT NULL,
  dosya_uzantisi TEXT,
  dosya_boyut BIGINT,
  bitis_tarihi DATE,
  eklenme_tarihi TIMESTAMPTZ DEFAULT now(),
  silinme_tarihi TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ekipman_dosyalari_ekipman_id ON ekipman_dosyalari(ekipman_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ekipman-dosyalari', 'ekipman-dosyalari', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies (public dev mode)
CREATE POLICY "ekipman_dosyalari_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'ekipman-dosyalari');
CREATE POLICY "ekipman_dosyalari_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ekipman-dosyalari');
CREATE POLICY "ekipman_dosyalari_public_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'ekipman-dosyalari') WITH CHECK (bucket_id = 'ekipman-dosyalari');
CREATE POLICY "ekipman_dosyalari_public_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'ekipman-dosyalari');

-- Table RLS (public dev mode)
ALTER TABLE ekipman_dosyalari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ekipman_dosyalari_public_all" ON ekipman_dosyalari
  USING (true) WITH CHECK (true);

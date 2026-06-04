CREATE TABLE IF NOT EXISTS personel_santiyeler (
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  santiye_id UUID REFERENCES santiyeler(id) ON DELETE CASCADE,
  PRIMARY KEY (personel_id, santiye_id)
);

-- Migrate existing santiye_adi values
INSERT INTO personel_santiyeler (personel_id, santiye_id)
SELECT p.id, s.id
FROM personel p
JOIN santiyeler s ON p.santiye_adi = s.ad
WHERE p.santiye_adi IS NOT NULL AND p.santiye_adi != ''
ON CONFLICT DO NOTHING;

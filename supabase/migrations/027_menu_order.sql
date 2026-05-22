INSERT INTO ayarlar (key, value, type, description) VALUES
('menu_order_main', '["dashboard","personel","myk","operator","dosya","talimatlar","santiyeler","taseronlar","sorumlular","ekipmanlar","kazalar","egitimler","ihtar"]', 'menu_order', 'Ana menü sıralaması'),
('menu_order_ek', '["risk","yasal","denetim","acil","duzeltici","ygg","dokuman","yetkinlik","performans"]', 'menu_order', 'Ek modül sıralaması')
ON CONFLICT (key) DO NOTHING;

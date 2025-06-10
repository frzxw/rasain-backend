-- Seed Recipe Reviews
INSERT INTO recipe_reviews (id, recipe_id, user_id, rating, comment, created_at) VALUES

-- Reviews for Nasi Gudeg
('a50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 5.0, 'Resep gudeg yang sangat autentik! Rasanya persis seperti gudeg Bu Tjitro di Yogya. Terima kasih sudah berbagi resep keluarga.', NOW() - INTERVAL '20 days'),
('a50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 4.5, 'Enak banget! Cuma agak lama masaknya, tapi worth it. Anak-anak suka sekali.', NOW() - INTERVAL '18 days'),
('a50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 5.0, 'Perfect! Sudah 3 kali bikin pakai resep ini, selalu berhasil. Bumbu meresap sempurna.', NOW() - INTERVAL '15 days'),
('a50e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 4.0, 'Rasanya enak, tapi saya kurangi gulanya sedikit karena terlalu manis untuk selera keluarga.', NOW() - INTERVAL '12 days'),

-- Reviews for Rendang
('a50e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 5.0, 'Rendang terenak yang pernah saya buat! Bumbu lengkap dan cara masaknya detail banget.', NOW() - INTERVAL '22 days'),
('a50e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 4.5, 'Mantap jiwa! Dagingnya empuk dan bumbu meresap. Cuma capek ngaduknya 4 jam hehe.', NOW() - INTERVAL '19 days'),
('a50e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 5.0, 'Resep keluarga yang turun temurun memang beda! Rendang ini bisa tahan berhari-hari dan makin enak.', NOW() - INTERVAL '16 days'),
('a50e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 4.5, 'Luar biasa! Suami yang orang Padang bilang ini rendang asli. Terima kasih resepnya Bu.', NOW() - INTERVAL '14 days'),

-- Reviews for Gado-gado
('a50e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 4.0, 'Bumbu kacangnya enak, tapi saya tambah cabai rawit biar lebih pedas.', NOW() - INTERVAL '17 days'),
('a50e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 4.5, 'Sehat dan enak! Cocok buat diet, sayurannya fresh semua.', NOW() - INTERVAL '13 days'),
('a50e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 4.0, 'Praktis dan bergizi. Anak-anak jadi suka makan sayur karena bumbu kacangnya.', NOW() - INTERVAL '10 days'),

-- Reviews for Sate Ayam
('a50e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 5.0, 'Sate ayam terenak! Bumbu kacangnya gurih manis, persis seperti sate Madura asli.', NOW() - INTERVAL '16 days'),
('a50e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 4.5, 'Dagingnya empuk dan bumbu meresap. Cocok buat acara keluarga.', NOW() - INTERVAL '11 days'),
('a50e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 4.0, 'Enak, tapi saya kurangi gulanya di bumbu kacang. Overall mantap!', NOW() - INTERVAL '8 days'),

-- Reviews for other recipes
('a50e8400-e29b-41d4-a716-446655440015', '650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 4.5, 'Rawon yang otentik! Kluweknya bikin kuah hitam pekat dan gurih.', NOW() - INTERVAL '12 days'),
('a50e8400-e29b-41d4-a716-446655440016', '650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 4.0, 'Pempek buatan sendiri memang beda! Kenyal dan segar.', NOW() - INTERVAL '9 days'),
('a50e8400-e29b-41d4-a716-446655440017', '650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440006', 4.5, 'Es cendol segar banget! Perfect buat cuaca panas.', NOW() - INTERVAL '1 day'),
('a50e8400-e29b-41d4-a716-446655440018', '650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440007', 5.0, 'Klepon homemade yang sempurna! Gula merahnya meleleh di mulut.', NOW()),

-- Seed Saved Recipes
INSERT INTO saved_recipes (user_id, recipe_id, saved_at, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '25 days', 'Mau coba bikin untuk lebaran'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '20 days', 'Resep favorit keluarga'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '15 days', 'Pengen coba rawon asli Surabaya'),
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '22 days', 'Gudeg untuk acara keluarga'),
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '18 days', 'Menu diet sehat'),
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '5 days', 'Kue tradisional untuk arisan'),
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '3 days', 'Minuman segar untuk jualan'),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '19 days', 'Rendang untuk acara kantor'),
('550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '12 days', 'Pempek homemade weekend'),
('550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '10 days', 'Ayam betutu untuk pesta'),
('550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '8 days', 'Nasi liwet untuk piknik'),
('550e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '6 days', 'Menu cepat saji'),
('550e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440009', NOW() - INTERVAL '4 days', 'Soto betawi asli'),
('550e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '2 days', 'Martabak manis untuk jualan'),
('550e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '1 day', 'Bakso malang spesial');

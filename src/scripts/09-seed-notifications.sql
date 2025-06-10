-- Seed Notifications
INSERT INTO notifications (id, user_id, title, message, notification_type, related_item_id, created_at) VALUES

-- Recipe recommendation notifications
('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Resep Baru Untukmu!', 'Berdasarkan bahan di pantry kamu, coba resep Gado-gado Jakarta yang segar dan sehat!', 'recipe_recommendation', '650e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 days'),

('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Rekomendasi Resep', 'Kamu punya ikan bandeng di freezer, yuk coba resep Pindang Bandeng yang lezat!', 'recipe_recommendation', '650e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '1 day'),

-- Expiration warnings
('d50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Peringatan Kedaluwarsa', 'Cabai merah di kulkas akan kedaluwarsa dalam 3 hari. Yuk masak sesuatu yang pedas!', 'expiration_warning', '950e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '3 days'),

('d50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Segera Habiskan!', 'Bayam di kulkas akan kedaluwarsa besok. Jangan sampai terbuang ya!', 'expiration_warning', '950e8400-e29b-41d4-a716-446655440018', NOW() - INTERVAL '1 day'),

('d50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Peringatan Kedaluwarsa', 'Roti tawar akan kedaluwarsa dalam 2 hari. Mungkin saatnya bikin roti bakar?', 'expiration_warning', '950e8400-e29b-41d4-a716-446655440032', NOW() - INTERVAL '2 days'),

-- Low stock alerts
('d50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Stok Menipis', 'Beras putih di pantry tinggal sedikit. Jangan lupa belanja ya!', 'low_stock', '950e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '4 days'),

('d50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Stok Habis', 'Minyak goreng sudah hampir habis. Tambahkan ke daftar belanja?', 'low_stock', '950e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '2 days'),

-- New recipe notifications
('d50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Resep Baru!', 'Chef Sari menambahkan resep Martabak Manis yang lezat. Yuk dicoba!', 'new_recipe', '650e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '3 days'),

('d50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Ada Resep Baru', 'Resep Es Cendol segar sudah tersedia. Cocok untuk cuaca panas!', 'new_recipe', '650e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '1 day'),

-- Review notifications
('d50e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Review Baru', 'Seseorang memberikan review 5 bintang untuk resep Nasi Gudeg kamu!', 'review', '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '15 days'),

('d50e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'Review Positif', 'Resep Rendang kamu mendapat review yang sangat baik!', 'review', '650e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '14 days'),

-- Achievement notifications
('d50e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Pencapaian Baru!', 'Selamat! Resep kamu sudah disukai lebih dari 100 orang!', 'achievement', '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '10 days'),

('d50e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'Master Chef!', 'Wow! Kamu sudah berbagi 5 resep. Terima kasih sudah berkontribusi!', 'achievement', NULL, NOW() - INTERVAL '8 days'),

-- System notifications
('d50e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'Selamat Datang!', 'Terima kasih sudah bergabung dengan Rasain! Yuk mulai eksplorasi resep Indonesia.', 'system', NULL, NOW() - INTERVAL '12 days'),

('d50e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440012', 'Tips Hari Ini', 'Tahukah kamu? Menyimpan bumbu di freezer bisa memperpanjang masa simpannya!', 'system', NULL, NOW());

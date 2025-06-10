-- Seed Community Posts
INSERT INTO community_posts (id, user_id, content, category, like_count, comment_count, created_at) VALUES

('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Baru selesai masak rendang untuk acara keluarga! 4 jam masak tapi hasilnya worth it banget. Tips dari saya: jangan lupa aduk terus biar santannya ga pecah ya!', 'Tips Masak', 23, 8, NOW() - INTERVAL '5 days'),

('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Siapa yang suka klepon? Tadi bikin 50 biji buat arisan RT. Resepnya turun temurun dari nenek, gula merahnya selalu meleleh sempurna 😍', 'Kue Tradisional', 31, 12, NOW() - INTERVAL '3 days'),

('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'Eksperimen bikin gado-gado dengan bumbu kacang homemade. Ternyata lebih enak daripada yang beli! Ada yang mau resep bumbu kacangnya?', 'Resep Sehat', 18, 6, NOW() - INTERVAL '2 days'),

('b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 'Gudeg Yogya vs Gudeg Solo, mana yang kalian suka? Saya tim Gudeg Yogya karena lebih manis dan santannya lebih kental 🤤', 'Diskusi Kuliner', 45, 23, NOW() - INTERVAL '4 days'),

('b50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', 'Tips buat yang mau bikin sate ayam: marinasi dagingnya minimal 2 jam ya! Biar bumbu meresap sempurna. Jangan lupa api jangan terlalu besar.', 'Tips Masak', 27, 9, NOW() - INTERVAL '6 days'),

('b50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Rawon Surabaya buatan sendiri! Kluweknya susah dicari, tapi untung ada toko online. Rasanya beda banget sama yang instant.', 'Masakan Tradisional', 22, 7, NOW() - INTERVAL '1 day'),

('b50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440011', 'Bakso malang homemade! Bikinnya capek tapi puas banget. Anak-anak sampai minta tambah terus. Ada yang mau tips bikin bakso kenyal?', 'Tips Masak', 19, 11, NOW() - INTERVAL '7 days'),

('b50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Pempek palembang tanpa ikan tenggiri tetap enak kok! Pakai ikan gabus atau ikan lele juga bisa. Yang penting teknik bikinnya.', 'Tips Hemat', 16, 5, NOW() - INTERVAL '8 days'),

('b50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', 'Es cendol segar buat berbuka puasa! Bikinnya gampang banget, cuma butuh tepung hunkwe dan daun pandan. Anak-anak suka banget!', 'Minuman Segar', 33, 14, NOW() - INTERVAL '9 days'),

('b50e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'Ayam betutu Bali authentic! Bumbu base genepnya bikin sendiri, hasilnya mantap jiwa. Dagingnya empuk dan bumbu meresap sampai tulang.', 'Masakan Daerah', 28, 10, NOW() - INTERVAL '10 days'),

('b50e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 'Nasi padang lengkap! Rendang, gulai, sambal ijo, dendeng balado. Masak dari pagi sampai sore tapi worth it banget. Keluarga pada ketagihan!', 'Masakan Padang', 41, 18, NOW() - INTERVAL '11 days'),

('b50e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'Pecel lele sederhana tapi nagih! Sambal terasinya bikin sendiri, pedasnya pas banget. Cocok buat makan malam keluarga.', 'Menu Harian', 15, 4, NOW() - INTERVAL '12 days');

-- Seed Post Comments
INSERT INTO post_comments (id, post_id, user_id, content, created_at) VALUES

-- Comments for rendang post
('c50e8400-e29b-41d4-a716-446655440001', 'b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Wah kelihatan enak banget! Boleh minta resep lengkapnya ga?', NOW() - INTERVAL '5 days'),
('c50e8400-e29b-41d4-a716-446655440002', 'b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'Setuju banget! Rendang emang harus sabar ngaduknya. Hasilnya pasti memuaskan.', NOW() - INTERVAL '4 days'),
('c50e8400-e29b-41d4-a716-446655440003', 'b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'Tips yang bagus! Saya kemarin santannya pecah karena apinya terlalu besar.', NOW() - INTERVAL '4 days'),

-- Comments for klepon post
('c50e8400-e29b-41d4-a716-446655440004', 'b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Klepon favorit saya! Boleh share resepnya dong bu?', NOW() - INTERVAL '3 days'),
('c50e8400-e29b-41d4-a716-446655440005', 'b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009', 'Wah 50 biji! Pasti capek bikinnya. Tapi hasilnya pasti memuaskan ya.', NOW() - INTERVAL '2 days'),
('c50e8400-e29b-41d4-a716-446655440006', 'b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', 'Saya juga suka klepon! Tapi sering gagal, gula merahnya suka keluar.', NOW() - INTERVAL '2 days'),

-- Comments for gado-gado post
('c50e8400-e29b-41d4-a716-446655440007', 'b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Mau dong resep bumbu kacangnya! Pasti lebih sehat daripada yang beli.', NOW() - INTERVAL '2 days'),
('c50e8400-e29b-41d4-a716-446655440008', 'b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Setuju! Bumbu kacang homemade emang beda rasanya.', NOW() - INTERVAL '1 day'),

-- More comments for other posts
('c50e8400-e29b-41d4-a716-446655440009', 'b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'Tim Gudeg Solo nih! Lebih gurih dan ga terlalu manis 😄', NOW() - INTERVAL '4 days'),
('c50e8400-e29b-41d4-a716-446655440010', 'b50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008', 'Tips yang berguna! Saya sering buru-buru jadi dagingnya alot.', NOW() - INTERVAL '6 days'),
('c50e8400-e29b-41d4-a716-446655440011', 'b50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440010', 'Es cendol emang the best! Apalagi kalau cuaca panas gini.', NOW() - INTERVAL '9 days'),
('c50e8400-e29b-41d4-a716-446655440012', 'b50e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012', 'Nasi padang lengkap gini bikin ngiler! Pasti enak banget.', NOW() - INTERVAL '11 days');

-- Seed Post Likes
INSERT INTO post_likes (user_id, post_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'b50e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440003', 'b50e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440004', 'b50e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440005', 'b50e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440006', 'b50e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440007', 'b50e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440008', 'b50e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440009', 'b50e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440010', 'b50e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440011', 'b50e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440012', 'b50e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '8 days');

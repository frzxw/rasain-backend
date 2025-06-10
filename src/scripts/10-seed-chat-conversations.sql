-- Seed Chat Conversations and Messages
INSERT INTO chat_conversations (id, user_id, title, created_at) VALUES

('e50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bantuan Masak Rendang', NOW() - INTERVAL '5 days'),
('e50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Resep Vegetarian', NOW() - INTERVAL '3 days'),
('e50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Menu Buka Puasa', NOW() - INTERVAL '7 days'),
('e50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Masakan Anak', NOW() - INTERVAL '2 days'),
('e50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Tips Menggoreng', NOW() - INTERVAL '4 days'),
('e50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'Resep Diet Sehat', NOW() - INTERVAL '6 days'),
('e50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'Kue Tradisional', NOW() - INTERVAL '1 day'),
('e50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'Masakan Cepat', NOW() - INTERVAL '8 days'),
('e50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', 'Bumbu Dasar', NOW() - INTERVAL '9 days'),
('e50e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', 'Masakan Padang', NOW() - INTERVAL '10 days'),
('e50e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'Sup dan Soto', NOW() - INTERVAL '11 days'),
('e50e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'Sambal Nusantara', NOW() - INTERVAL '12 days');

-- Seed Chat Messages
INSERT INTO chat_messages (id, conversation_id, content, sender, created_at) VALUES

-- Conversation 1: Bantuan Masak Rendang
('f50e8400-e29b-41d4-a716-446655440001', 'e50e8400-e29b-41d4-a716-446655440001', 'Halo! Saya mau masak rendang tapi bingung kenapa santannya selalu pecah. Ada tips?', 'user', NOW() - INTERVAL '5 days'),
('f50e8400-e29b-41d4-a716-446655440002', 'e50e8400-e29b-41d4-a716-446655440001', 'Halo! Santan pecah biasanya karena api terlalu besar atau kurang diaduk. Coba gunakan api kecil-sedang dan aduk terus ya. Juga pastikan santan tidak langsung dari kulkas, biarkan suhu ruang dulu.', 'ai', NOW() - INTERVAL '5 days'),
('f50e8400-e29b-41d4-a716-446655440003', 'e50e8400-e29b-41d4-a716-446655440001', 'Oh begitu! Kalau untuk bumbu rendang, lebih baik dihaluskan atau dipotong kasar?', 'user', NOW() - INTERVAL '5 days'),
('f50e8400-e29b-41d4-a716-446655440004', 'e50e8400-e29b-41d4-a716-446655440001', 'Untuk rendang autentik, bumbu sebaiknya dihaluskan sempurna. Gunakan cobek atau blender dengan sedikit air. Bumbu halus akan meresap lebih baik ke daging.', 'ai', NOW() - INTERVAL '5 days'),

-- Conversation 2: Resep Vegetarian
('f50e8400-e29b-41d4-a716-446655440005', 'e50e8400-e29b-41d4-a716-446655440002', 'Saya vegetarian, ada rekomendasi masakan Indonesia yang enak tanpa daging?', 'user', NOW() - INTERVAL '3 days'),
('f50e8400-e29b-41d4-a716-446655440006', 'e50e8400-e29b-41d4-a716-446655440002', 'Tentu! Ada banyak pilihan: Gado-gado, Pecel, Gudeg (tanpa ayam), Sayur Lodeh, Tahu Tempe Bacem, dan Urap. Mau saya berikan resep yang mana?', 'ai', NOW() - INTERVAL '3 days'),
('f50e8400-e29b-41d4-a716-446655440007', 'e50e8400-e29b-41d4-a716-446655440002', 'Tahu tempe bacem dong! Kebetulan ada tahu tempe di kulkas.', 'user', NOW() - INTERVAL '3 days'),
('f50e8400-e29b-41d4-a716-446655440008', 'e50e8400-e29b-41d4-a716-446655440002', 'Baik! Untuk tahu tempe bacem, kamu perlu: tahu, tempe, gula merah, kecap manis, bawang putih, kemiri, ketumbar, dan daun salam. Mau resep lengkapnya?', 'ai', NOW() - INTERVAL '3 days'),

-- Conversation 3: Menu Buka Puasa
('f50e8400-e29b-41d4-a716-446655440009', 'e50e8400-e29b-41d4-a716-446655440003', 'Lagi cari ide menu buka puasa yang praktis tapi bergizi. Ada saran?', 'user', NOW() - INTERVAL '7 days'),
('f50e8400-e29b-41d4-a716-446655440010', 'e50e8400-e29b-41d4-a716-446655440003', 'Untuk buka puasa, sebaiknya mulai dengan yang manis dan ringan. Coba: Es cendol, kolak pisang, atau kurma. Untuk makanan berat: soto ayam, nasi liwet, atau bubur ayam.', 'ai', NOW() - INTERVAL '7 days'),
('f50e8400-e29b-41d4-a716-446655440011', 'e50e8400-e29b-41d4-a716-446655440003', 'Soto ayam menarik! Tapi saya ga punya waktu lama masak. Ada versi cepat?', 'user', NOW() - INTERVAL '7 days'),
('f50e8400-e29b-41d4-a716-446655440012', 'e50e8400-e29b-41d4-a716-446655440003', 'Ada! Gunakan ayam fillet yang sudah dipotong kecil, bumbu instant soto, dan tambahkan sayuran cepat masak seperti sawi atau tauge. Total waktu sekitar 30 menit.', 'ai', NOW() - INTERVAL '7 days'),

-- More conversations
('f50e8400-e29b-41d4-a716-446655440013', 'e50e8400-e29b-41d4-a716-446655440004', 'Anak saya susah makan sayur. Ada tips masak sayur yang disukai anak?', 'user', NOW() - INTERVAL '2 days'),
('f50e8400-e29b-41d4-a716-446655440014', 'e50e8400-e29b-41d4-a716-446655440004', 'Coba buat sayur dengan bumbu yang familiar untuk anak, seperti sayur sop dengan wortel dan kentang, atau cap cay dengan saus yang agak manis. Potong sayuran kecil-kecil dan campur dengan makanan favorit mereka.', 'ai', NOW() - INTERVAL '2 days'),

('f50e8400-e29b-41d4-a716-446655440015', 'e50e8400-e29b-41d4-a716-446655440005', 'Kenapa gorengan saya selalu berminyak? Padahal sudah ditiriskan.', 'user', NOW() - INTERVAL '4 days'),
('f50e8400-e29b-41d4-a716-446655440016', 'e50e8400-e29b-41d4-a716-446655440005', 'Gorengan berminyak biasanya karena suhu minyak kurang panas atau terlalu banyak gorengan dalam sekali masak. Pastikan minyak benar-benar panas (test dengan tusuk gigi, kalau berbusa berarti siap) dan jangan terlalu penuh.', 'ai', NOW() - INTERVAL '4 days'),

('f50e8400-e29b-41d4-a716-446655440017', 'e50e8400-e29b-41d4-a716-446655440007', 'Mau bikin klepon tapi takut pecah saat direbus. Ada triknya?', 'user', NOW() - INTERVAL '1 day'),
('f50e8400-e29b-41d4-a716-446655440018', 'e50e8400-e29b-41d4-a716-446655440007', 'Tips klepon tidak pecah: jangan terlalu tipis kulitnya, isi gula merah jangan terlalu banyak, dan rebus dengan air mendidih tapi api dikecilkan. Klepon matang kalau sudah mengapung.', 'ai', NOW() - INTERVAL '1 day');

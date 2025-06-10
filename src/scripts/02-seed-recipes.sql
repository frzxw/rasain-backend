-- Seed Indonesian Recipes
INSERT INTO recipes (id, name, slug, rating, review_count, estimated_cost, cook_time, prep_time, total_time, servings, difficulty_level, description, created_by, is_featured, created_at) VALUES

-- Traditional Main Dishes
('650e8400-e29b-41d4-a716-446655440001', 'Nasi Gudeg Yogyakarta', 'nasi-gudeg-yogyakarta', 4.8, 156, 'Rp35.000', '3 jam', '30 menit', '3.5 jam', 4, 'hard', 'Gudeg adalah makanan khas Yogyakarta yang terbuat dari nangka muda yang dimasak dengan santan dan gula merah. Disajikan dengan nasi, ayam, telur, dan sambal krecek.', '550e8400-e29b-41d4-a716-446655440001', true, NOW() - INTERVAL '25 days'),

('650e8400-e29b-41d4-a716-446655440002', 'Rendang Daging Sapi Padang', 'rendang-daging-sapi-padang', 4.9, 203, 'Rp85.000', '4 jam', '45 menit', '4.75 jam', 6, 'hard', 'Rendang adalah masakan daging dengan bumbu rempah-rempah yang kaya dari Minangkabau. Dimasak dalam waktu lama hingga bumbu meresap dan kuah mengering.', '550e8400-e29b-41d4-a716-446655440003', true, NOW() - INTERVAL '23 days'),

('650e8400-e29b-41d4-a716-446655440003', 'Gado-gado Jakarta', 'gado-gado-jakarta', 4.6, 89, 'Rp25.000', '20 menit', '25 menit', '45 menit', 2, 'easy', 'Gado-gado adalah salad Indonesia yang terdiri dari sayuran rebus, tahu, tempe, telur rebus, dan kerupuk yang disiram dengan bumbu kacang.', '550e8400-e29b-41d4-a716-446655440002', false, NOW() - INTERVAL '20 days'),

('650e8400-e29b-41d4-a716-446655440004', 'Sate Ayam Madura', 'sate-ayam-madura', 4.7, 134, 'Rp45.000', '30 menit', '2 jam', '2.5 jam', 4, 'medium', 'Sate ayam khas Madura dengan bumbu kacang yang gurih dan manis. Daging ayam dipotong kecil, ditusuk, dan dibakar hingga matang.', '550e8400-e29b-41d4-a716-446655440004', true, NOW() - INTERVAL '18 days'),

('650e8400-e29b-41d4-a716-446655440005', 'Nasi Liwet Solo', 'nasi-liwet-solo', 4.5, 67, 'Rp30.000', '1 jam', '20 menit', '1.33 jam', 4, 'medium', 'Nasi liwet adalah nasi yang dimasak dengan santan dan rempah-rempah, disajikan dengan lauk pauk seperti ayam, telur, dan sayuran.', '550e8400-e29b-41d4-a716-446655440005', false, NOW() - INTERVAL '16 days'),

('650e8400-e29b-41d4-a716-446655440006', 'Rawon Surabaya', 'rawon-surabaya', 4.8, 112, 'Rp40.000', '2 jam', '30 menit', '2.5 jam', 4, 'medium', 'Rawon adalah sup daging sapi berwarna hitam khas Jawa Timur yang menggunakan kluwek sebagai bumbu utama.', '550e8400-e29b-41d4-a716-446655440006', true, NOW() - INTERVAL '14 days'),

('650e8400-e29b-41d4-a716-446655440007', 'Ayam Betutu Bali', 'ayam-betutu-bali', 4.7, 98, 'Rp65.000', '3 jam', '1 jam', '4 jam', 6, 'hard', 'Ayam betutu adalah ayam utuh yang dibumbui dengan bumbu base genep khas Bali dan dipanggang dalam waktu lama.', '550e8400-e29b-41d4-a716-446655440007', false, NOW() - INTERVAL '12 days'),

('650e8400-e29b-41d4-a716-446655440008', 'Pempek Palembang', 'pempek-palembang', 4.6, 145, 'Rp35.000', '1 jam', '45 menit', '1.75 jam', 4, 'medium', 'Pempek adalah makanan khas Palembang yang terbuat dari ikan dan sagu, disajikan dengan kuah cuko yang asam pedas.', '550e8400-e29b-41d4-a716-446655440008', true, NOW() - INTERVAL '10 days'),

('650e8400-e29b-41d4-a716-446655440009', 'Soto Betawi', 'soto-betawi', 4.5, 87, 'Rp32.000', '1.5 jam', '30 menit', '2 jam', 4, 'medium', 'Soto Betawi adalah soto khas Jakarta dengan kuah santan yang gurih, berisi daging sapi, jeroan, dan kentang.', '550e8400-e29b-41d4-a716-446655440009', false, NOW() - INTERVAL '8 days'),

('650e8400-e29b-41d4-a716-446655440010', 'Nasi Padang', 'nasi-padang', 4.8, 178, 'Rp45.000', '2 jam', '1 jam', '3 jam', 4, 'hard', 'Nasi Padang adalah hidangan nasi dengan berbagai lauk pauk khas Minangkabau seperti rendang, gulai, dan sambal.', '550e8400-e29b-41d4-a716-446655440010', true, NOW() - INTERVAL '6 days'),

('650e8400-e29b-41d4-a716-446655440011', 'Bakso Malang', 'bakso-malang', 4.4, 156, 'Rp25.000', '45 menit', '30 menit', '1.25 jam', 2, 'medium', 'Bakso Malang adalah bakso khas Malang dengan berbagai variasi bakso dan mie, disajikan dalam kuah kaldu yang gurih.', '550e8400-e29b-41d4-a716-446655440011', false, NOW() - INTERVAL '4 days'),

('650e8400-e29b-41d4-a716-446655440012', 'Pecel Lele', 'pecel-lele', 4.3, 92, 'Rp20.000', '25 menit', '15 menit', '40 menit', 2, 'easy', 'Pecel lele adalah ikan lele goreng yang disajikan dengan nasi, lalapan, dan sambal terasi yang pedas.', '550e8400-e29b-41d4-a716-446655440012', false, NOW() - INTERVAL '2 days'),

-- Desserts and Snacks
('650e8400-e29b-41d4-a716-446655440013', 'Es Cendol', 'es-cendol', 4.5, 78, 'Rp15.000', '30 menit', '20 menit', '50 menit', 4, 'easy', 'Es cendol adalah minuman segar dengan cendol hijau, santan, dan gula merah yang manis.', '550e8400-e29b-41d4-a716-446655440001', false, NOW() - INTERVAL '1 day'),

('650e8400-e29b-41d4-a716-446655440014', 'Klepon', 'klepon', 4.6, 65, 'Rp18.000', '45 menit', '30 menit', '1.25 jam', 6, 'medium', 'Klepon adalah kue tradisional berbentuk bulat dengan isian gula merah dan dibalut kelapa parut.', '550e8400-e29b-41d4-a716-446655440002', false, NOW()),

('650e8400-e29b-41d4-a716-446655440015', 'Martabak Manis', 'martabak-manis', 4.4, 123, 'Rp25.000', '20 menit', '15 menit', '35 menit', 4, 'easy', 'Martabak manis adalah pancake tebal Indonesia dengan berbagai topping seperti coklat, keju, dan kacang.', '550e8400-e29b-41d4-a716-446655440003', false, NOW() - INTERVAL '3 days');

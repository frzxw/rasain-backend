-- Seed Users and User Profiles
-- Note: In production, users would be created through Supabase Auth
-- This is for development/testing purposes

INSERT INTO users (id, email, email_verified, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'chef.sari@example.com', true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', 'budi.masak@example.com', true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440003', 'ibu.rina@example.com', true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440004', 'pak.joko@example.com', true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440005', 'dewi.kitchen@example.com', true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440006', 'andi.chef@example.com', true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440007', 'maya.cook@example.com', true, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440008', 'rudi.dapur@example.com', true, NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440009', 'sinta.resep@example.com', true, NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440010', 'agus.kuliner@example.com', true, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440011', 'lina.masakan@example.com', true, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440012', 'doni.spice@example.com', true, NOW());

INSERT INTO user_profiles (id, name, saved_recipes_count, posts_count, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Chef Sari Nusantara', 15, 8, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', 'Budi Santoso', 12, 5, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440003', 'Ibu Rina Wijaya', 20, 12, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440004', 'Pak Joko Susilo', 8, 3, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440005', 'Dewi Kartika', 18, 7, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440006', 'Andi Pratama', 10, 4, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440007', 'Maya Sari', 14, 6, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440008', 'Rudi Hermawan', 9, 2, NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440009', 'Sinta Maharani', 16, 9, NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440010', 'Agus Setiawan', 11, 4, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440011', 'Lina Kusuma', 13, 5, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440012', 'Doni Saputra', 7, 2, NOW());

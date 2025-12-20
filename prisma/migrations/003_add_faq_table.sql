-- Add FAQ table for dynamic content management
-- Migrates hardcoded FAQ data from config.ts to database

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_active_sorted ON faqs(is_active, sort_order);

-- Seed initial FAQ data from config.ts
INSERT INTO faqs (question, answer, sort_order, is_active, created_at, updated_at) VALUES
(
  'Berapa lama waktu pengerjaan?',
  'Pengerjaan memakan waktu 7-14 hari kerja tergantung kompleksitas project.',
  1,
  true,
  NOW(),
  NOW()
),
(
  'Apakah termasuk hosting dan domain?',
  'Ya, semua paket sudah termasuk hosting 1 tahun dan domain .com gratis.',
  2,
  true,
  NOW(),
  NOW()
),
(
  'Bagaimana cara pembayaran?',
  'Pembayaran dilakukan via transfer bank atau QRIS. DP 50% di awal, pelunasan setelah selesai.',
  3,
  true,
  NOW(),
  NOW()
),
(
  'Apakah ada garansi?',
  'Ya, kami memberikan garansi bug fix gratis selama masa support berlaku.',
  4,
  true,
  NOW(),
  NOW()
);
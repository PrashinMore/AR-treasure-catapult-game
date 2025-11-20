-- AR Treasure Hunt Database Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Plays table: Track daily plays per device
CREATE TABLE IF NOT EXISTS plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions table: Track reward redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  redemption_code TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_plays_device_date ON plays(device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON redemptions(redemption_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_device ON redemptions(device_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed ON redemptions(redeemed, created_at);

-- Optional: Add RLS (Row Level Security) policies
-- Enable RLS
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert plays
CREATE POLICY "Allow insert plays" ON plays
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can insert redemptions
CREATE POLICY "Allow insert redemptions" ON redemptions
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read redemptions (for cashier lookup)
CREATE POLICY "Allow read redemptions" ON redemptions
  FOR SELECT USING (true);

-- Policy: Anyone can update redemptions (for marking as redeemed)
CREATE POLICY "Allow update redemptions" ON redemptions
  FOR UPDATE USING (true);

-- Optional: View for analytics
CREATE OR REPLACE VIEW redemption_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_rewards,
  COUNT(*) FILTER (WHERE redeemed = true) as redeemed_count,
  COUNT(*) FILTER (WHERE redeemed = false) as pending_count,
  reward_name,
  COUNT(*) FILTER (WHERE reward_name = reward_name) as reward_type_count
FROM redemptions
GROUP BY DATE(created_at), reward_name
ORDER BY date DESC;


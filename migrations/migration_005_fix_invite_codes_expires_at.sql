-- Fix invite codes with NULL expires_at
-- Set default expiration date (30 days from now) for invite codes without expiration

-- Update all invite codes with NULL expires_at to have 30 days expiration from creation time
UPDATE invite_codes
SET expires_at = datetime(created_at, '+30 days')
WHERE expires_at IS NULL;

-- Optional: Update invite codes with NULL expires_at to have 30 days expiration from now
-- Uncomment the line below if you want all NULL expires_at to expire 30 days from today
-- UPDATE invite_codes SET expires_at = datetime('now', '+30 days') WHERE expires_at IS NULL;
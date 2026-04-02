-- Add actual_end_time column to tournament_matches
-- Nullable timestamptz so existing rows are unaffected (no backfill needed)
ALTER TABLE tournament_matches
  ADD COLUMN IF NOT EXISTS actual_end_time timestamptz NULL;

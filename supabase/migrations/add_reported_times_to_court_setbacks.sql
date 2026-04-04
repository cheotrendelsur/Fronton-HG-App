-- Add reported_start and reported_end columns to court_setbacks
-- These store the organizer's chosen times (when the event actually happened)
-- as opposed to started_at/ended_at which are system timestamps
ALTER TABLE court_setbacks
  ADD COLUMN IF NOT EXISTS reported_start timestamptz NULL,
  ADD COLUMN IF NOT EXISTS reported_end timestamptz NULL;

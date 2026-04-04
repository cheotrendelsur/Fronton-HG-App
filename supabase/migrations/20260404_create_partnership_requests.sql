-- ============================================================
-- TASK-10.1 FASE 0 — Partnership Requests + Registration Updates
-- ============================================================

-- 1. Create tournament_partnership_requests table
CREATE TABLE IF NOT EXISTS tournament_partnership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES profiles(id),
  partner_requested_id uuid NOT NULL REFERENCES profiles(id),
  status varchar NOT NULL DEFAULT 'pending_partner_acceptance'
    CHECK (status IN ('pending_partner_acceptance', 'accepted', 'declined', 'converted_to_registration')),
  created_at timestamptz NOT NULL DEFAULT now(),
  partner_responded_at timestamptz,
  partner_response varchar CHECK (partner_response IN ('accepted', 'declined')),
  rejected_reason text,
  tournament_registrations_id uuid REFERENCES tournament_registrations(id),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT no_self_request CHECK (requester_id != partner_requested_id),
  CONSTRAINT unique_partnership_request UNIQUE (tournament_id, category_id, requester_id, partner_requested_id)
);

-- 2. Indexes for tournament_partnership_requests
CREATE INDEX IF NOT EXISTS idx_partnership_requester
  ON tournament_partnership_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_partnership_requested
  ON tournament_partnership_requests(partner_requested_id);

CREATE INDEX IF NOT EXISTS idx_partnership_tournament
  ON tournament_partnership_requests(tournament_id, category_id);

CREATE INDEX IF NOT EXISTS idx_partnership_status
  ON tournament_partnership_requests(status);

-- 3. Add columns to tournament_registrations (only those not already present)
-- status, decided_at, decided_by already exist per CLAUDE.md schema
ALTER TABLE tournament_registrations
  ADD COLUMN IF NOT EXISTS partnership_request_id uuid REFERENCES tournament_partnership_requests(id),
  ADD COLUMN IF NOT EXISTS rejected_reason text;

-- Index on new columns
CREATE INDEX IF NOT EXISTS idx_registrations_status
  ON tournament_registrations(status);

CREATE INDEX IF NOT EXISTS idx_registrations_partnership_request
  ON tournament_registrations(partnership_request_id);

-- 4. Enable RLS on tournament_partnership_requests
ALTER TABLE tournament_partnership_requests ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT — requester sees their own, partner sees requests to them, organizer sees all for their tournament
CREATE POLICY "Requester can read own partnership requests"
  ON tournament_partnership_requests FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Partner can read requests addressed to them"
  ON tournament_partnership_requests FOR SELECT
  USING (auth.uid() = partner_requested_id);

CREATE POLICY "Organizer can read all requests for their tournaments"
  ON tournament_partnership_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_partnership_requests.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- RLS: INSERT — only authenticated user as requester
CREATE POLICY "Authenticated user can create partnership request"
  ON tournament_partnership_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS: UPDATE — only partner_requested_id can update (to accept/decline)
CREATE POLICY "Partner can respond to partnership request"
  ON tournament_partnership_requests FOR UPDATE
  USING (auth.uid() = partner_requested_id);

-- Also allow requester to update (for cancellation scenarios) and RPC functions
CREATE POLICY "Requester can update own partnership request"
  ON tournament_partnership_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- 5. RPC: convert_partnership_request_to_registration
CREATE OR REPLACE FUNCTION convert_partnership_request_to_registration(
  p_request_id uuid,
  p_tournament_id uuid,
  p_category_id uuid,
  p_requester_id uuid,
  p_partner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requester_username text;
  v_partner_username text;
  v_team_name text;
  v_registration_id uuid;
BEGIN
  -- Get usernames
  SELECT username INTO v_requester_username FROM profiles WHERE id = p_requester_id;
  SELECT username INTO v_partner_username FROM profiles WHERE id = p_partner_id;

  IF v_requester_username IS NULL OR v_partner_username IS NULL THEN
    RAISE EXCEPTION 'Player profiles not found';
  END IF;

  v_team_name := v_requester_username || ' / ' || v_partner_username;

  -- Create tournament_registrations row
  INSERT INTO tournament_registrations (
    tournament_id, category_id, player1_id, player2_id,
    team_name, status, partnership_request_id
  ) VALUES (
    p_tournament_id, p_category_id, p_requester_id, p_partner_id,
    v_team_name, 'pending_organizer_approval', p_request_id
  )
  RETURNING id INTO v_registration_id;

  -- Update partnership request
  UPDATE tournament_partnership_requests
  SET status = 'converted_to_registration',
      partner_response = 'accepted',
      partner_responded_at = now(),
      tournament_registrations_id = v_registration_id,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN v_registration_id;
END;
$$;

-- 6. RPC: reject_partnership_request
CREATE OR REPLACE FUNCTION reject_partnership_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tournament_partnership_requests
  SET status = 'declined',
      partner_response = 'declined',
      partner_responded_at = now(),
      rejected_reason = p_reason,
      updated_at = now()
  WHERE id = p_request_id
    AND status = 'pending_partner_acceptance';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not in pending status';
  END IF;

  RETURN true;
END;
$$;

-- 7. Fix DEFAULT for tournament_registrations.status and migrate existing data
ALTER TABLE tournament_registrations
  ALTER COLUMN status SET DEFAULT 'approved';

UPDATE tournament_registrations
  SET status = 'approved'
  WHERE status IS NULL;

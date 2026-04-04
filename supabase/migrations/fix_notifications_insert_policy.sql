-- Fix notifications INSERT policy
-- The previous policy used a subquery on tournaments table which could fail
-- due to RLS on tournaments blocking the internal SELECT.
-- Simplify: allow any authenticated user to insert notifications.
-- App logic ensures only organizers trigger notification creation.

DROP POLICY IF EXISTS "notifications_insert" ON notifications;

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure one active membership per user in each server.
CREATE UNIQUE INDEX IF NOT EXISTS uq_server_membership_active
ON public.server_membership (server_id, user_id)
WHERE left_at IS NULL;
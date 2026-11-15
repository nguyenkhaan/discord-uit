ALTER TABLE public.message_reaction
ADD CONSTRAINT uq_message_reaction_message_user
UNIQUE (message_id, reacted_by_user_id);
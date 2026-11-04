ALTER TABLE public.chat_message
    ALTER COLUMN content_text TYPE varchar(2000),
    ALTER COLUMN content_text SET NOT NULL;

DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'chat_message'
          AND column_name = 'client_request_id'
          AND data_type <> 'uuid'
    ) THEN
        ALTER TABLE public.chat_message
            ALTER COLUMN client_request_id TYPE uuid
            USING (
                CASE
                    WHEN client_request_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                        THEN client_request_id::uuid
                    ELSE overlay(
                        overlay(
                            md5(
                                server_id::text || ':' ||
                                sender_user_id::text || ':' ||
                                client_request_id::text
                            ) placing '5' from 13 for 1
                        ) placing '8' from 17 for 1
                    )::uuid
                END
            );
    END IF;
END
$migration$;

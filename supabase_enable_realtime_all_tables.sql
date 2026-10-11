-- Enable Supabase Realtime for all public tables in Supabase
-- Run this script in the Supabase SQL Editor

DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Create the publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Loop through all tables in the public schema and add them to the realtime publication
  FOR rec IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', rec.tablename);
    EXCEPTION
      WHEN duplicate_object THEN
        -- Table already added to publication
        NULL;
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not add table % to supabase_realtime: %', rec.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- Set REPLICA IDENTITY FULL for critical realtime tables
-- This ensures that full row payload (old and new) is sent during UPDATE and DELETE events
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER TABLE public.user_locations REPLICA IDENTITY FULL;
ALTER TABLE public.drivers REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

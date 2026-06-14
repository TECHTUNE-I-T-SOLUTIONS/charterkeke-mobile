ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS eta_minutes integer;

COMMENT ON COLUMN public.rides.eta_minutes IS
'Persisted ETA in minutes shown during booking and before ride start. Once the trip starts, duration_minutes should reflect the completed ride time instead.';

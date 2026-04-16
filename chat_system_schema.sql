-- Chat System Tables for Charter Keke Mobile App
-- Created: April 8, 2026

-- Enable realtime for new tables
-- Note: Run these commands in Supabase SQL editor or via migration

-- Create chats table
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL,
  rider_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE CASCADE,
  CONSTRAINT chats_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT chats_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT chats_unique_ride UNIQUE (ride_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  message_type character varying NOT NULL DEFAULT 'text' CHECK (message_type::text = ANY (ARRAY['text'::character varying, 'location'::character varying]::text[])),
  location_data jsonb,
  sent_at timestamp without time zone DEFAULT now(),
  read_by_rider boolean NOT NULL DEFAULT false,
  read_by_driver boolean NOT NULL DEFAULT false,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_chats_ride_id ON public.chats(ride_id);
CREATE INDEX idx_chats_rider_id ON public.chats(rider_id);
CREATE INDEX idx_chats_driver_id ON public.chats(driver_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);

-- Function to create notification for new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  chat_record RECORD;
  recipient_id uuid;
  sender_name text;
  notification_title text;
  notification_message text;
BEGIN
  -- Get chat details
  SELECT * INTO chat_record FROM public.chats WHERE id = NEW.chat_id;

  -- Determine recipient
  IF NEW.sender_id = chat_record.rider_id THEN
    recipient_id := chat_record.driver_id;
  ELSE
    recipient_id := chat_record.rider_id;
  END IF;

  -- Get sender name
  SELECT CONCAT(first_name, ' ', last_name) INTO sender_name
  FROM public.users
  WHERE id = NEW.sender_id;

  -- Create notification content
  IF NEW.message_type = 'location' THEN
    notification_title := 'Location Shared';
    notification_message := sender_name || ' shared their location with you';
  ELSE
    notification_title := 'New Message';
    notification_message := sender_name || ': ' || LEFT(NEW.content, 100);
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    channel,
    related_table,
    related_id,
    data
  ) VALUES (
    recipient_id,
    notification_title,
    notification_message,
    'system',
    'push',
    'messages',
    NEW.id,
    jsonb_build_object(
      'chat_id', NEW.chat_id,
      'ride_id', chat_record.ride_id,
      'sender_id', NEW.sender_id,
      'message_type', NEW.message_type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new message notifications
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Function to update chat updated_at
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET updated_at = now()
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat timestamp on new message
CREATE TRIGGER trigger_update_chat_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Enable realtime
ALTER TABLE public.chats REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Grant permissions (no RLS, so direct grants)
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;</content>
<parameter name="filePath">d:\Codes\ck\chat_system_schema.sql
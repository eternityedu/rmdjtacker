-- Add is_read and recipient_id columns to owner_admin_messages for proper message tracking
ALTER TABLE public.owner_admin_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- Create index for faster unread count queries
CREATE INDEX IF NOT EXISTS idx_owner_admin_messages_recipient_read 
ON public.owner_admin_messages(recipient_id, is_read) 
WHERE is_read = false;

-- Allow admins to see all profiles for house owner information
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to update messages (to mark as read)
CREATE POLICY "Admins can update any message" 
ON public.owner_admin_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow owners to update their own received messages (to mark as read)
CREATE POLICY "Owners can update received messages" 
ON public.owner_admin_messages 
FOR UPDATE 
USING (recipient_id = auth.uid());
-- Add visible_to_admin_id column to users table
-- This column allows a user to be visible only to a specific admin

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS visible_to_admin_id UUID;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_visible_to_admin_id ON users(visible_to_admin_id);

-- Add comment
COMMENT ON COLUMN users.visible_to_admin_id IS 'If set, this user is only visible to the admin with this ID. Other admins and users cannot see this user.';


-- First, update all groups to have consistent status
UPDATE groups
SET status = 
  CASE 
    WHEN approval_status = 'approved' THEN 'active'
    WHEN approval_status = 'rejected' THEN 'suspended'
    ELSE 'pending'
  END;

-- Drop the approval_status column since we're consolidating to just 'status'
ALTER TABLE groups
DROP COLUMN IF EXISTS approval_status;

-- Add constraint to status column
ALTER TABLE groups
ADD CONSTRAINT groups_status_check
CHECK (status IN ('pending', 'active', 'suspended')); 
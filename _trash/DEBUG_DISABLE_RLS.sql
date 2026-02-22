-- DEBUG: DISABLE RLS TO VERIFY DATA EXISTENCE
-- Run this script to temporarily disable security policies.
-- If you see appointments after running this, the issue is definitely in the RLS policies.

ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Verify data exists
SELECT count(*) FROM appointments;

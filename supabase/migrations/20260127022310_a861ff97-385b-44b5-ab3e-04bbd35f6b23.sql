-- Add biometric preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT true;

-- Update existing user "Gabriel Cordero" to have biometric enabled
UPDATE public.profiles 
SET biometric_enabled = true 
WHERE full_name ILIKE '%gabriel cordero%';

-- Comment explaining the column
COMMENT ON COLUMN public.profiles.biometric_enabled IS 'Whether the user has biometric lock enabled. Defaults to true for new users.';
-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS bid_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bid_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL;

-- Rename is_available to available for code compatibility
ALTER TABLE public.products RENAME COLUMN is_available TO available;

-- Rename price_per_unit to price for code compatibility  
ALTER TABLE public.products DROP COLUMN IF EXISTS price_per_unit;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS land_size TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS preferred_categories TEXT[];

-- Update the handle_new_user function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'buyer')
  );
  RETURN NEW;
END;
$$;

-- Add missing columns to bids table for bid history
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS bidder_name TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL;
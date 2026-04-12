ALTER TABLE public.business_profiles
ADD COLUMN signature_text TEXT,
ADD COLUMN signature_font TEXT DEFAULT 'caveat';

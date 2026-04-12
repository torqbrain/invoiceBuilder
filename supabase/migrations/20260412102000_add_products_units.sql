CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  hsn_sac VARCHAR,
  rate NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Qty',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_product_per_business UNIQUE(business_profile_id, name)
);

CREATE INDEX idx_products_business_profile ON public.products(business_profile_id);
CREATE INDEX idx_products_active ON public.products(is_active);

ALTER TABLE public.invoice_items
ADD COLUMN unit TEXT,
ADD COLUMN product_id UUID REFERENCES public.products(id);

CREATE INDEX idx_invoice_items_product_id ON public.invoice_items(product_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on products"
ON public.products
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

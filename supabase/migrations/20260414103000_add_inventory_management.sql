ALTER TABLE public.products
ADD COLUMN sku TEXT,
ADD COLUMN item_type TEXT NOT NULL DEFAULT 'service',
ADD COLUMN category TEXT,
ADD COLUMN brand TEXT,
ADD COLUMN barcode TEXT,
ADD COLUMN cost_price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN track_inventory BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN opening_stock NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN reorder_level NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN storage_location TEXT;

CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_item_type ON public.products(item_type);
CREATE INDEX idx_products_track_inventory ON public.products(track_inventory);

CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity_change NUMERIC NOT NULL,
  unit_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_business_profile_id ON public.inventory_movements(business_profile_id);
CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements(reference_type, reference_id);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on inventory_movements" ON public.inventory_movements;

CREATE POLICY "Members can view inventory movements"
ON public.inventory_movements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = inventory_movements.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create inventory movements"
ON public.inventory_movements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = inventory_movements.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update inventory movements"
ON public.inventory_movements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = inventory_movements.business_profile_id
      AND bm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = inventory_movements.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete inventory movements"
ON public.inventory_movements
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = inventory_movements.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

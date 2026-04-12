CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_profile_id)
);

ALTER TABLE public.business_profiles
ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.customers
ADD COLUMN business_profile_id UUID REFERENCES public.business_profiles(id);

UPDATE public.business_profiles
SET owner_user_id = NULL
WHERE owner_user_id IS NULL;

UPDATE public.customers
SET business_profile_id = (
  SELECT bp.id
  FROM public.business_profiles bp
  ORDER BY bp.created_at NULLS LAST, bp.name
  LIMIT 1
)
WHERE business_profile_id IS NULL;

ALTER TABLE public.customers
ALTER COLUMN business_profile_id SET NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on business_profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow all on products" ON public.products;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own business memberships"
ON public.business_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own business memberships"
ON public.business_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view member businesses"
ON public.business_profiles
FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = business_profiles.id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create owned businesses"
ON public.business_profiles
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Members can update businesses"
ON public.business_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = business_profiles.id
      AND bm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = business_profiles.id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete businesses"
ON public.business_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = business_profiles.id
      AND bm.user_id = auth.uid()
      AND bm.role = 'owner'
  )
);

CREATE POLICY "Members can view customers"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = customers.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create customers"
ON public.customers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = customers.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update customers"
ON public.customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = customers.business_profile_id
      AND bm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = customers.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete customers"
ON public.customers
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = customers.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can view invoices"
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = invoices.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create invoices"
ON public.invoices
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = invoices.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update invoices"
ON public.invoices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = invoices.business_profile_id
      AND bm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = invoices.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete invoices"
ON public.invoices
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = invoices.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can view invoice items"
ON public.invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    JOIN public.business_members bm ON bm.business_profile_id = i.business_profile_id
    WHERE i.id = invoice_items.invoice_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create invoice items"
ON public.invoice_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    JOIN public.business_members bm ON bm.business_profile_id = i.business_profile_id
    WHERE i.id = invoice_items.invoice_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update invoice items"
ON public.invoice_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    JOIN public.business_members bm ON bm.business_profile_id = i.business_profile_id
    WHERE i.id = invoice_items.invoice_id
      AND bm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    JOIN public.business_members bm ON bm.business_profile_id = i.business_profile_id
    WHERE i.id = invoice_items.invoice_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete invoice items"
ON public.invoice_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    JOIN public.business_members bm ON bm.business_profile_id = i.business_profile_id
    WHERE i.id = invoice_items.invoice_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can view products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = products.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create products"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = products.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update products"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = products.business_profile_id
      AND bm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = products.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete products"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_profile_id = products.business_profile_id
      AND bm.user_id = auth.uid()
  )
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_business_members_user_id ON public.business_members(user_id);
CREATE INDEX idx_business_members_business_profile_id ON public.business_members(business_profile_id);
CREATE INDEX idx_customers_business_profile_id ON public.customers(business_profile_id);

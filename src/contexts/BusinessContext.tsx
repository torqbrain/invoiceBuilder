import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { BusinessMemberWithBusiness, BusinessProfile } from "@/lib/types";

const ACTIVE_BUSINESS_STORAGE_KEY = "invoice-builder.active-business-id";

interface BusinessContextValue {
  businesses: BusinessProfile[];
  memberships: BusinessMemberWithBusiness[];
  activeBusinessId: string | null;
  activeBusiness: BusinessProfile | null;
  isLoading: boolean;
  setActiveBusinessId: (businessId: string) => void;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

async function ensureProfile(userId: string, email?: string) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    email: email ?? null,
  });

  if (error) throw error;
}

async function bootstrapDefaultBusiness(userId: string, email?: string) {
  await ensureProfile(userId, email);

  const { data: membershipRows, error: membershipError } = await supabase
    .from("business_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (membershipError) throw membershipError;
  if ((membershipRows ?? []).length > 0) return;

  const emailPrefix = email?.split("@")[0]?.trim();
  const businessName = emailPrefix ? `${emailPrefix}'s Business` : "My Business";

  const { data: business, error: businessError } = await supabase
    .from("business_profiles")
    .insert({
      name: businessName,
      owner_user_id: userId,
      is_default: true,
    })
    .select("id")
    .single();

  if (businessError) throw businessError;

  const { error: memberInsertError } = await supabase.from("business_members").insert({
    user_id: userId,
    business_profile_id: business.id,
    role: "owner",
  });

  if (memberInsertError) throw memberInsertError;
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const qc = useQueryClient();
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);

  const membershipsQuery = useQuery({
    queryKey: ["business_memberships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await bootstrapDefaultBusiness(user!.id, user?.email);

      const { data, error } = await supabase
        .from("business_members")
        .select("*, business_profiles(*)")
        .eq("user_id", user!.id);

      if (error) throw error;
      return (data ?? []) as BusinessMemberWithBusiness[];
    },
  });

  const memberships = membershipsQuery.data ?? [];
  const businesses = memberships
    .map((membership) => membership.business_profiles)
    .filter((business): business is BusinessProfile => Boolean(business));

  useEffect(() => {
    if (!user) {
      setActiveBusinessIdState(null);
      localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
      return;
    }

    const storedBusinessId = localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
    const availableBusinessIds = businesses.map((business) => business.id);

    if (storedBusinessId && availableBusinessIds.includes(storedBusinessId)) {
      setActiveBusinessIdState(storedBusinessId);
      return;
    }

    const fallbackBusinessId = businesses[0]?.id ?? null;
    setActiveBusinessIdState(fallbackBusinessId);
    if (fallbackBusinessId) {
      localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, fallbackBusinessId);
    }
  }, [user, businesses]);

  const setActiveBusinessId = (businessId: string) => {
    setActiveBusinessIdState(businessId);
    localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, businessId);
    qc.invalidateQueries();
  };

  const value = useMemo<BusinessContextValue>(
    () => ({
      businesses,
      memberships,
      activeBusinessId,
      activeBusiness: businesses.find((business) => business.id === activeBusinessId) ?? null,
      isLoading: isAuthLoading || membershipsQuery.isLoading,
      setActiveBusinessId,
    }),
    [businesses, memberships, activeBusinessId, isAuthLoading, membershipsQuery.isLoading]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within BusinessProvider");
  }

  return context;
}

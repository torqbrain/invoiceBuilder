import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TranslationMap } from "@/lib/types";

export function useTranslations(languageCode: string = "en") {
  const { data: translations, isLoading } = useQuery({
    queryKey: ["translations", languageCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .eq("language_code", languageCode)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const t = (key: string, fallback?: string): string => {
    const map = (translations?.translations || {}) as TranslationMap;
    return map[key] || fallback || key;
  };

  const isRtl = translations?.is_rtl ?? false;

  return { t, isRtl, isLoading, translations };
}

export function useAllTranslations() {
  return useQuery({
    queryKey: ["translations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("translations").select("*").order("language_name");
      if (error) throw error;
      return data;
    },
  });
}

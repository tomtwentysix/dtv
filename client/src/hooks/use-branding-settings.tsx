import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface BrandingSettings {
  id?: string;
  companyName: string;
  showCompanyText: boolean;
  logoImageId: string | null;
  faviconImageId: string | null;
  logoImage?: {
    id: string;
    url: string;
    title: string;
  } | null;
  faviconImage?: {
    id: string;
    url: string;
    title: string;
  } | null;
}

export function useBrandingSettings() {
  return useQuery<BrandingSettings>({
    queryKey: ["/api/branding-settings"],
  });
}

export function useUpdateBrandingSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<BrandingSettings>) => {
      const response = await apiRequest("PUT", "/api/branding-settings", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branding-settings"] });
    },
  });
}
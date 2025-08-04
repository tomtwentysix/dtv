import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface ClientUser {
  id: string;
  username: string;
  email: string;
  client?: {
    id: string;
    name: string;
    company?: string;
    phone?: string;
  };
}

export function useClientAuth() {
  const [, setLocation] = useLocation();

  // Query to get current client user profile
  const { data: clientUser, isLoading, error, refetch } = useQuery<ClientUser>({
    queryKey: ["/api/client/profile"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/client/logout");
      return res.json();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      // Redirect to client login
      setLocation("/client/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  const isAuthenticated = !!clientUser && !error;
  const isAuthLoading = isLoading;

  return {
    clientUser,
    isAuthenticated,
    isAuthLoading,
    logout,
    refetch,
  };
}
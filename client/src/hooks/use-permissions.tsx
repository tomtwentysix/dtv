import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function usePermissions() {
  const { user } = useAuth();
  
  const { data: userPermissions = [] } = useQuery({
    queryKey: ["/api/user/permissions"],
    enabled: !!user?.id,
  });

  const hasPermission = (permission: string): boolean => {
    if (!user || !userPermissions || !Array.isArray(userPermissions)) return false;
    return userPermissions.some((p: any) => p.name === permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  return {
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
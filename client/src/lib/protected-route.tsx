import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: string;
  requiredPermission?: string;
}

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/user/roles"],
    enabled: !!user,
  });

  const { data: userPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/user/permissions"],
    enabled: !!user,
  });

  if (isLoading || rolesLoading || permissionsLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check role requirement
  if (requiredRole) {
    const hasRole = Array.isArray(userRoles) && userRoles.some((role: any) => role.name === requiredRole);
    if (!hasRole) {
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
              <p className="text-muted-foreground">You don't have the required role to access this page.</p>
            </div>
          </div>
        </Route>
      );
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    const hasPermission = Array.isArray(userPermissions) && userPermissions.some((permission: any) => permission.name === requiredPermission);
    if (!hasPermission) {
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
              <p className="text-muted-foreground">You don't have the required permission to access this page.</p>
            </div>
          </div>
        </Route>
      );
    }
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

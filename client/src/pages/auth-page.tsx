import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Helper function to determine redirect path based on user roles
function getRedirectPath(userRoles: any[] | undefined): string {
  if (!userRoles || userRoles.length === 0) {
    return "/"; // Default to home if no roles
  }

  // Check for Admin role first (highest priority)
  if (userRoles.some(role => role.name === "Admin")) {
    return "/admin/dashboard";
  }

  // Check for Staff role
  if (userRoles.some(role => role.name === "Staff")) {
    return "/admin/dashboard"; // Staff also goes to admin dashboard
  }

  // Check for Client role
  if (userRoles.some(role => role.name === "Client")) {
    return "/client/dashboard";
  }

  // Default fallback
  return "/";
}

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Fetch user roles to determine redirect destination
  const { data: userRoles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ["/api/user/roles"],
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    // Show loading while fetching roles
    if (rolesLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // Handle role fetch error by defaulting to home page
    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      return <Redirect to="/" />;
    }
    
    // Determine redirect destination based on user role
    const redirectTo = getRedirectPath(userRoles as any[]);
    return <Redirect to={redirectTo} />;
  }

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Forms */}
      <div className="flex items-center justify-center p-8 bg-white dark:bg-black relative">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-8 left-8 text-gray-600 dark:text-gray-400 hover:text-dark-teal"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-xl font-bold text-dark-teal mb-2">dt.visuals</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Access your cinematic media portal
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Staff Login</CardTitle>
              <CardDescription>
                Access the administrative portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username or Email</Label>
                  <Input
                    id="login-username"
                    {...loginForm.register("username")}
                    placeholder="Enter your username or email"
                    className={loginForm.formState.errors.username ? "border-destructive" : ""}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register("password")}
                      placeholder="Enter your password"
                      className={loginForm.formState.errors.password ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="glassPrimary"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Staff accounts are managed by administrators.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-24 h-24 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Cinematic Excellence</h2>
          <p className="text-sm opacity-90">
            Access your exclusive media content and collaborate with our team on your cinematic projects.
          </p>
          <div className="space-y-2 text-sm opacity-80">
            <p>✓ Secure client portal access</p>
            <p>✓ High-quality media delivery</p>
            <p>✓ Professional project management</p>
          </div>
        </div>
      </div>
    </div>
  );
}

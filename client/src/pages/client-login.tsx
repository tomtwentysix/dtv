import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const clientLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type ClientLoginFormData = z.infer<typeof clientLoginSchema>;

export default function ClientLoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientLoginFormData>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: ClientLoginFormData) => {
      const res = await apiRequest("POST", "/api/client/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.clientUser.username}!`,
      });
      // Redirect to client dashboard
      setLocation("/client/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientLoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Form */}
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
            <h1 className="text-3xl font-bold text-dark-teal mb-2">dt.visuals</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Client Portal Access
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your media and provide feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your username"
                            className={form.formState.errors.username ? "border-destructive" : ""}
                            disabled={loginMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className={form.formState.errors.password ? "border-destructive" : ""}
                              disabled={loginMutation.isPending}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loginMutation.isPending}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    variant="glassPrimary"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need help? Contact your project manager for login credentials.
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
            <LogIn className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold">Client Portal</h2>
          <p className="text-lg opacity-90">
            Access your exclusive media content and collaborate with the dt.visuals team on your projects.
          </p>
          <div className="space-y-2 text-sm opacity-80">
            <p>✓ View your project media</p>
            <p>✓ Provide feedback and comments</p>
            <p>✓ Track project progress</p>
            <p>✓ Download approved content</p>
          </div>
        </div>
      </div>
    </div>
  );
}
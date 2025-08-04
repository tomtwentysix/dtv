import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Portfolio from "@/pages/portfolio";
import About from "@/pages/about";
import Services from "@/pages/services";
import Contact from "@/pages/contact";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminClients from "@/pages/admin/clients";
import AdminRoles from "@/pages/admin/roles";
import AdminMedia from "@/pages/admin/media";
import AdminWebsiteCustomization from "@/pages/admin/website-customization";
import ClientDashboard from "@/pages/client/dashboard";
import ClientLoginPage from "@/pages/client-login";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/contact" component={Contact} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Client Authentication */}
      <Route path="/client/login" component={ClientLoginPage} />
      
      {/* Protected Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredRole="Admin" />
      <ProtectedRoute path="/admin/users" component={AdminUsers} requiredPermission="view:users" />
      <ProtectedRoute path="/admin/clients" component={AdminClients} requiredPermission="view:clients" />
      <ProtectedRoute path="/admin/roles" component={AdminRoles} requiredPermission="edit:roles" />
      <ProtectedRoute path="/admin/media" component={AdminMedia} requiredPermission="upload:media" />
      <ProtectedRoute path="/admin/website-customization" component={AdminWebsiteCustomization} requiredPermission="edit:website" />
      
      {/* Client Routes - Authentication handled internally */}
      <Route path="/client/dashboard" component={ClientDashboard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

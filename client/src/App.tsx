import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";
import { useDynamicOpenGraph } from "@/hooks/use-dynamic-opengraph";
import { useDynamicSeo } from "@/hooks/use-dynamic-seo";
import { useStructuredData } from "@/hooks/use-structured-data";
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

// Component to handle dynamic favicon updates
function FaviconManager() {
  useDynamicFavicon();
  return null;
}

// Component to handle dynamic OpenGraph meta tag updates
function OpenGraphManager() {
  useDynamicOpenGraph();
  return null;
}

// Component to handle structured data injection for SEO rich results
function StructuredDataManager() {
  useStructuredData();
  return null;
}

// Component to handle dynamic SEO meta tag updates
function SeoManager() {
  useDynamicSeo();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <FaviconManager />
            <OpenGraphManager />
            <StructuredDataManager />
            <SeoManager />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

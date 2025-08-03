import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  LayoutDashboard,
  Users,
  Shield,
  VideoIcon,
  Settings,
  UserPlus,
  Home
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Media", href: "/admin/media", icon: VideoIcon },
  { name: "Clients", href: "/admin/clients", icon: UserPlus },
  { name: "Website", href: "/admin/website-customization", icon: Settings },
  { name: "Roles", href: "/admin/roles", icon: Shield },
  { name: "Users", href: "/admin/users", icon: Users },
];

export function AdminNavigation() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const { hasPermission } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav bg-white/10 dark:bg-black/30 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin/dashboard">
            <div className="text-2xl font-bold nav-text-dynamic cursor-pointer">
              dt.visuals <span className="text-sm font-normal text-dynamic-subtle">Admin</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {adminNavItems.map((item) => {
                const IconComponent = item.icon;
                
                // Permission checks for different navigation items
                if (item.name === "Media" && !hasPermission('view:media')) return null;
                if (item.name === "Clients" && !hasPermission('view:clients')) return null;
                if (item.name === "Website" && !hasPermission('edit:website')) return null;
                if (item.name === "Roles" && !hasPermission('edit:roles')) return null;
                if (item.name === "Users" && !hasPermission('edit:users')) return null;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`cursor-pointer transition-colors duration-200 flex items-center gap-2 ${
                        location === item.href
                          ? "nav-text-dynamic font-semibold"
                          : "nav-text-dynamic hover:text-muted-orange"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="glassOutline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hover:bg-white/20"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 nav-text-dynamic" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 nav-text-dynamic" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-[hsl(184,65%,18%)]">
                    <User className="h-5 w-5 nav-text-dynamic" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.username}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem asChild className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4 nav-text-dynamic" />
                      Public Site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">
                    <LogOut className="mr-2 h-4 w-4 nav-text-dynamic" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="glassPrimary" className="hover:bg-white/20">Login</Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/20"
                  >
                    <Menu className="h-5 w-5 nav-text-dynamic" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    {adminNavItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link key={item.name} href={item.href}>
                          <span
                            className="block text-lg cursor-pointer text-dynamic hover:text-[hsl(184,65%,18%)] transition-colors flex items-center gap-2"
                            onClick={() => setMobileOpen(false)}
                          >
                            <IconComponent className="h-5 w-5" />
                            {item.name}
                          </span>
                        </Link>
                      );
                    })}
                    {user && (
                      <>
                        <hr className="my-4" />
                        <Link href="/">
                          <span
                            className="block text-lg cursor-pointer text-dynamic hover:text-[hsl(184,65%,18%)] transition-colors flex items-center gap-2"
                            onClick={() => setMobileOpen(false)}
                          >
                            <Home className="h-5 w-5" />
                            Public Site
                          </span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileOpen(false);
                          }}
                          className="text-lg text-left text-dynamic hover:text-[hsl(184,65%,18%)] transition-colors flex items-center gap-2"
                        >
                          <LogOut className="h-5 w-5" />
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
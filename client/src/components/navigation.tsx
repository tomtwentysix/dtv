import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, User, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
];

// Helper function to determine dashboard path based on user roles
function getDashboardPath(userRoles: any[] | undefined): string {
  if (!userRoles || userRoles.length === 0) {
    return "/auth"; // Redirect to auth if no roles
  }

  // Check for Admin role first (highest priority)
  if (userRoles.some((role) => role.name === "Admin")) {
    return "/admin/dashboard";
  }

  // Check for Staff role
  if (userRoles.some((role) => role.name === "Staff")) {
    return "/admin/dashboard"; // Staff also goes to admin dashboard
  }

  // Client role removed - clients now have separate authentication system

  // Default fallback
  return "/auth";
}

export function Navigation() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch user roles to determine dashboard destination
  const { data: userRoles } = useQuery({
    queryKey: ["/api/user/roles"],
    enabled: !!user,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserDashboardPath = () => {
    return user ? getDashboardPath(userRoles as any[]) : "/auth";
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav bg-white/10 dark:bg-black/30 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="text-2xl font-bold nav-text-dynamic cursor-pointer">
              dt.visuals
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`cursor-pointer transition-colors duration-200 ${
                      location === item.href
                        ? "nav-text-dynamic font-semibold"
                        : "nav-text-dynamic hover:text-[hsl(184,65%,18%)] dark:hover:text-[hsl(184,65%,18%)]"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-[hsl(184,65%,18%)]"
                  >
                    <User className="h-5 w-5 nav-text-dynamic" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md"
                >
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.username}
                  </div>
                  <div className="px-2 py-1.5 text-xs nav-text-dynamic opacity-90">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem
                    asChild
                    className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                  >
                    <Link href={getUserDashboardPath()}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                  >
                    <LogOut className="mr-2 h-4 w-4 nav-text-dynamic" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="glassPrimary" className="hover:bg-white/20">
                  Login
                </Button>
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
                    {navItems.map((item) => (
                      <Link key={item.name} href={item.href}>
                        <span
                          className="block text-lg cursor-pointer text-black dark:text-white hover:text-[hsl(184,65%,18%)] dark:hover:text-[hsl(184,65%,18%)] transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.name}
                        </span>
                      </Link>
                    ))}
                    {user && (
                      <>
                        <hr className="my-4" />
                        <Link href={getUserDashboardPath()}>
                          <span
                            className="block text-lg cursor-pointer text-black dark:text-white hover:text-[hsl(184,65%,18%)] dark:hover:text-[hsl(184,65%,18%)] transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            Dashboard
                          </span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileOpen(false);
                          }}
                          className="text-lg text-left text-black dark:text-white hover:text-[hsl(184,65%,18%)] dark:hover:text-[hsl(184,65%,18%)] transition-colors"
                        >
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

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CookieBannerProps {
  className?: string;
}

export function CookieBanner({ className }: CookieBannerProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isSlideUp, setIsSlideUp] = React.useState(false);

  // Check if user has already made a choice
  React.useEffect(() => {
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      // Small delay for better UX
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsSlideUp(true), 100);
      }, 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString()
    }));
    handleClose();
  };

  const handleRejectAll = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      necessary: true, // Necessary cookies cannot be rejected
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString()
    }));
    handleClose();
  };

  const handleManagePreferences = () => {
    // For now, just show an alert. In a real implementation, this would open a preferences modal
    alert("Cookie preferences management would open here. For this demo, this will accept necessary cookies only.");
    handleRejectAll();
  };

  const handleClose = () => {
    setIsSlideUp(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-x-0 bottom-0 z-50 p-4 transition-transform duration-300 ease-out",
      isSlideUp ? "translate-y-0" : "translate-y-full",
      className
    )}>
      <Card className="relative mx-auto max-w-4xl bg-card/95 backdrop-blur-lg border-border/50 shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleClose}
          aria-label="Close cookie banner"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardContent className="p-6 pr-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold">We use cookies</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, 
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                You can manage your preferences or learn more in our{" "}
                <a 
                  href="/privacy-policy" 
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row lg:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManagePreferences}
                className="text-xs lg:text-sm"
              >
                <Settings className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                Manage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="text-xs lg:text-sm"
              >
                Reject All
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs lg:text-sm"
              >
                Accept All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
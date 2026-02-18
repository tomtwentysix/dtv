import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useBrandingSettings } from "@/hooks/use-branding-settings";
import { Instagram, Facebook, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Fetch contact information and branding settings
  const { data: contactInfo } = useQuery({
    queryKey: ['/api/contact-info'],
  });
  const { data: brandingSettings } = useBrandingSettings();

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {/* Always show dark mode logo if available, otherwise show light mode logo */}
              {brandingSettings?.logoDarkImage ? (
                <img 
                  src={brandingSettings.logoDarkImage.url}
                  alt={brandingSettings.logoDarkImage.title || brandingSettings.companyName || "Logo"}
                  className="w-[75px] h-[75px] object-contain"
                />
              ) : brandingSettings?.logoLightImage ? (
                <img 
                  src={brandingSettings.logoLightImage.url}
                  alt={brandingSettings.logoLightImage.title || brandingSettings.companyName || "Logo"}
                  className="w-[75px] h-[75px] object-contain"
                />
              ) : (
                <div className="w-[75px] h-[75px] bg-gradient-to-br from-teal-500 to-orange-500 rounded-full" />
              )}
              {/* Show company name if text display is enabled */}
              {brandingSettings?.showCompanyText && (
                <span className="text-xl font-bold">
                  {brandingSettings?.companyName || "dt.visuals"}
                </span>
              )}
              {/* Fallback: show company name if no logos and text is disabled */}
              {!brandingSettings?.logoDarkImage && !brandingSettings?.logoLightImage && !brandingSettings?.showCompanyText && (
                <span className="text-xl font-bold">
                  {brandingSettings?.companyName || "dt.visuals"}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              DT Visuals | Video Production for Luxury Events, Brands & Music | Leicestershire & UK
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/services" className="hover:text-teal-400 transition-colors">Video Production</Link></li>
              <li><Link href="/services" className="hover:text-teal-400 transition-colors">Photography</Link></li>
              <li><Link href="/services" className="hover:text-teal-400 transition-colors">Post-Production</Link></li>
              <li><Link href="/services" className="hover:text-teal-400 transition-colors">Creative Direction</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/portfolio" className="hover:text-teal-400 transition-colors">Portfolio</Link></li>
              <li><Link href="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
              <li><Link href="/client/login" className="hover:text-teal-400 transition-colors">Client Portal</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{(contactInfo as any)?.contactEmail || 'hello@dtvisuals.com'}</li>
              <li>{(contactInfo as any)?.contactPhone || '+1 (555) 123-4567'}</li>
              <li>{(contactInfo as any)?.contactAddress || 'Los Angeles, CA'}</li>
            </ul>
            
            {/* Social Links */}
            {((contactInfo as any)?.instagramUrl || (contactInfo as any)?.facebookUrl || (contactInfo as any)?.linkedinUrl) && (
              <div className="pt-4">
                <h4 className="text-sm font-medium text-white mb-3">Follow Us</h4>
                <div className="flex space-x-3">
                  {(contactInfo as any)?.instagramUrl && (
                    <a
                      href={(contactInfo as any).instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-accent hover:text-white transition-all duration-200"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {(contactInfo as any)?.facebookUrl && (
                    <a
                      href={(contactInfo as any).facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-accent hover:text-white transition-all duration-200"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {(contactInfo as any)?.linkedinUrl && (
                    <a
                      href={(contactInfo as any).linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-accent hover:text-white transition-all duration-200"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-400">
            © {currentYear} {brandingSettings?.companyName || "dt.visuals"}. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-gray-400">
            <span className="hover:text-teal-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-teal-400 transition-colors cursor-pointer">Terms of Service</span>
            <Link href="/auth" className="text-gray-500 hover:text-gray-400 transition-colors text-xs">
              Staff Access
            </Link>
          </div>
        </div>

        {brandingSettings?.showTradingDetails && (
          <>
            <Separator className="my-6 bg-gray-800/50" />
            <div className="text-center space-y-1 text-xs text-gray-500">
              <p>dt. visuals is a trading name of Eleven Eighty Seven Ltd. Registered in England and Wales.</p>
              <p>Company Number: 17039209 | Registered Office Address: 24 Mill Field Close, South Kilworth, Lutterworth, LE17 6FE</p>
              <p>Contact: Dan@dtvisuals.com · +44 7877 492478</p>
              <p>© {currentYear} Eleven Eighty Seven Limited. All rights reserved.</p>
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
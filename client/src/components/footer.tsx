import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-orange-500 rounded-full" />
              <span className="text-xl font-bold">dt.visuals</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Creating cinematic experiences through professional media production, 
              storytelling, and visual artistry.
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

          {/* Staff Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Team Access</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Staff and administrative access
              </p>
              <Link href="/auth">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-400 transition-colors"
                >
                  Staff Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-400">
            © {currentYear} dt.visuals. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-gray-400">
            <span className="hover:text-teal-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-teal-400 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
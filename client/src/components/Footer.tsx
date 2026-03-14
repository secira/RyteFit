import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location === "/") {
      // On landing page, smooth scroll to features section
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On other pages, navigate to landing page
      window.location.href = "/#features";
    }
  };

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location === "/") {
      // On landing page, smooth scroll to how-it-works section
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On other pages, navigate to how-it-works page
      window.location.href = "/how-it-works";
    }
  };

  const productLinks = [
    { name: "Features", href: "/", onClick: handleFeaturesClick },
    { name: "How It Works", href: "/how-it-works", onClick: handleHowItWorksClick },
    { name: "Pricing", href: "/pricing" },
    { name: "RyteFit Demo", href: "/careers" },
  ];

  const solutionsLinks = [
    { name: "For Recruiters", href: "/#solutions" },
    { name: "For HR Teams", href: "/#solutions" },
    { name: "For Staffing Agencies", href: "/#solutions" },
    { name: "For Enterprises", href: "/#solutions" },
  ];

  const companyLinks = [
    { name: "About Us", href: "/company#about" },
    { name: "Careers", href: "/company#careers" },
    { name: "Leadership Team", href: "/company#leadership" },
    { name: "Press Releases", href: "/company#press" },
    { name: "Contact Us", href: "/company#contact" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Refund Policy", href: "/refund" },
    { name: "Risk Disclosure", href: "/risk-disclosure" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "/support#help-center" },
    { name: "FAQs", href: "/support#faq" },
    { name: "API Documentation", href: "/support#api-docs" },
    { name: "System Status", href: "/support#status" },
  ];

  const resourceLinks = [
    { name: "Blog", href: "/blog" },
    { name: "Recruiting Best Practices", href: "/resources" },
    { name: "Case Studies", href: "/resources#case-studies" },
    { name: "Webinars", href: "/resources#webinars" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-foreground" data-testid="text-footer-logo">
                RyteFit
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Transform your hiring process with AI-powered interviews. Screen candidates 50x faster with automatic question generation, real-time evaluation, and data-driven insights.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@rytefit.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+91-7200189076</span>
              </div>
              <div className="flex items-start space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Chennai, India</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  {link.onClick ? (
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                      onClick={link.onClick}
                      data-testid={`footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.name}
                    </Button>
                  ) : (
                    <Link href={link.href}>
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                        data-testid={`footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {link.name}
                      </Button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Solutions</h3>
            <ul className="space-y-3">
              {solutionsLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} onClick={scrollToTop}>
                    <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary">
                      {link.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} onClick={scrollToTop}>
                    <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary">
                      {link.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3 mb-6">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} onClick={scrollToTop}>
                    <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary">
                      {link.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3 mb-6">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} onClick={scrollToTop}>
                    <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary">
                      {link.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Media */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Follow Us</h4>
              <div className="flex space-x-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" data-testid="social-facebook">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" data-testid="social-twitter">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" data-testid="social-linkedin">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" data-testid="social-instagram">
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {currentYear} RyteFit. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">99.9% Uptime</span>
              </div>
              <div className="text-muted-foreground">|</div>
              <div className="text-muted-foreground">50+ Companies Trust Us</div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span>SOC 2 Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

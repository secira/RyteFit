import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  onLogin?: () => void;
  onGetStarted?: () => void;
}

export default function Header({ onLogin, onGetStarted }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogin = () => {
    setMobileOpen(false);
    if (onLogin) {
      onLogin();
    } else {
      window.location.href = "/auth";
    }
  };

  const handleGetStarted = () => {
    setMobileOpen(false);
    if (onGetStarted) {
      onGetStarted();
    } else {
      window.location.href = '/auth';
    }
  };

  const scrollToFeatures = () => {
    setMobileOpen(false);
    const element = document.getElementById('features');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/logo.png" alt="RyteFit" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            <span className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-platform-logo">
              RyteFit
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Button
            variant="ghost"
            data-testid="link-features"
            onClick={scrollToFeatures}
          >
            Features
          </Button>
          <Link href="/how-it-works">
            <Button variant="ghost" data-testid="link-how-it-works">
              How It Works
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" data-testid="link-pricing">
              Pricing
            </Button>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <Button variant="ghost" onClick={handleLogin} data-testid="button-login">
            Login
          </Button>
          <Button onClick={handleGetStarted} data-testid="button-get-started">
            Start Free Trial
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          data-testid="button-mobile-menu-toggle"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="px-4 py-3 flex flex-col gap-1">
            <Button variant="ghost" className="justify-start" onClick={scrollToFeatures} data-testid="link-features-mobile">
              Features
            </Button>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-how-it-works-mobile">
                How It Works
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-pricing-mobile">
                Pricing
              </Button>
            </Link>
            <div className="h-px bg-border my-2" />
            <Button variant="ghost" className="justify-start" onClick={handleLogin} data-testid="button-login-mobile">
              Login
            </Button>
            <Button onClick={handleGetStarted} data-testid="button-get-started-mobile">
              Start Free Trial
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  onLogin?: () => void;
  onGetStarted?: () => void;
}

export default function Header({ onLogin, onGetStarted }: HeaderProps) {
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      window.location.href = "/auth";
    }
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      window.location.href = '/auth';
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <span className="text-2xl font-bold text-foreground" data-testid="text-platform-logo">
              RyteFit
            </span>
          </div>
        </Link>
        
        {/* Navigation Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Button 
            variant="ghost" 
            data-testid="link-features"
            onClick={() => {
              const element = document.getElementById('features');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
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
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleLogin} data-testid="button-login">
            Login
          </Button>
          <Button onClick={handleGetStarted} data-testid="button-get-started">
            Start Free Trial
          </Button>
        </div>
      </div>
    </header>
  );
}

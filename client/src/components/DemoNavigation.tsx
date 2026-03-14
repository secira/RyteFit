import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, BarChart3, Settings, Home } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface DemoNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function DemoNavigation({ currentView, onViewChange }: DemoNavigationProps) {
  const navItems = [
    { id: "landing", label: "Landing Page", icon: Home, description: "Google-like simple homepage" },
    { id: "exam-selection", label: "Exam Selection", icon: BookOpen, description: "NEET & JEE test selection" },
    { id: "test-interface", label: "Test Interface", icon: BookOpen, description: "Live exam simulation" },
    { id: "dashboard", label: "Performance Dashboard", icon: BarChart3, description: "Analytics & rankings" },
    { id: "admin", label: "Admin Panel", icon: Settings, description: "Question management" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-semibold text-foreground">RyteFit Platform</span>
              <Badge variant="secondary">Design Demo</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Current View: <span className="font-medium text-foreground">{
                  navItems.find(item => item.id === currentView)?.label
                }</span>
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-semibold text-foreground">
            NEET & JEE Mock Test Platform
          </h1>
          <p className="text-lg text-muted-foreground">
            Interactive design prototype showcasing key features
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Card 
                key={item.id}
                className={`hover-elevate cursor-pointer transition-all ${
                  isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onViewChange(item.id)}
                data-testid={`card-nav-${item.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={isActive ? 'text-primary' : ''}>{item.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {isActive && (
                    <div className="mt-2">
                      <Badge variant="default" className="text-xs">
                        Currently Viewing
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">✅ Implemented in Prototype:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Responsive design for all devices</li>
                  <li>• Dark/Light theme toggle</li>
                  <li>• NEET & JEE exam selection</li>
                  <li>• Real-time test interface with timer</li>
                  <li>• Performance analytics dashboard</li>
                  <li>• Admin question management</li>
                  <li>• Clean, educational-focused UI</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🚀 Next Phase (Backend):</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• User authentication & registration</li>
                  <li>• Database schema implementation</li>
                  <li>• Payment integration (Razorpay)</li>
                  <li>• Real-time WebSocket support</li>
                  <li>• AI-powered doubt clearing</li>
                  <li>• All India synchronized exams</li>
                  <li>• Advanced analytics & rankings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
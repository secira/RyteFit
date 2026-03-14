import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, ChevronDown, Monitor, Wifi, HardDrive, Chrome } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I start an AI interview?",
      answer: "After logging in as a candidate, navigate to your dashboard where you'll find scheduled interviews. Click 'Start Interview' to begin your AI-powered interview session."
    },
    {
      question: "What is the difference between Live and Asynchronous interviews?",
      answer: "Live interviews are conducted in real-time with our AI interviewer. Asynchronous interviews allow candidates to record video responses at their convenience, which are then evaluated by AI."
    },
    {
      question: "How are candidates ranked?",
      answer: "Candidates are ranked using AI-powered evaluation across multiple dimensions including technical skills, communication ability, and cultural fit. Rankings are calculated based on interview performance and can be customized by recruiters."
    },
    {
      question: "Can candidates review their interview performance?",
      answer: "Yes! Candidates can access their interview recordings and performance feedback after the interview is completed. This includes AI-generated insights on communication and technical responses."
    },
    {
      question: "What subscription plans are available?",
      answer: "We offer three tiers: Starter (₹2,999/month for up to 50 interviews), Professional (₹9,999/month for up to 200 interviews), and Enterprise (Custom pricing with unlimited interviews and dedicated support)."
    },
    {
      question: "How does the AI interviewer work?",
      answer: "Our AI interviewer uses advanced natural language processing to conduct realistic interviews. It asks role-specific questions, analyzes responses in real-time, and provides comprehensive candidate evaluations."
    },
    {
      question: "Is there a time limit for interviews?",
      answer: "Yes, interview sessions have configurable time limits based on the role requirements. Typically, interviews range from 30-60 minutes. A countdown timer is visible during the interview."
    },
    {
      question: "Can I pause an interview and resume later?",
      answer: "Live interviews must be completed in one sitting. For asynchronous interviews, you can pause between questions. Your responses are auto-saved to prevent data loss."
    },
    {
      question: "What happens if my internet disconnects during an interview?",
      answer: "Don't worry! Your responses are automatically saved. When you reconnect, you can resume from where you left off, and the timer continues from the disconnection point."
    },
    {
      question: "How do I get a refund?",
      answer: "Please refer to our Refund Policy page for detailed information about refund eligibility and the process. Generally, refunds are processed within 7-10 business days of approval."
    }
  ];

  const systemRequirements = [
    {
      category: "Browser Requirements",
      icon: Chrome,
      items: [
        "Google Chrome (version 90 or later) - Recommended",
        "Mozilla Firefox (version 88 or later)",
        "Safari (version 14 or later)",
        "Microsoft Edge (version 90 or later)",
        "JavaScript must be enabled",
        "Cookies must be enabled"
      ]
    },
    {
      category: "Internet Connection",
      icon: Wifi,
      items: [
        "Minimum 2 Mbps broadband connection",
        "Recommended 5 Mbps or higher for best experience",
        "Stable connection required during tests",
        "Mobile data (4G/5G) supported"
      ]
    },
    {
      category: "Device Requirements",
      icon: Monitor,
      items: [
        "Desktop/Laptop: Windows 10+, macOS 10.14+, or Linux",
        "Tablet: iPad (iOS 14+), Android tablet (Android 8+)",
        "Smartphone: iOS 14+ or Android 8+ (not recommended for tests)",
        "Screen resolution: Minimum 1024x768 pixels",
        "RAM: Minimum 4GB (8GB recommended)"
      ]
    },
    {
      category: "Storage & Performance",
      icon: HardDrive,
      items: [
        "Free disk space: Minimum 500MB",
        "Processor: Dual-core 2.0 GHz or better",
        "Webcam (optional, for proctored tests)",
        "Microphone (optional, for voice-based AI tutor)"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Help Center Section */}
          <section id="help-center">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-semibold text-foreground mb-4">Support Center</h1>
              <p className="text-lg text-muted-foreground">
                We're here to help you succeed
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Help Center - Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Email Support</h3>
                      <a 
                        href="mailto:support@rytefit.com" 
                        className="text-primary hover:underline"
                        data-testid="link-support-email"
                      >
                        support@rytefit.com
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        We respond within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Phone Support</h3>
                      <a 
                        href="tel:+917200189076" 
                        className="text-primary hover:underline"
                        data-testid="link-support-phone"
                      >
                        +91-7200189076
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mon-Sat, 9 AM - 6 PM IST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Office Location</h3>
                      <p className="text-foreground" data-testid="text-support-location">
                        Chennai, India
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Serving students nationwide
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ Section */}
          <section id="faq">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-foreground mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Find quick answers to common questions
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border rounded-lg px-6 bg-card"
                  data-testid={`faq-item-${index}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* System Requirements Section */}
          <section id="system-requirements">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-foreground mb-2">System Requirements</h2>
              <p className="text-muted-foreground">
                Ensure your device meets these requirements for the best experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {systemRequirements.map((req, index) => {
                const Icon = req.icon;
                return (
                  <Card key={index} data-testid={`system-req-${index}`}>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{req.category}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {req.items.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Additional Help */}
          <section>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Still need help?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is always ready to assist you
                </p>
                <a 
                  href="mailto:support@rytefit.com"
                  className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  data-testid="button-contact-support"
                >
                  Contact Support
                </a>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

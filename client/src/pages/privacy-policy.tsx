import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: November, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-6">
              RyteFit ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered interview platform.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Name, email address, phone number</li>
              <li>Date of birth and academic information</li>
              <li>Payment and billing information</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Usage Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Test performance and analytics data</li>
              <li>Platform usage patterns and timestamps</li>
              <li>Device information and browser details</li>
              <li>IP address and location data</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Provide AI-powered interviews and candidate evaluations</li>
              <li>Generate interview analytics and performance reports</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send platform notifications and updates</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>With service providers who assist in platform operations</li>
              <li>For payment processing and subscription management</li>
              <li>When required by law or legal proceedings</li>
              <li>To protect our rights and prevent fraud</li>
              <li>In anonymous, aggregated form for research and analytics</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>SSL encryption for all data transmission</li>
              <li>Secure data storage with regular backups</li>
              <li>Access controls and authentication systems</li>
              <li>Regular security audits and monitoring</li>
              <li>Compliance with ISO 27001 and PCI DSS standards</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">Under applicable data protection laws, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Access and review your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated data</li>
              <li>Object to processing of your information</li>
              <li>Data portability and withdrawal of consent</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies to enhance your experience and analyze platform usage. You can manage cookie preferences through your browser settings.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-2">
              For privacy-related questions or concerns, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-foreground">Email: privacy@rytefit.com</p>
              <p className="text-foreground">Phone: +91-7200189076</p>
              <p className="text-foreground">Address: Chennai, India</p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Policy Updates</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date. Continued use of our platform constitutes acceptance of the revised policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
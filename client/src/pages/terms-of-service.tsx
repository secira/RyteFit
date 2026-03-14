import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: November, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-6">
              By accessing and using RyteFit's AI-powered interview platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Service Description</h2>
            <p className="text-muted-foreground mb-4">
              RyteFit provides AI-powered interview services for companies and candidates, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>AI-conducted video interviews with detailed evaluations</li>
              <li>Automated resume screening and candidate ranking</li>
              <li>Comprehensive candidate analytics and reporting</li>
              <li>Performance tracking and interview insights</li>
              <li>End-to-end recruitment workflow management</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">User Accounts and Registration</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Account Creation</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining account security and password confidentiality</li>
              <li>One account per user; multiple accounts are not permitted</li>
              <li>You must be at least 13 years old to create an account</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Account Responsibilities</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Keep your login credentials secure and do not share with others</li>
              <li>Notify us immediately of any unauthorized account access</li>
              <li>Update your information to ensure accuracy</li>
              <li>Comply with all applicable laws and platform policies</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Subscription and Payments</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Subscription Plans</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Free Plan: Limited access to basic mock tests</li>
              <li>Standard Plan: Enhanced features and additional test attempts</li>
              <li>Premium Plan: Full access including All India Exams and analytics</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Payment Terms</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Payments are processed securely through Razorpay</li>
              <li>Subscription fees are billed in advance on a recurring basis</li>
              <li>All fees are non-refundable except as outlined in our Refund Policy</li>
              <li>Price changes will be communicated 30 days in advance</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Platform Usage Guidelines</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Permitted Use</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Use the platform for legitimate educational purposes only</li>
              <li>Take mock tests in a fair and honest manner</li>
              <li>Respect intellectual property rights</li>
              <li>Follow exam timing and submission guidelines</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Prohibited Activities</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Sharing, copying, or distributing test content</li>
              <li>Using automated tools or scripts during tests</li>
              <li>Attempting to cheat or manipulate test results</li>
              <li>Disrupting platform operations or security</li>
              <li>Creating multiple accounts or account sharing</li>
              <li>Reverse engineering or extracting platform content</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Intellectual Property Rights</h2>
            <p className="text-muted-foreground mb-4">
              All content on the RyteFit platform, including questions, explanations, analytics, and interview materials, is protected by intellectual property laws.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Content is licensed for personal, educational use only</li>
              <li>Commercial use or redistribution is strictly prohibited</li>
              <li>Screenshots or recordings of test content are not allowed</li>
              <li>RyteFit retains all rights to platform content and technology</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Privacy and Data Protection</h2>
            <p className="text-muted-foreground mb-6">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our services, you consent to our privacy practices.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Platform Availability and Modifications</h2>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
              <li>Scheduled maintenance will be announced in advance</li>
              <li>We may modify features and functionality with reasonable notice</li>
              <li>Emergency maintenance may occur without prior notice</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              RyteFit provides hiring support services. Important limitations:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Our services are supplementary to formal education and preparation</li>
              <li>We do not guarantee specific exam results or admission outcomes</li>
              <li>Technical issues or service interruptions may occur</li>
              <li>Our liability is limited to the fees paid for our services</li>
              <li>We are not responsible for indirect or consequential damages</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Account Termination</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">User Termination</h3>
            <p className="text-muted-foreground mb-4">
              You may terminate your account at any time through your account settings or by contacting support.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">Platform Termination</h3>
            <p className="text-muted-foreground mb-6">
              We may suspend or terminate accounts for violations of these terms, fraudulent activity, or non-payment. Termination does not entitle you to refunds except as specified in our Refund Policy.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Governing Law and Disputes</h2>
            <p className="text-muted-foreground mb-6">
              These terms are governed by Indian law. Any disputes will be resolved through arbitration in Chennai, India, or the courts of Chennai if arbitration is not applicable.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-2">
              For questions about these Terms of Service, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-foreground">Email: legal@rytefit.com</p>
              <p className="text-foreground">Phone: +91-7200189076</p>
              <p className="text-foreground">Address: Chennai, India</p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms of Service periodically. Material changes will be communicated via email or platform notifications. Continued use after changes constitutes acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
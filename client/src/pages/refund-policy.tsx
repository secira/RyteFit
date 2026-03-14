import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: November, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
            <p className="text-muted-foreground mb-6">
              RyteFit is committed to customer satisfaction. This Refund Policy outlines the conditions under which refunds may be provided for our AI-powered interview platform subscriptions.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Refund Eligibility</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">7-Day Money-Back Guarantee</h3>
            <p className="text-muted-foreground mb-4">
              We offer a 7-day money-back guarantee for new premium subscriptions under the following conditions:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Request must be made within 7 days of initial subscription purchase</li>
              <li>Applies only to first-time premium subscribers</li>
              <li>Account usage must be less than 5 mock tests completed</li>
              <li>No violation of Terms of Service or platform policies</li>
              <li>Original payment method must be available for refund processing</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Technical Issues</h3>
            <p className="text-muted-foreground mb-4">
              Refunds may be considered for significant technical issues that prevent platform access:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Extended platform downtime affecting your subscription period</li>
              <li>Critical bugs that prevent test completion or access</li>
              <li>Payment processing errors resulting in duplicate charges</li>
              <li>Account access issues not resolved within 48 hours</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Non-Refundable Situations</h2>
            <p className="text-muted-foreground mb-4">
              Refunds will not be provided in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Change of mind after the 7-day guarantee period</li>
              <li>Failure to use the subscription during the billing period</li>
              <li>Dissatisfaction with test performance or results</li>
              <li>Account suspension due to policy violations</li>
              <li>Requests made after subscription expiration</li>
              <li>Free plan upgrades or downgrades</li>
              <li>Partial month refunds for monthly subscriptions</li>
              <li>Internet connectivity issues on the user's end</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Subscription-Specific Policies</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Monthly Subscriptions</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>7-day money-back guarantee applies to first month only</li>
              <li>No pro-rated refunds for early cancellation</li>
              <li>Access continues until end of current billing cycle</li>
              <li>Cancellation prevents future charges but doesn't refund current period</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Annual Subscriptions</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>7-day money-back guarantee applies to the full annual fee</li>
              <li>After 7 days, no refunds for unused portion</li>
              <li>Special consideration for extraordinary circumstances</li>
              <li>Premium features remain active until subscription expires</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Interview Packages</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>No refunds once interviews have been conducted</li>
              <li>Refunds available up to 24 hours before scheduled interview</li>
              <li>Technical issues during interviews may qualify for credits or refunds</li>
              <li>Platform outages or emergency cancellations result in full refunds</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Refund Process</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">How to Request a Refund</h3>
            <ol className="list-decimal pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Contact our support team via email or phone</li>
              <li>Provide your account details and purchase information</li>
              <li>Specify the reason for the refund request</li>
              <li>Submit any supporting documentation if applicable</li>
              <li>Allow 3-5 business days for review and processing</li>
            </ol>

            <h3 className="text-xl font-medium text-foreground mb-3">Processing Timeline</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Review: 1-3 business days for eligibility assessment</li>
              <li>Approval: Immediate notification via email</li>
              <li>Processing: 5-7 business days for payment refund</li>
              <li>Bank Transfer: Additional 2-3 days depending on your bank</li>
              <li>UPI/Wallet: Immediate to 24 hours for digital payments</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Alternative Resolutions</h2>
            <p className="text-muted-foreground mb-4">
              Instead of refunds, we may offer alternative solutions:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Account credits for future subscriptions</li>
              <li>Complimentary extension of current subscription</li>
              <li>Upgrade to higher-tier plan at no additional cost</li>
              <li>Additional interview credits or platform features</li>
              <li>One-on-one support session for technical issues</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Dispute Resolution</h2>
            <p className="text-muted-foreground mb-4">
              If you disagree with a refund decision:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Contact our customer success manager for escalation</li>
              <li>Provide additional documentation or clarification</li>
              <li>Request a second review of your case</li>
              <li>Final decisions will be communicated within 5 business days</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Payment Method Considerations</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Credit/Debit Cards</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Refunds processed to original card within 5-7 business days</li>
              <li>Bank processing may add additional 2-3 days</li>
              <li>Cancelled or expired cards may require alternative arrangements</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">UPI and Digital Wallets</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Immediate processing for most UPI transactions</li>
              <li>Wallet refunds typically complete within 24 hours</li>
              <li>Failed digital payments refunded automatically</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Net Banking</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Refunds processed to source bank account</li>
              <li>Timeline depends on individual bank processing policies</li>
              <li>May require additional verification for large amounts</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-2">
              For refund requests or questions about this policy, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-foreground">Email: refunds@rytefit.com</p>
              <p className="text-foreground">Phone: +91-7200189076</p>
              <p className="text-foreground">Support Hours: 9 AM - 7 PM IST, Monday to Saturday</p>
              <p className="text-foreground">Address: Chennai, India</p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Policy Updates</h2>
            <p className="text-muted-foreground">
              This Refund Policy may be updated periodically to reflect changes in our services or legal requirements. Updates will be posted on this page with a new effective date. Continued use of our platform constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
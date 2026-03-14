import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function RiskDisclosure() {
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
          <div className="flex items-center space-x-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-foreground">Risk Disclosure</h1>
          </div>
          <p className="text-muted-foreground">Last updated: November, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Important Notice</h2>
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <p className="text-foreground font-medium">
                Please read this Risk Disclosure carefully before using RyteFit's interview platform. Understanding these limitations and risks is essential for making informed decisions about your hiring process.
              </p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Educational Service Limitations</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Supplementary Nature of Services</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>RyteFit provides AI-powered interview evaluation as a supplementary tool</li>
              <li>Our services are not a replacement for human judgment in hiring decisions</li>
              <li>Success in our interviews does not guarantee job performance</li>
              <li>Individual candidate outcomes and hiring decisions may vary significantly</li>
              <li>AI evaluations may have limitations and should be reviewed by recruiters</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Performance Predictions</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Rankings and percentile predictions are based on limited data samples</li>
              <li>Actual exam performance may differ from mock test results</li>
              <li>All India Rankings reflect performance within our user base only</li>
              <li>Rank predictions cannot account for actual exam day variables</li>
              <li>Past performance in mock tests is not indicative of future results</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Technical and Platform Risks</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Technology Limitations</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Internet connectivity issues may affect test completion</li>
              <li>Browser compatibility problems could impact user experience</li>
              <li>Device performance may influence test-taking conditions</li>
              <li>Server downtime or maintenance may interrupt access</li>
              <li>Data loss is possible despite our backup systems</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Platform Availability</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>We target 99.9% uptime but cannot guarantee uninterrupted service</li>
              <li>Scheduled maintenance may affect access during critical study periods</li>
              <li>High traffic during exam seasons may slow platform performance</li>
              <li>Third-party service failures could impact platform functionality</li>
              <li>Emergency maintenance may occur without advance notice</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Content and Accuracy Risks</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Question Bank Limitations</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Questions may not perfectly replicate actual exam patterns</li>
              <li>Difficulty levels might not match official exam standards</li>
              <li>Answer explanations, while vetted, may contain errors</li>
              <li>Syllabus changes may not be immediately reflected</li>
              <li>Regional variations in exam patterns may not be covered</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Content Updates</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Educational content may become outdated</li>
              <li>Exam pattern changes may not be immediately incorporated</li>
              <li>New regulations or guidelines may affect content relevance</li>
              <li>Third-party content sources may change or become unavailable</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Financial and Investment Risks</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Subscription Investment</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Premium subscriptions require financial investment with no guaranteed outcomes</li>
              <li>Cost of subscription may not correlate with improvement in performance</li>
              <li>Alternative study methods might be more cost-effective for some users</li>
              <li>Refund eligibility is limited as outlined in our Refund Policy</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Opportunity Cost</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Time spent on our platform could be used for other preparation methods</li>
              <li>Reliance on digital tools may reduce offline study habits</li>
              <li>Over-dependence on mock tests might neglect conceptual understanding</li>
              <li>Platform usage time should be balanced with other learning activities</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Data and Privacy Considerations</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Data Security</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Despite security measures, data breaches are possible</li>
              <li>Performance data could be sensitive for competitive examinations</li>
              <li>Account information may be vulnerable to unauthorized access</li>
              <li>Third-party integrations may introduce additional security risks</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Performance Analytics</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Detailed performance tracking may create psychological pressure</li>
              <li>Comparative rankings could negatively impact student confidence</li>
              <li>Analytics may not accurately reflect individual learning progress</li>
              <li>Data interpretation requires educational expertise</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">User Responsibility and Expectations</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Realistic Expectations</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Improvement requires consistent effort beyond platform usage</li>
              <li>Success depends on multiple factors including prior knowledge and study habits</li>
              <li>Platform features should complement, not replace, comprehensive preparation</li>
              <li>Individual results may vary based on learning style and dedication</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">User Obligations</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Users must maintain realistic expectations about outcomes</li>
              <li>Platform should be used as part of a balanced study approach</li>
              <li>Technical requirements and internet connectivity are user responsibilities</li>
              <li>Users should seek professional guidance for academic planning</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Legal and Regulatory Considerations</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Educational Disclaimers</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>RyteFit is not affiliated with official hiring authorities</li>
              <li>Our evaluations and assessments are independent assessments</li>
              <li>Platform services do not guarantee hiring outcomes</li>
              <li>Users should verify information with official sources</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Limitation of Liability</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>RyteFit's liability is limited to the subscription fees paid</li>
              <li>We are not responsible for exam results or admission outcomes</li>
              <li>Indirect damages including lost opportunities are not covered</li>
              <li>Users assume responsibility for their exam preparation strategy</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Mitigation Strategies</h2>
            <p className="text-muted-foreground mb-4">
              To minimize risks while using our platform:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Use our services as part of a comprehensive study plan</li>
              <li>Maintain regular backups of important study notes and progress</li>
              <li>Diversify preparation methods and resources</li>
              <li>Consult with educators and counselors for academic guidance</li>
              <li>Set realistic goals and expectations for improvement</li>
              <li>Stay updated with official exam announcements and changes</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-2">
              For questions about risks or concerns about our services, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-foreground">Email: support@rytefit.com</p>
              <p className="text-foreground">Phone: +91-7200189076</p>
              <p className="text-foreground">Address: Chennai, India</p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Acknowledgment</h2>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-foreground font-medium">
                By using RyteFit's services, you acknowledge that you have read, understood, and accepted the risks outlined in this disclosure. You agree to use our platform responsibly and with realistic expectations about outcomes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
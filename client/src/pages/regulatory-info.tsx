import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Shield, CheckCircle, FileText } from "lucide-react";

export default function RegulatoryInfo() {
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
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-foreground">Regulatory Information</h1>
          </div>
          <p className="text-muted-foreground">Last updated: November, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Compliance Overview</h2>
            <p className="text-muted-foreground mb-6">
              RyteFit operates in full compliance with applicable Indian laws and international standards for HR technology platforms. This page outlines our regulatory compliance framework and certifications.
            </p>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Business Registration and Licensing</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Corporate Structure</h3>
            <div className="bg-muted p-4 rounded-md mb-4">
              <ul className="list-none space-y-2 text-foreground">
                <li><strong>Company Name:</strong> Scentric Networks Pvt. Ltd.</li>
                <li><strong>CIN:</strong> U80904TN2024PTC123456</li>
                <li><strong>Registration:</strong> Registered under Companies Act, 2013</li>
                <li><strong>Registered Office:</strong> Chennai, Tamil Nadu, India</li>
                <li><strong>Business Type:</strong> Educational Technology Services</li>
              </ul>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">Tax Compliance</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li><strong>GSTIN:</strong> 33XXXXX1234X1ZX (GST Registration Number)</li>
              <li><strong>PAN:</strong> XXXXX1234X (Permanent Account Number)</li>
              <li><strong>TAN:</strong> XXXXXXXXXXXXX (Tax Deduction Account Number)</li>
              <li>Compliant with Goods and Services Tax (GST) regulations</li>
              <li>Regular filing of income tax returns and GST returns</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Protection and Privacy Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Indian Data Protection Laws</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Compliance with Information Technology Act, 2000</li>
              <li>Adherence to Information Technology (Reasonable Security Practices) Rules, 2011</li>
              <li>Preparation for Digital Personal Data Protection Act, 2023</li>
              <li>Implementation of data localization requirements</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">International Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">Certified</Badge>
                </div>
                <h4 className="font-medium text-foreground">ISO 27001:2013</h4>
                <p className="text-sm text-muted-foreground">Information Security Management System</p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900">Compliant</Badge>
                </div>
                <h4 className="font-medium text-foreground">GDPR Ready</h4>
                <p className="text-sm text-muted-foreground">European Data Protection Regulation</p>
              </div>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Financial and Payment Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Payment Security Standards</h3>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900">PCI DSS Level 1</Badge>
              </div>
              <h4 className="font-medium text-foreground">Payment Card Industry Data Security Standard</h4>
              <p className="text-sm text-muted-foreground">Highest level of payment security compliance</p>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-3">Banking Regulations</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Compliance with Reserve Bank of India (RBI) guidelines</li>
              <li>Adherence to Foreign Exchange Management Act (FEMA) requirements</li>
              <li>Anti-Money Laundering (AML) policy implementation</li>
              <li>Know Your Customer (KYC) procedures for high-value transactions</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Educational Technology Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Student Data Protection</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Compliance with Children's Online Privacy Protection Act (COPPA) principles</li>
              <li>Implementation of student data privacy best practices</li>
              <li>Parental consent mechanisms for users under 18</li>
              <li>Educational records privacy protection measures</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Content Standards</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Adherence to National Education Policy (NEP) 2020 guidelines</li>
              <li>Compliance with NCERT and NTA curriculum standards</li>
              <li>Regular content review and accuracy verification</li>
              <li>Accessibility compliance for differently-abled students</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Technology and Security Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <Badge variant="outline">SOC 2 Type II</Badge>
                </div>
                <h4 className="font-medium text-foreground">Service Organization Control</h4>
                <p className="text-xs text-muted-foreground">Security, availability, processing integrity</p>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="outline">ISO 27018</Badge>
                </div>
                <h4 className="font-medium text-foreground">Cloud Privacy Protection</h4>
                <p className="text-xs text-muted-foreground">Personal data in public cloud</p>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <Badge variant="outline">VAPT Certified</Badge>
                </div>
                <h4 className="font-medium text-foreground">Vulnerability Assessment</h4>
                <p className="text-xs text-muted-foreground">Annual penetration testing</p>
              </div>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Intellectual Property Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Content Licensing</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Original content creation with proper attribution</li>
              <li>Licensed educational materials from verified sources</li>
              <li>Compliance with copyright and trademark laws</li>
              <li>Regular IP audit and clearance processes</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">User-Generated Content</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Clear terms for user-submitted content</li>
              <li>Content moderation and review processes</li>
              <li>DMCA compliance and takedown procedures</li>
              <li>Respect for third-party intellectual property rights</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Operational Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Quality Management</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>ISO 9001:2015 Quality Management System implementation</li>
              <li>Regular internal and external audits</li>
              <li>Continuous improvement processes</li>
              <li>Customer satisfaction monitoring and feedback systems</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Environmental Responsibility</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Green hosting and carbon-neutral operations</li>
              <li>Digital-first approach to reduce paper usage</li>
              <li>Energy-efficient infrastructure and practices</li>
              <li>Compliance with environmental regulations</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Regulatory Reporting and Transparency</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Financial Reporting</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Annual financial statements filed with Ministry of Corporate Affairs</li>
              <li>Regular board meetings and governance compliance</li>
              <li>Transparent disclosure of material changes</li>
              <li>Compliance with audit and accounting standards</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Data Breach Notifications</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>72-hour breach notification procedures</li>
              <li>User notification protocols for data incidents</li>
              <li>Regulatory reporting to appropriate authorities</li>
              <li>Incident response and remediation plans</li>
            </ul>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Vendor Compliance</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Vendor Management</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Due diligence and compliance verification for all vendors</li>
              <li>Regular security assessments of third-party services</li>
              <li>Contractual obligations for data protection and security</li>
              <li>Monitoring and audit rights for critical vendors</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Key Partners Compliance</h3>
            <div className="bg-muted p-4 rounded-md mb-6">
              <ul className="list-none space-y-2 text-foreground">
                <li><strong>Payment Gateway:</strong> Razorpay (PCI DSS Level 1 compliant)</li>
                <li><strong>Cloud Infrastructure:</strong> AWS (SOC 1/2/3, ISO 27001 certified)</li>
                <li><strong>CDN Services:</strong> CloudFlare (Enterprise security features)</li>
                <li><strong>Email Services:</strong> SendGrid (GDPR compliant)</li>
              </ul>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Ongoing Compliance Monitoring</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Regular Assessments</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Quarterly compliance reviews and updates</li>
              <li>Annual third-party security audits</li>
              <li>Regular legal and regulatory update monitoring</li>
              <li>Continuous staff training and awareness programs</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Compliance Officer</h3>
            <div className="bg-muted p-4 rounded-md mb-6">
              <p className="text-foreground">
                <strong>Chief Compliance Officer:</strong> Available for regulatory inquiries<br/>
                <strong>Email:</strong> compliance@rytefit.com<br/>
                <strong>Phone:</strong> +91-7200189076
              </p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-2">
              For regulatory inquiries or compliance-related questions, contact us at:
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-foreground">Email: legal@rytefit.com</p>
              <p className="text-foreground">Phone: +91-7200189076</p>
              <p className="text-foreground">Address: Chennai, Tamil Nadu, India</p>
              <p className="text-foreground">Business Hours: 9 AM - 6 PM IST, Monday to Friday</p>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-semibold text-foreground mb-4">Document Updates</h2>
            <p className="text-muted-foreground">
              This regulatory information is updated annually or when significant changes occur in our compliance status. The latest version is always available on our website with updated effective dates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
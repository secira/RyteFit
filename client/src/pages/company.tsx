import { Building2, Users, Award, Newspaper, Handshake, Mail, Phone, MapPin, Calendar, ArrowRight, CheckCircle, Target, Heart, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { Link } from "wouter";
import udayShankarImage from "@assets/Uday Shankar_1760074599198.jpg";
import jothiPriyaImage from "@assets/Jothi Priya_1760074592088.jpg";

export default function CompanyPage() {
  const coreValues = [
    {
      icon: Target,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from content quality to student support."
    },
    {
      icon: Heart,
      title: "Student-First",
      description: "Every decision we make is centered around improving student outcomes and experiences."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We continuously innovate to provide cutting-edge learning solutions."
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe in the power of partnerships and collaborative learning."
    }
  ];

  const leadership = [
    {
      name: "Uday Shankar",
      role: "Founder & CEO",
      description: "A seasoned professional with over 20 years in the IT industry, Uday is the visionary behind LEAP44, an advanced AI-powered resume builder designed to empower job seekers.",
      image: udayShankarImage
    },
    {
      name: "Jothi Priya",
      role: "Director",
      description: "Jothi Priya, our Director, is a dynamic and results-oriented professional with a strong background in project management and operations. Her strategic planning and execution skills are vital to our company's growth and success. Jothi is dedicated to fostering a culture of innovation and excellence.",
      image: jothiPriyaImage
    }
  ];


  const jobOpenings = [
    {
      title: "Senior Content Developer - Physics",
      type: "Full-time",
      location: "Chennai, India",
      department: "Content",
      description: "Create high-quality JEE/NEET Physics content and mock test questions."
    },
    {
      title: "Full Stack Developer",
      type: "Full-time",
      location: "Chennai, India / Remote",
      department: "Engineering",
      description: "Build and scale our educational technology platform."
    },
    {
      title: "Academic Counselor - NEET",
      type: "Full-time",
      location: "Chennai, India",
      department: "Student Success",
      description: "Guide NEET aspirants with personalized study plans and mentorship."
    },
    {
      title: "Business Development Manager",
      type: "Full-time",
      location: "Pan India",
      department: "Partnerships",
      description: "Build partnerships with schools and coaching centers across India."
    }
  ];

  const partnershipBenefits = {
    schools: [
      "Access to comprehensive mock test library",
      "Detailed performance analytics for students",
      "Teacher dashboard for monitoring progress",
      "Customizable test schedules",
      "Bulk licensing at special pricing",
      "Dedicated support team"
    ],
    coaching: [
      "White-label mock test platform",
      "Integration with existing systems",
      "Custom question banks",
      "Institute branding options",
      "Revenue sharing models",
      "Co-branded certificates"
    ],
    online: [
      "API integration for seamless experience",
      "Student performance data sync",
      "Joint marketing opportunities",
      "Shared success stories",
      "Collaborative content development",
      "Technical support and training"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" data-testid="badge-company-page">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="text-page-title">
            Empowering Dreams, Building Futures
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-hero-description">
            We're on a mission to democratize quality education and help every NEET & JEE aspirant achieve their dreams through innovative technology and world-class content.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="ghost" asChild data-testid="link-nav-about">
              <a href="#about"><Building2 className="h-4 w-4 mr-2" />About Us</a>
            </Button>
            <Button variant="ghost" asChild data-testid="link-nav-careers">
              <a href="#careers"><Users className="h-4 w-4 mr-2" />Careers</a>
            </Button>
            <Button variant="ghost" asChild data-testid="link-nav-leadership">
              <a href="#leadership"><Award className="h-4 w-4 mr-2" />Leadership</a>
            </Button>
            <Button variant="ghost" asChild data-testid="link-nav-press">
              <a href="#press"><Newspaper className="h-4 w-4 mr-2" />Press Releases</a>
            </Button>
            <Button variant="ghost" asChild data-testid="link-nav-partnerships">
              <a href="#partnerships"><Handshake className="h-4 w-4 mr-2" />Partnerships</a>
            </Button>
            <Button variant="ghost" asChild data-testid="link-nav-contact">
              <a href="#contact"><Mail className="h-4 w-4 mr-2" />Contact Us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" data-testid="text-section-about">About RyteFit</h2>
            
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-muted-foreground leading-relaxed mb-6">
                RyteFit was founded in 2023 with a singular vision: to provide every company with AI-powered interview solutions that streamline hiring and identify top talent efficiently.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We recognized that hiring is time-consuming and prone to bias. RyteFit bridges this gap by combining advanced AI technology with intelligent candidate evaluation, helping companies make better hiring decisions faster.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we serve over 100,000+ students across India, helping them prepare smarter with our AI-powered platform, comprehensive question bank of 50,000+ questions, and detailed performance analytics. Our students have secured top ranks in both NEET and JEE, validating our approach.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card data-testid="card-mission">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    To democratize quality competitive exam preparation by providing accessible, affordable, and effective learning solutions powered by technology and pedagogy excellence.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-vision">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    To become India's most trusted and comprehensive platform for NEET & JEE preparation, empowering 1 million+ students to achieve their medical and engineering dreams.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-6">Our Core Values</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {coreValues.map((value, index) => (
                  <div key={index} className="flex gap-4" data-testid={`value-${index}`}>
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{value.title}</h4>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Careers Section */}
      <section id="careers" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6" data-testid="text-section-careers">Join Our Team</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              We're always looking for passionate individuals who want to make a difference in education. Join us in transforming how students prepare for competitive exams.
            </p>

            <div className="space-y-6">
              {jobOpenings.map((job, index) => (
                <Card key={index} className="hover-elevate" data-testid={`job-card-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2" data-testid={`job-title-${index}`}>{job.title}</CardTitle>
                        <CardDescription>{job.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" data-testid={`job-type-${index}`}>{job.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span data-testid={`job-location-${index}`}>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span data-testid={`job-department-${index}`}>{job.department}</span>
                      </div>
                    </div>
                    <Button data-testid={`button-apply-${index}`}>
                      Apply Now <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Don't see a perfect match?</p>
              <Button variant="outline" data-testid="button-send-resume">
                Send Your Resume <Mail className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Leadership Section */}
      <section id="leadership" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6" data-testid="text-section-leadership">Leadership Team</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Our leadership team brings together expertise in recruitment, technology, and talent management to drive RyteFit's mission forward.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {leadership.map((leader, index) => (
                <Card key={index} className="text-center" data-testid={`leader-card-${index}`}>
                  <CardContent className="pt-6">
                    {leader.image ? (
                      <img 
                        src={leader.image} 
                        alt={leader.name}
                        className="h-32 w-32 rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-16 w-16 text-primary" />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-1" data-testid={`leader-name-${index}`}>{leader.name}</h3>
                    <p className="text-sm text-primary mb-3" data-testid={`leader-role-${index}`}>{leader.role}</p>
                    <p className="text-sm text-muted-foreground" data-testid={`leader-description-${index}`}>{leader.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Press Releases Section */}
      <section id="press" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6" data-testid="text-section-press">Press Releases</h2>
            <p className="text-center text-muted-foreground mb-12">
              Stay updated with the latest news and announcements from RyteFit
            </p>

            <Card className="text-center py-12">
              <CardContent>
                <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  We'll be sharing exciting news and updates here very soon. Stay tuned!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Partnerships Section */}
      <section id="partnerships" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6" data-testid="text-section-partnerships">Partnership Opportunities</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Partner with RyteFit to streamline your hiring process with AI-powered interviews
            </p>

            <Tabs defaultValue="schools" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="schools" data-testid="tab-schools">Schools</TabsTrigger>
                <TabsTrigger value="coaching" data-testid="tab-coaching">Coaching Centers</TabsTrigger>
                <TabsTrigger value="online" data-testid="tab-online">Online Coaching</TabsTrigger>
              </TabsList>

              <TabsContent value="schools">
                <Card>
                  <CardHeader>
                    <CardTitle>School Partnership Program</CardTitle>
                    <CardDescription>
                      Empower your students with comprehensive mock tests and performance analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {partnershipBenefits.schools.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2" data-testid={`school-benefit-${index}`}>
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <Button className="w-full md:w-auto" data-testid="button-partner-schools">
                      Become a School Partner <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coaching">
                <Card>
                  <CardHeader>
                    <CardTitle>Coaching Center Partnership</CardTitle>
                    <CardDescription>
                      White-label solutions and custom integrations for coaching institutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {partnershipBenefits.coaching.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2" data-testid={`coaching-benefit-${index}`}>
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <Button className="w-full md:w-auto" data-testid="button-partner-coaching">
                      Become a Coaching Partner <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="online">
                <Card>
                  <CardHeader>
                    <CardTitle>Online Coaching Partnership</CardTitle>
                    <CardDescription>
                      API integration and collaborative opportunities for online platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {partnershipBenefits.online.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2" data-testid={`online-benefit-${index}`}>
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <Button className="w-full md:w-auto" data-testid="button-partner-online">
                      Become an Online Partner <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Have a custom partnership idea?</p>
              <Button variant="outline" data-testid="button-custom-partnership">
                Let's Discuss <Mail className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact Us Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6" data-testid="text-section-contact">Contact Us</h2>
            <p className="text-center text-muted-foreground mb-12">
              Get in touch with us for any questions, partnerships, or support
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <Card data-testid="card-contact-info">
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>We're here to help you succeed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <p className="text-sm text-muted-foreground">General: support@rytefit.com</p>
                      <p className="text-sm text-muted-foreground">Partnerships: partnerships@rytefit.com</p>
                      <p className="text-sm text-muted-foreground">Careers: careers@rytefit.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Phone</h4>
                      <p className="text-sm text-muted-foreground">+91-7200189076</p>
                      <p className="text-sm text-muted-foreground">Mon-Sat: 9:00 AM - 6:00 PM IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Office</h4>
                      <p className="text-sm text-muted-foreground">
                        Scentric Networks Pvt. Ltd.<br />
                        Chennai, Tamil Nadu<br />
                        India
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-quick-links">
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>Explore more about RyteFit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-about-quick">
                    <Link href="/about">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      About Us
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-pricing-quick">
                    <Link href="/pricing">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Pricing Plans
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-blog-quick">
                    <Link href="/blog">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Blog & Resources
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-support-quick">
                    <Link href="/support">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Support Center
                    </Link>
                  </Button>
                  <Separator className="my-4" />
                  <Button className="w-full" asChild data-testid="button-start-free-trial">
                    <Link href="/auth/login">
                      Start Free Trial <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Clock,
  IndianRupee,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { PaginatedResponse, SelectJob } from "@shared/schema";
import Header from "@/components/Header";

export default function CareersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("");

  // Fetch all active public jobs
  const { data: jobs, isLoading } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: ['/api/jobs'],
  });

  // Filter jobs based on search and filters - only show active jobs
  const filteredJobs = jobs?.data.filter(job => {
    // Only show active jobs to public
    if (job.status !== 'active') return false;
    
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || locationFilter === 'all' || job.location === locationFilter;
    const matchesEmploymentType = !employmentTypeFilter || employmentTypeFilter === 'all' || job.employmentType === employmentTypeFilter;
    const matchesExperienceLevel = !experienceLevelFilter || experienceLevelFilter === 'all' || job.experienceLevel === experienceLevelFilter;
    
    return matchesSearch && matchesLocation && matchesEmploymentType && matchesExperienceLevel;
  }) || [];

  // Get unique values for filters
  const locations = Array.from(new Set(jobs?.data.map(j => j.location).filter(Boolean)));
  const employmentTypes = Array.from(new Set(jobs?.data.map(j => j.employmentType).filter(Boolean)));
  const experienceLevels = Array.from(new Set(jobs?.data.map(j => j.experienceLevel).filter(Boolean)));

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full_time': 'Full Time',
      'part_time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
    };
    return labels[type] || type;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'lead': 'Lead',
      'executive': 'Executive',
    };
    return labels[level] || level;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4" data-testid="text-careers-title">
              Find Your Dream Job
            </h1>
            <p className="text-lg text-muted-foreground mb-8" data-testid="text-careers-subtitle">
              Explore opportunities from top companies. Start your career journey today.
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by job title, department, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-job-search"
                />
              </div>
              <Button data-testid="button-search">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger data-testid="select-location-filter">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc as string}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Employment Type</Label>
                  <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                    <SelectTrigger data-testid="select-employment-type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {employmentTypes.map(type => (
                        <SelectItem key={type} value={type as string}>
                          {getEmploymentTypeLabel(type as string)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Experience Level</Label>
                  <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
                    <SelectTrigger data-testid="select-experience-filter">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {experienceLevels.map(level => (
                        <SelectItem key={level} value={level as string}>
                          {getExperienceLevelLabel(level as string)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(locationFilter && locationFilter !== 'all' || employmentTypeFilter && employmentTypeFilter !== 'all' || experienceLevelFilter && experienceLevelFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setLocationFilter("all");
                      setEmploymentTypeFilter("all");
                      setExperienceLevelFilter("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Job Listings */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading opportunities...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || locationFilter || employmentTypeFilter || experienceLevelFilter
                      ? "Try adjusting your search or filters"
                      : "Check back soon for new opportunities"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'} found
                  </p>
                </div>

                {filteredJobs.map((job: any) => (
                  <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl" data-testid={`text-job-title-${job.id}`}>
                              {job.title}
                            </CardTitle>
                            <Badge variant="secondary" data-testid={`badge-job-id-${job.id}`}>
                              {job.jobPostingId}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1 mb-3">
                            {job.companyName && (
                              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                                <Building2 className="h-4 w-4" />
                                <span data-testid={`text-company-${job.id}`}>{job.companyName}</span>
                              </div>
                            )}
                            {job.recruiterName && (
                              <div className="text-xs text-muted-foreground" data-testid={`text-recruiter-${job.id}`}>
                                Recruiter: {job.recruiterName}
                              </div>
                            )}
                            {job.department && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                                <span>{job.department}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {job.status === 'posted' && (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            Hiring
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.employmentType && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{getEmploymentTypeLabel(job.employmentType)}</span>
                          </div>
                        )}
                        {job.experienceLevel && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{getExperienceLevelLabel(job.experienceLevel)}</span>
                          </div>
                        )}
                        {job.salaryMin && job.salaryMax && (
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span>
                              {job.salaryMin.toLocaleString('en-IN')} - {job.salaryMax.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {job.description.substring(0, 200)}...
                        </p>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-1">
                          {job.extractedSkills?.slice(0, 3).map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.extractedSkills && job.extractedSkills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.extractedSkills.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <Link href={`/job/${job.slug || job.id}`}>
                          <Button variant="default" data-testid={`button-apply-${job.id}`}>
                            Apply Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

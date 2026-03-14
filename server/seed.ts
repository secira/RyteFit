import { db } from "./db";
import { 
  users, 
  companies, 
  jobs, 
  applications, 
  interviewSessions, 
  interviewEvaluations,
  screeningResults,
  candidateProfiles,
  resumes,
  interviewMessages
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// Helper function to generate Job Application ID in format JD(xxxxxxxxxxx)
function generateJobApplicationId(): string {
  const randomDigits = Math.floor(10000000000 + Math.random() * 90000000000); // 11 digits
  return `JD(${randomDigits})`;
}

async function seed() {
  console.log("Starting comprehensive database seed...");

  try {
    console.log("Cleaning up existing data...");
    
    // Delete in reverse order of dependencies
    await db.delete(interviewMessages);
    await db.delete(interviewEvaluations);
    await db.delete(screeningResults);
    await db.delete(resumes);
    await db.delete(interviewSessions);
    await db.delete(applications);
    await db.delete(candidateProfiles);
    await db.delete(jobs);
    await db.delete(users);
    await db.delete(companies);

    console.log("Creating company...");
    const company = await db.insert(companies).values({
      name: "TechCorp Solutions",
      domain: "techcorp.com",
      website: "https://techcorp.com",
      industry: "Technology",
      size: "51-200",
      description: "Leading AI-driven recruitment platform provider",
      subscriptionTier: "professional",
      subscriptionStatus: "active",
      monthlyInterviewLimit: 100,
      interviewsUsedThisMonth: 45,
    }).returning();

    console.log("✓ Created company:", company[0].name);

    const passwordHash = await bcrypt.hash("password123", 10);

    // Create company users
    console.log("Creating company users...");
    const adminUser = await db.insert(users).values({
      email: "admin@test.com",
      passwordHash,
      firstName: "Sarah",
      lastName: "Johnson",
      role: "company_admin",
      companyId: company[0].id,
      isEmailVerified: true,
    }).returning();

    const recruiterUser = await db.insert(users).values({
      email: "recruiter@test.com",
      passwordHash,
      firstName: "Michael",
      lastName: "Chen",
      role: "recruiter",
      companyId: company[0].id,
      isEmailVerified: true,
    }).returning();

    console.log("✓ Created admin and recruiter users");

    // Create 10 candidates
    console.log("Creating 10 candidates...");
    const candidatesData = [
      { firstName: "Ravi", lastName: "Shankar", email: "ravi@sctech.com", age: 28 },
      { firstName: "James", lastName: "Brown", email: "james.brown@email.com", age: 32 },
      { firstName: "Olivia", lastName: "Davis", email: "olivia.davis@email.com", age: 26 },
      { firstName: "Noah", lastName: "Miller", email: "noah.miller@email.com", age: 30 },
      { firstName: "Ava", lastName: "Wilson", email: "ava.wilson@email.com", age: 27 },
      { firstName: "Liam", lastName: "Moore", email: "liam.moore@email.com", age: 35 },
      { firstName: "Sophia", lastName: "Taylor", email: "sophia.taylor@email.com", age: 29 },
      { firstName: "Mason", lastName: "Anderson", email: "mason.anderson@email.com", age: 31 },
      { firstName: "Isabella", lastName: "Thomas", email: "isabella.thomas@email.com", age: 25 },
      { firstName: "Lucas", lastName: "Jackson", email: "lucas.jackson@email.com", age: 33 },
    ];

    const candidates = [];
    for (const candidate of candidatesData) {
      const user = await db.insert(users).values({
        email: candidate.email,
        passwordHash,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        role: "candidate",
        isEmailVerified: true,
      }).returning();
      
      // Create candidate profile with age metadata
      await db.insert(candidateProfiles).values({
        userId: user[0].id,
        currentTitle: ["Senior Software Engineer", "Product Manager", "Data Scientist", "Frontend Developer", "Backend Engineer"][Math.floor(Math.random() * 5)],
        currentCompany: ["Google", "Meta", "Amazon", "Microsoft", "Apple"][Math.floor(Math.random() * 5)],
        yearsOfExperience: candidate.age - 22,
        location: ["San Francisco", "New York", "Seattle", "Austin", "Remote"][Math.floor(Math.random() * 5)],
        skills: [
          { name: "JavaScript", level: "expert", yearsOfExperience: 5 },
          { name: "React", level: "advanced", yearsOfExperience: 4 },
          { name: "Python", level: "intermediate", yearsOfExperience: 3 },
        ],
      });
      
      candidates.push({ ...user[0], age: candidate.age });
    }

    console.log("✓ Created 10 candidates with profiles");

    // Create sample jobs with different experience levels
    console.log("Creating sample jobs...");
    const jobsData = [
      {
        title: "Senior Full Stack Developer",
        department: "Engineering",
        location: "Bangalore, India",
        type: "full-time",
        experienceLevel: "senior",
        description: "Looking for a Senior Full Stack Developer with 5+ years experience in React and Node.js to lead our engineering team.",
        requirements: ["5+ years experience", "React expertise", "Node.js proficiency", "Team leadership"],
        skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
        salaryMin: 1500000,
        salaryMax: 2500000,
      },
      {
        title: "Python Backend Developer",
        department: "Engineering",
        location: "Remote",
        type: "full-time",
        experienceLevel: "mid",
        description: "Mid-level Python developer to build scalable backend systems and APIs.",
        requirements: ["3+ years Python", "Django/Flask", "PostgreSQL", "REST APIs"],
        skills: ["Python", "Django", "PostgreSQL", "Docker", "Redis"],
        salaryMin: 1000000,
        salaryMax: 1800000,
      },
      {
        title: "Frontend Developer",
        department: "Engineering",
        location: "Mumbai, India",
        type: "full-time",
        experienceLevel: "junior",
        description: "Junior Frontend Developer to work on modern web applications.",
        requirements: ["1-2 years experience", "React basics", "JavaScript", "CSS"],
        skills: ["HTML", "CSS", "JavaScript", "React", "Git"],
        salaryMin: 600000,
        salaryMax: 1000000,
      },
      {
        title: "Data Scientist",
        department: "Analytics",
        location: "Hyderabad, India",
        type: "full-time",
        experienceLevel: "mid",
        description: "Data Scientist to develop machine learning models and analyze business data.",
        requirements: ["3+ years experience", "Python", "Machine Learning", "Statistics"],
        skills: ["Python", "TensorFlow", "Pandas", "SQL", "Tableau"],
        salaryMin: 1200000,
        salaryMax: 2000000,
      },
      {
        title: "DevOps Engineer",
        department: "Engineering",
        location: "Pune, India",
        type: "full-time",
        experienceLevel: "mid",
        description: "DevOps Engineer to manage cloud infrastructure and CI/CD pipelines.",
        requirements: ["3+ years DevOps", "AWS/Azure", "Kubernetes", "Docker"],
        skills: ["AWS", "Kubernetes", "Docker", "Jenkins", "Terraform"],
        salaryMin: 1100000,
        salaryMax: 1900000,
      },
      {
        title: "Product Manager",
        department: "Product",
        location: "Bangalore, India",
        type: "full-time",
        experienceLevel: "senior",
        description: "Senior Product Manager to lead product strategy and roadmap.",
        requirements: ["5+ years product management", "Agile", "Stakeholder management"],
        skills: ["Product Strategy", "Agile", "JIRA", "Data Analysis", "User Research"],
        salaryMin: 2000000,
        salaryMax: 3000000,
      },
      {
        title: "UI/UX Designer",
        department: "Design",
        location: "Remote",
        type: "full-time",
        experienceLevel: "mid",
        description: "UI/UX Designer to create intuitive and beautiful user experiences.",
        requirements: ["3+ years design experience", "Figma", "User Research"],
        skills: ["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems"],
        salaryMin: 900000,
        salaryMax: 1600000,
      },
      {
        title: "Mobile Developer (React Native)",
        department: "Engineering",
        location: "Delhi, India",
        type: "full-time",
        experienceLevel: "mid",
        description: "Mobile Developer to build cross-platform mobile applications.",
        requirements: ["3+ years mobile development", "React Native", "iOS/Android"],
        skills: ["React Native", "JavaScript", "iOS", "Android", "Redux"],
        salaryMin: 1100000,
        salaryMax: 1800000,
      },
      {
        title: "QA Engineer",
        department: "Engineering",
        location: "Chennai, India",
        type: "full-time",
        experienceLevel: "junior",
        description: "QA Engineer to ensure software quality through testing and automation.",
        requirements: ["1-2 years QA experience", "Test automation", "Selenium"],
        skills: ["Selenium", "Jest", "Cypress", "API Testing", "Manual Testing"],
        salaryMin: 500000,
        salaryMax: 900000,
      },
      {
        title: "Marketing Manager",
        department: "Marketing",
        location: "Mumbai, India",
        type: "full-time",
        experienceLevel: "senior",
        description: "Marketing Manager to lead digital marketing campaigns and brand strategy.",
        requirements: ["5+ years marketing", "Digital marketing", "SEO/SEM", "Analytics"],
        skills: ["Digital Marketing", "SEO", "Google Analytics", "Content Strategy", "Social Media"],
        salaryMin: 1500000,
        salaryMax: 2200000,
      },
    ];

    const createdJobs = [];
    for (const jobData of jobsData) {
      const job = await db.insert(jobs).values({
        companyId: company[0].id,
        createdBy: recruiterUser[0].id,
        title: jobData.title,
        department: jobData.department,
        location: jobData.location,
        employmentType: jobData.type,
        experienceLevel: jobData.experienceLevel,
        description: jobData.description,
        requirements: jobData.requirements.join(', '),
        responsibilities: "Build scalable applications. Collaborate with team. Code reviews.",
        extractedSkills: jobData.skills,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        salaryCurrency: "INR",
        status: "active",
      }).returning();
      createdJobs.push(job[0]);
    }
    console.log(`✓ Created ${createdJobs.length} jobs`);

    console.log("\n✅ Comprehensive seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - 1 Company: ${company[0].name}`);
    console.log(`   - 2 Company Users (Admin + Recruiter)`);
    console.log(`   - 10 Candidates with profiles`);
    console.log(`   - ${createdJobs.length} Jobs (different experience levels)`);
    
    console.log("\n🔑 Test Accounts:");
    console.log("1. Company Admin:");
    console.log("   Email: admin@test.com");
    console.log("   Password: password123");
    console.log("\n2. Recruiter:");
    console.log("   Email: recruiter@test.com");
    console.log("   Password: password123");
    console.log("\n3. Sample Candidate:");
    console.log("   Email: ravi@sctech.com");
    console.log("   Password: password123");

  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();

import { db } from "./db";
import { users, companies } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const DEFAULT_ADMIN_EMAIL = "admin@rytefit.com";
const DEFAULT_ADMIN_PASSWORD = "rf2020@@";

/**
 * Ensures the default RyteFit admin account always exists.
 * Runs on every server startup. Safe to call multiple times.
 * - Creates the account if it doesn't exist.
 * - Resets the password if the account exists but credentials changed.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // Ensure the RyteFit platform company exists
    let [rytefitCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.domain, "rytefit.com"));

    if (!rytefitCompany) {
      const inserted = await db
        .insert(companies)
        .values({
          name: "RyteFit Platform",
          domain: "rytefit.com",
          website: "https://rytefit.com",
          industry: "Technology",
          size: "1-10",
          description: "RyteFit platform administration company",
          subscriptionTier: "enterprise",
          subscriptionStatus: "active",
          monthlyInterviewLimit: 9999,
          interviewsUsedThisMonth: 0,
        })
        .returning();
      rytefitCompany = inserted[0];
      console.log("[DefaultAdmin] Created RyteFit platform company");
    }

    // Check if default admin user exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEFAULT_ADMIN_EMAIL));

    if (!existingAdmin) {
      await db.insert(users).values({
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        firstName: "RyteFit",
        lastName: "Admin",
        role: "company_admin",
        companyId: rytefitCompany.id,
        isEmailVerified: true,
      });
      console.log(`[DefaultAdmin] Created default admin: ${DEFAULT_ADMIN_EMAIL}`);
    } else {
      // Ensure password is always correct (reset if needed)
      await db
        .update(users)
        .set({
          passwordHash,
          role: "company_admin",
          companyId: rytefitCompany.id,
          isEmailVerified: true,
        })
        .where(eq(users.email, DEFAULT_ADMIN_EMAIL));
      console.log(`[DefaultAdmin] Verified default admin: ${DEFAULT_ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error("[DefaultAdmin] Failed to ensure default admin:", error);
  }
}

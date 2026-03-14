import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { SelectUser } from "@shared/schema";

const SALT_ROUNDS = 10;

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateOTP(): Promise<string> {
  const crypto = await import('crypto');
  return crypto.randomInt(100000, 999999).toString();
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: "Please use mobile login" });
          }

          const isValidPassword = await comparePassword(password, user.passwordHash);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          await storage.updateLastLogin(user.id);
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};

export const isB2BUser: RequestHandler = (req, res, next) => {
  const user = req.user as SelectUser;
  if (!user || !user.role) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (user.role === 'candidate') {
    return res.status(403).json({ error: "This system is for Company Admins and Recruiters only. Candidate access is disabled." });
  }
  next();
};

export const isRecruiter: RequestHandler = (req, res, next) => {
  const user = req.user as SelectUser;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (user.role === "recruiter" || user.role === "company_admin") {
    return next();
  }
  res.status(403).json({ error: "Forbidden: Recruiter access required" });
};

export const isCompanyAdmin: RequestHandler = (req, res, next) => {
  const user = req.user as SelectUser;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (user.role === "company_admin") {
    return next();
  }
  res.status(403).json({ error: "Forbidden: Company admin access required" });
};

import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as LocalStrategy } from "passport-local";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Register local password strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user || !user.passwordHash) {
            // Generic error - prevents account enumeration
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          
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

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => {
    const userData = user as any;
    // For local auth, serialize the user ID
    if (userData.id && !userData.claims) {
      return cb(null, { id: userData.id, authType: 'local' });
    }
    // For OIDC, serialize the full user object
    cb(null, user);
  });
  
  passport.deserializeUser(async (user: Express.User, cb) => {
    try {
      const userSession = user as any;
      
      // Handle local authentication sessions
      if (userSession?.authType === 'local' && userSession?.id) {
        const userData = await storage.getUserById(userSession.id);
        if (!userData) {
          return cb(null, false);
        }
        return cb(null, userData);
      }
      
      // Handle Replit OIDC sessions
      if (userSession?.claims?.sub) {
        // Load full user data from database and enrich session
        const userData = await storage.getUser(userSession.claims.sub);
        if (userData) {
          // Enrich session with canonical user fields for route handlers
          userSession.id = userData.id;
          userSession.role = userData.role;
          userSession.companyId = userData.companyId;
          userSession.email = userData.email;
          userSession.firstName = userData.firstName;
          userSession.lastName = userData.lastName;
          userSession.profileImageUrl = userData.profileImageUrl;
          // Keep claims for token refresh
          userSession.claims.role = userData.role;
          userSession.claims.companyId = userData.companyId;
        }
      }
      cb(null, user);
    } catch (error) {
      cb(null, user);
    }
  });

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      // Clear session cookies explicitly for complete logout
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('express.sid', { path: '/' });
      
      // Set headers to prevent caching of auth state
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Return success - client will handle redirect/reload
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Require active session
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For local password auth, just check session is active
  if (user && !user.expires_at) {
    return next();
  }

  // For OIDC auth, check token expiration and refresh if needed
  if (user?.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    // Token expired - attempt refresh
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  // Fallback - session exists but can't determine auth type
  return res.status(401).json({ message: "Unauthorized" });
};

// Recruiter authentication middleware
export const isRecruiter: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  try {
    // Check if user is authenticated first
    if (!user?.role) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user has recruiter or company_admin role (enriched during deserialization)
    if (user.role !== 'recruiter' && user.role !== 'company_admin') {
      return res.status(403).json({ message: "Recruiter access required" });
    }

    next();
  } catch (error) {
    console.error("Error checking recruiter status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Company Admin authentication middleware
export const isCompanyAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  try {
    // Check if user is authenticated first
    if (!user?.role) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user has company_admin role (enriched during deserialization)
    if (user.role !== 'company_admin') {
      return res.status(403).json({ message: "Company admin access required" });
    }

    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
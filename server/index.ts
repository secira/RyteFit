import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import pino from "pino";
import pinoHttp from "pino-http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupWebSocketServer } from "./websocket";

const app = express();

// Trust proxy for Replit environment (required for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware with environment-specific CSP
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(helmet({
  contentSecurityPolicy: isDevelopment ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://cdn.jsdelivr.net", "https://replit.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://replit.com"],
      frameAncestors: ["'self'", "https://replit.com"],
      baseUri: ["'self'"],
      formAction: ["'self'", "https://replit.com"],
    },
  } : false, // Completely disable CSP in production
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { message: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/all-india-exams/answer') || req.path.startsWith('/api/all-india-exams/autosave')
});

// API specific rate limiting (excludes exam endpoints which have per-user limits)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: { message: "API rate limit exceeded, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for exam endpoints that have their own per-user limits
    return req.path.startsWith('/api/all-india-exams/answer') || 
           req.path.startsWith('/api/all-india-exams/autosave');
  }
});

app.use(limiter);
app.use('/api', apiLimiter);
// Note: exam-specific rate limiting is now handled in routes.ts after auth setup

// Slow down repeated requests (excludes exam endpoints to prevent exam delays)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  validate: { delayMs: false }, // Disable warning about delayMs format
  skip: (req) => {
    // Skip slowdown for exam endpoints to prevent delays during exams
    return req.path.startsWith('/api/all-india-exams/answer') || 
           req.path.startsWith('/api/all-india-exams/autosave');
  }
});
app.use(speedLimiter);

// Structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', 'req.body.password', 'req.body.razorpaySignature'],
    remove: true
  }
});

app.use(pinoHttp({ logger, autoLogging: false }));

// Standard body parser limits (interview video uploads handled separately in routes)
// Skip global body parser for interview submit endpoint - it has a dedicated high-limit parser
app.use((req, res, next) => {
  if (req.path.includes('/api/public/interview/') && req.path.endsWith('/submit')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.includes('/api/public/interview/') && req.path.endsWith('/submit')) {
    return next();
  }
  express.urlencoded({ extended: false, limit: '50mb' })(req, res, next);
});

// Secure request logging middleware
app.use((req: any, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Log only essential info, no response bodies to prevent PII leakage
      req.log.info({
        method: req.method,
        path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.claims?.sub || 'anonymous'
      }, 'API request completed');
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup WebSocket server for AI video interviews
  setupWebSocketServer(server);

  app.use((err: any, req: any, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status === 500 ? "Internal Server Error" : err.message;
    const errorId = Math.random().toString(36).substring(7);

    // Log error securely without exposing sensitive details
    req.log.error({
      errorId,
      status,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.claims?.sub || 'anonymous'
    }, 'Request error occurred');

    // Send sanitized error response
    if (!res.headersSent) {
      res.status(status).json({ 
        message,
        errorId: status === 500 ? errorId : undefined
      });
    }
    
    // Do NOT throw the error - this would crash the process
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import crypto from 'crypto';

/**
 * Generates a unique interview link for a candidate application
 * Format: /interview/{unique-token}
 * The token encodes the application ID for security
 */
export function generateInterviewLink(applicationId: string): string {
  // Create a unique token using application ID and random bytes
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now().toString(36);
  
  // Combine application ID hash with random data for uniqueness
  const hash = crypto
    .createHash('sha256')
    .update(`${applicationId}-${randomBytes}-${timestamp}`)
    .digest('hex')
    .substring(0, 16);
  
  return `${hash}${timestamp}`;
}

/**
 * Validates if an interview link format is correct
 */
export function isValidInterviewLink(link: string): boolean {
  // Interview link should be alphanumeric and between 16-32 characters
  return /^[a-f0-9]{16,32}$/i.test(link);
}

/**
 * Generates the full interview URL path
 */
export function getInterviewUrl(interviewLink: string): string {
  return `/interview/${interviewLink}`;
}

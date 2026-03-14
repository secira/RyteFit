/**
 * Utility to generate job posting IDs with company code
 * Format: {COMPANY_CODE}{YYYYMMDD}{3-DIGIT-SEQUENCE}
 * Example: SCTE20241120001
 */

/**
 * Generate a job posting ID for a company
 * @param companyCode - 4-letter company code
 * @param sequence - Sequential number for the day (optional, defaults to timestamp-based)
 * @returns Job posting ID in format SCTE20241120001
 */
export function generateJobPostingId(companyCode: string, sequence?: number): string {
  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Use provided sequence or generate from timestamp
  let seqStr: string;
  if (sequence !== undefined) {
    seqStr = String(sequence).padStart(3, '0');
  } else {
    // Use last 3 digits of timestamp for uniqueness
    const timestamp = Date.now();
    seqStr = String(timestamp % 1000).padStart(3, '0');
  }
  
  // Format: SCTE20241120001
  return `${companyCode}${dateStr}${seqStr}`;
}

/**
 * Validate job posting ID format
 * @param jobPostingId - Job posting ID to validate
 * @returns True if valid format
 */
export function isValidJobPostingId(jobPostingId: string): boolean {
  // Format: XXXX(4 letters)YYYYMMDD(8 digits)NNN(3 digits) = 15 chars total
  const pattern = /^[A-Z]{4}\d{8}\d{3}$/;
  return pattern.test(jobPostingId);
}

/**
 * Extract company code from job posting ID
 * @param jobPostingId - Job posting ID
 * @returns Company code or null if invalid
 */
export function extractCompanyCodeFromJobId(jobPostingId: string): string | null {
  if (!isValidJobPostingId(jobPostingId)) {
    return null;
  }
  // First 4 characters are the company code
  return jobPostingId.substring(0, 4);
}

/**
 * Extract date from job posting ID
 * @param jobPostingId - Job posting ID
 * @returns Date object or null if invalid
 */
export function extractJobPostingDate(jobPostingId: string): Date | null {
  if (!isValidJobPostingId(jobPostingId)) {
    return null;
  }
  // Characters 4-11 are the date (YYYYMMDD)
  const dateStr = jobPostingId.substring(4, 12);
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  
  return new Date(year, month, day);
}

/**
 * Extract sequence number from job posting ID
 * @param jobPostingId - Job posting ID
 * @returns Sequence number or null if invalid
 */
export function extractSequenceNumber(jobPostingId: string): number | null {
  if (!isValidJobPostingId(jobPostingId)) {
    return null;
  }
  // Last 3 characters are the sequence number
  return parseInt(jobPostingId.substring(12, 15));
}

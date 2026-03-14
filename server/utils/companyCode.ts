/**
 * Generate a 4-letter company code from company name
 * Examples:
 * - "ScTech Solutions" -> "SCTE"
 * - "Google" -> "GOOG"
 * - "Microsoft Corporation" -> "MSFT"
 */
export function generateCompanyCode(companyName: string): string {
  // Remove special characters and split into words
  const cleanedName = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim();
  
  const words = cleanedName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    // Fallback: generate random 4-letter code
    return generateRandomCode();
  }
  
  if (words.length === 1) {
    // Single word: take first 4 letters
    const word = words[0];
    if (word.length >= 4) {
      return word.substring(0, 4);
    } else {
      // Pad with X if less than 4 characters
      return word.padEnd(4, 'X');
    }
  }
  
  if (words.length === 2) {
    // Two words: take first 2 letters from each
    return words[0].substring(0, 2) + words[1].substring(0, 2);
  }
  
  // Three or more words: take first letter from first 4 words
  return words.slice(0, 4).map(word => word[0]).join('');
}

/**
 * Generate a random 4-letter code
 */
function generateRandomCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

/**
 * Ensure company code is unique by appending numbers if needed
 */
export function ensureUniqueCode(baseCode: string, existingCodes: string[]): string {
  let code = baseCode;
  let counter = 1;
  
  while (existingCodes.includes(code)) {
    // Append number to make it unique
    // e.g., SCTE -> SCT1, SCT2, etc.
    code = baseCode.substring(0, 3) + counter.toString();
    counter++;
    
    if (counter > 9) {
      // If we've exhausted single digits, start with random codes
      code = generateRandomCode();
      counter = 1;
    }
  }
  
  return code;
}

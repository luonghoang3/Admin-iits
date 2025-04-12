/**
 * Utility functions for standardizing company names
 */

/**
 * Standardizes a company name by:
 * - Normalizing spacing (removing extra spaces)
 * - Standardizing common company suffixes (S.A.S, S.A, JSC, etc.)
 * - Removing trailing periods
 * - Preserving country information in a consistent format
 * 
 * @param name The company name to standardize
 * @returns The standardized company name
 */
export function standardizeCompanyName(name: string): string {
  if (!name) return '';
  
  // Trim and normalize spaces
  let standardized = name.trim().replace(/\s+/g, ' ');
  
  // Extract country information if present in parentheses at the end
  const countryMatch = standardized.match(/\s*\(([^)]+)\)\s*$/);
  const country = countryMatch ? countryMatch[1].trim() : null;
  
  // Remove country information for now (will add back later if present)
  if (country) {
    standardized = standardized.replace(/\s*\([^)]+\)\s*$/, '');
  }
  
  // Standardize common company suffixes
  standardized = standardized
    // Standardize S.A.S format
    .replace(/S\.?A\.?S\.?$/i, 'S.A.S')
    // Standardize S.A format
    .replace(/S\.?A\.?$/i, 'S.A')
    // Standardize JSC format
    .replace(/J\.?S\.?C\.?$/i, 'JSC')
    // Standardize LTD format
    .replace(/L\.?T\.?D\.?$/i, 'LTD')
    // Standardize LLC format
    .replace(/L\.?L\.?C\.?$/i, 'LLC')
    // Standardize CORP format
    .replace(/CORP\.?$/i, 'CORP')
    // Standardize INC format
    .replace(/INC\.?$/i, 'INC')
    // Standardize CO format
    .replace(/CO\.?$/i, 'CO')
    // Standardize PTE.LTD format
    .replace(/P\.?T\.?E\.?\s*\.?\s*L\.?T\.?D\.?$/i, 'PTE.LTD')
    // Standardize GMBH format
    .replace(/G\.?M\.?B\.?H\.?$/i, 'GMBH')
    // Remove trailing periods
    .replace(/\.$/, '');
  
  // Add back country information if it was present
  if (country) {
    standardized = `${standardized} (${country})`;
  }
  
  return standardized;
}

/**
 * Checks if two company names are likely to be the same entity
 * after normalization
 * 
 * @param name1 First company name
 * @param name2 Second company name
 * @returns True if the names are likely the same company
 */
export function isSameCompany(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  
  // Normalize both names for comparison
  const normalized1 = normalizeForComparison(name1);
  const normalized2 = normalizeForComparison(name2);
  
  return normalized1 === normalized2;
}

/**
 * Normalizes a company name for comparison purposes by:
 * - Converting to uppercase
 * - Removing all spaces and punctuation
 * - Removing common company suffixes
 * - Removing country information
 * 
 * @param name The company name to normalize
 * @returns Normalized name for comparison
 */
function normalizeForComparison(name: string): string {
  if (!name) return '';
  
  return name
    .toUpperCase()
    // Remove country information in parentheses
    .replace(/\s*\([^)]+\)\s*$/g, '')
    // Remove common company suffixes
    .replace(/S\.?A\.?S\.?$/g, '')
    .replace(/S\.?A\.?$/g, '')
    .replace(/J\.?S\.?C\.?$/g, '')
    .replace(/L\.?T\.?D\.?$/g, '')
    .replace(/L\.?L\.?C\.?$/g, '')
    .replace(/CORP\.?$/g, '')
    .replace(/INC\.?$/g, '')
    .replace(/CO\.?$/g, '')
    .replace(/P\.?T\.?E\.?\s*\.?\s*L\.?T\.?D\.?$/g, '')
    .replace(/G\.?M\.?B\.?H\.?$/g, '')
    // Remove all spaces and punctuation
    .replace(/[\s.,'"()\-_]/g, '');
}

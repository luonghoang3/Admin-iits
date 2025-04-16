/**
 * Utility functions to normalize and map order fields (clients, teams, ...)
 */

export interface IdName {
  id: string;
  name: string;
}

/**
 * Normalize a field (clients, teams, ...) to always return {id, name} or undefined
 * Handles cases where input is null, undefined, object, or array.
 */
export function normalizeIdNameField(input: any): IdName | undefined {
  if (!input) return undefined;
  // If array, take the first element
  if (Array.isArray(input)) {
    const t = input[0];
    if (
      t &&
      typeof t === 'object' &&
      t !== null &&
      t.id !== undefined &&
      t.name !== undefined
    ) {
      return {
        id: String(t.id),
        name: String(t.name)
      };
    }
    return undefined;
  }
  // If object
  if (
    typeof input === 'object' &&
    input !== null &&
    input.id !== undefined &&
    input.name !== undefined
  ) {
    return {
      id: String(input.id),
      name: String(input.name)
    };
  }
  return undefined;
}

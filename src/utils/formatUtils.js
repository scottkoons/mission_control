/**
 * Format a phone number as (xxx) xxx-xxxx
 * @param {string} value - The raw phone input
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 10 digits
  const trimmed = digits.slice(0, 10);

  // Format based on length
  if (trimmed.length === 0) {
    return '';
  } else if (trimmed.length <= 3) {
    return `(${trimmed}`;
  } else if (trimmed.length <= 6) {
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
  } else {
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  }
};

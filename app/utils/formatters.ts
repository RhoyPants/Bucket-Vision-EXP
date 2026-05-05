/**
 * Utility functions for formatting currency and budget values
 */

/**
 * Format a number as currency with thousand separators
 * Example: 20000000 → "20,000,000"
 * 
 * @param value - The numeric value to format
 * @param includeSymbol - Whether to include the ₱ symbol (default: false)
 * @returns Formatted currency string
 */
export const formatBudget = (value?: number | string, includeSymbol = false): string => {
  if (value === undefined || value === null) return "0";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0";
  
  const formatted = numValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return includeSymbol ? `₱${formatted}` : formatted;
};

/**
 * Format a number with K suffix for thousands
 * Example: 1500000 → "1.5M", 1500 → "1.5K"
 * 
 * @param value - The numeric value to format
 * @returns Formatted string with K/M suffix
 */
export const formatBudgetShort = (value?: number | string): string => {
  if (value === undefined || value === null) return "0";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0";
  
  if (numValue >= 1000000) {
    return (numValue / 1000000).toFixed(1) + "M";
  } else if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + "K";
  }
  
  return numValue.toString();
};

/**
 * Format a percentage value
 * Example: 45.678 → "45.68%"
 * 
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (value?: number | string, decimals = 2): string => {
  if (value === undefined || value === null) return "0%";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0%";
  
  return numValue.toFixed(decimals) + "%";
};

/**
 * Format currency with full symbol and thousand separators
 * Example: 20000000 → "₱ 20,000,000"
 * 
 * @param value - The numeric value to format
 * @returns Formatted currency string with symbol
 */
export const formatCurrency = (value?: number | string): string => {
  return formatBudget(value, true);
};

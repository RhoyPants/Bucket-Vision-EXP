// Task Validation Schema & Utilities

export interface TaskFormData {
  title: string;
  description?: string;
  scopeId: string;
  budgetAllocated: number;
  budgetPercent?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a complete task form
 * @param form - The task form data to validate
 * @param scopeBudget - The Scope budget (for percent validation)
 * @returns ValidationResult with errors array if any
 */
export const validateTaskForm = (
  form: Partial<TaskFormData>,
  scopeBudget: number = 0
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Ã¢Å“â€¦ Title validation
  if (!form.title || form.title.trim() === "") {
    errors.push({
      field: "title",
      message: "Task title is required",
    });
  } else if (form.title.trim().length < 2) {
    errors.push({
      field: "title",
      message: "Task title must be at least 2 characters",
    });
  } else if (form.title.length > 150) {
    errors.push({
      field: "title",
      message: "Task title must not exceed 150 characters",
    });
  }

  // Ã¢Å“â€¦ Budget Allocated validation
  if (form.budgetAllocated === undefined || form.budgetAllocated === null) {
    errors.push({
      field: "budgetAllocated",
      message: "Budget allocation is required",
    });
  } else if (form.budgetAllocated < 0) {
    errors.push({
      field: "budgetAllocated",
      message: "Budget cannot be negative",
    });
  } else if (form.budgetAllocated > 999999999) {
    errors.push({
      field: "budgetAllocated",
      message: "Budget exceeds maximum allowed value",
    });
  }

  // Ã¢Å“â€¦ Budget validation against Scope budget
  if (form.budgetAllocated !== undefined && form.budgetAllocated !== null && scopeBudget > 0 && form.budgetAllocated > scopeBudget) {
    errors.push({
      field: "budgetAllocated",
      message: `Budget allocation (${form.budgetAllocated}) exceeds Scope budget (${scopeBudget})`,
    });
  }

  // Ã¢Å“â€¦ Description validation (optional but has limits)
  if (form.description && form.description.length > 500) {
    errors.push({
      field: "description",
      message: "Description must not exceed 500 characters",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates a single field
 * @param fieldName - The name of the field to validate
 * @param value - The value of the field
 * @param form - The complete form data (for context-aware validation)
 * @param scopeBudget - The Scope budget
 * @returns ValidationError or null if valid
 */
export const validateField = (
  fieldName: string,
  value: any,
  form?: Partial<TaskFormData>,
  scopeBudget?: number
): ValidationError | null => {
  const fullForm = { ...form, [fieldName]: value };
  const result = validateTaskForm(fullForm, scopeBudget);
  return result.errors.find((err) => err.field === fieldName) || null;
};

/**
 * Get error for a specific field
 * @param field - Field name
 * @param errors - Array of validation errors
 * @returns Error message or empty string if no error
 */
export const getFieldError = (field: string, errors: ValidationError[]): string => {
  return errors.find((err) => err.field === field)?.message || "";
};

/**
 * Check if field has error
 * @param field - Field name
 * @param errors - Array of validation errors
 * @returns Boolean indicating if field has error
 */
export const hasFieldError = (field: string, errors: ValidationError[]): boolean => {
  return errors.some((err) => err.field === field);
};

/**
 * Calculate budget percentage
 * @param budgetAllocated - Amount allocated to task
 * @param scopeBudget - Scope budget
 * @returns Calculated percentage
 */
export const calculateBudgetPercent = (
  budgetAllocated: number,
  scopeBudget: number
): number => {
  if (scopeBudget <= 0) return 0;
  return (budgetAllocated / scopeBudget) * 100;
};

/**
 * Get remaining budget for Scope
 * @param scopeBudget - Scope budget
 * @param allocatedTasks - Array of tasks with their budgets
 * @returns Remaining budget amount
 */
export const getRemainingBudget = (
  scopeBudget: number,
  allocatedTasks: Array<{ budgetAllocated: number }>
): number => {
  const totalAllocated = allocatedTasks.reduce(
    (sum, task) => sum + (task.budgetAllocated || 0),
    0
  );
  return Math.max(0, scopeBudget - totalAllocated);
};

/**
 * Get remaining budget percentage
 * @param scopeBudget - Scope budget
 * @param allocatedTasks - Array of tasks with their budgets
 * @returns Remaining budget percentage
 */
export const getRemainingBudgetPercent = (
  scopeBudget: number,
  allocatedTasks: Array<{ budgetAllocated: number }>
): number => {
  const remaining = getRemainingBudget(scopeBudget, allocatedTasks);
  return scopeBudget > 0 ? (remaining / scopeBudget) * 100 : 0;
};

/**
 * Convert ISO date string or Date object to yyyy-MM-dd format
 * Handles ISO format (2026-04-24T00:00:00.000Z) and Date objects
 * @param date - Date string or Date object
 * @returns yyyy-MM-dd formatted string, or empty string if invalid
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return "";

    // Get date components with proper timezone handling
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

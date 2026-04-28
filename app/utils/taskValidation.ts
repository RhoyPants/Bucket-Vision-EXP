// Task Validation Schema & Utilities

export interface TaskFormData {
  title: string;
  description?: string;
  categoryId: string;
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
 * @param categoryBudget - The category budget (for percent validation)
 * @returns ValidationResult with errors array if any
 */
export const validateTaskForm = (
  form: Partial<TaskFormData>,
  categoryBudget: number = 0
): ValidationResult => {
  const errors: ValidationError[] = [];

  // ✅ Title validation
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

  // ✅ Budget Allocated validation
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

  // ✅ Budget validation against category budget
  if (form.budgetAllocated !== undefined && form.budgetAllocated !== null && categoryBudget > 0 && form.budgetAllocated > categoryBudget) {
    errors.push({
      field: "budgetAllocated",
      message: `Budget allocation (₱${form.budgetAllocated}) exceeds category budget (₱${categoryBudget})`,
    });
  }

  // ✅ Description validation (optional but has limits)
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
 * @param categoryBudget - The category budget
 * @returns ValidationError or null if valid
 */
export const validateField = (
  fieldName: string,
  value: any,
  form?: Partial<TaskFormData>,
  categoryBudget?: number
): ValidationError | null => {
  const fullForm = { ...form, [fieldName]: value };
  const result = validateTaskForm(fullForm, categoryBudget);
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
 * @param categoryBudget - Category budget
 * @returns Calculated percentage
 */
export const calculateBudgetPercent = (
  budgetAllocated: number,
  categoryBudget: number
): number => {
  if (categoryBudget <= 0) return 0;
  return (budgetAllocated / categoryBudget) * 100;
};

/**
 * Get remaining budget for category
 * @param categoryBudget - Category budget
 * @param allocatedTasks - Array of tasks with their budgets
 * @returns Remaining budget amount
 */
export const getRemainingBudget = (
  categoryBudget: number,
  allocatedTasks: Array<{ budgetAllocated: number }>
): number => {
  const totalAllocated = allocatedTasks.reduce(
    (sum, task) => sum + (task.budgetAllocated || 0),
    0
  );
  return Math.max(0, categoryBudget - totalAllocated);
};

/**
 * Get remaining budget percentage
 * @param categoryBudget - Category budget
 * @param allocatedTasks - Array of tasks with their budgets
 * @returns Remaining budget percentage
 */
export const getRemainingBudgetPercent = (
  categoryBudget: number,
  allocatedTasks: Array<{ budgetAllocated: number }>
): number => {
  const remaining = getRemainingBudget(categoryBudget, allocatedTasks);
  return categoryBudget > 0 ? (remaining / categoryBudget) * 100 : 0;
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

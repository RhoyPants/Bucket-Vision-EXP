// Subtask Validation Schema & Utilities

export interface SubtaskFormData {
  title: string;
  description?: string;
  priority: string;
  projectedStartDate: string;
  projectedEndDate: string;
  budgetAllocated: number;
  budgetPercent?: number;
  remarks?: string;
  userIds: string[];
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
 * Validates a complete subtask form
 * @param form - The subtask form data to validate
 * @param taskBudget - The parent task budget (for percent validation)
 * @returns ValidationResult with errors array if any
 */
export const validateSubtaskForm = (
  form: Partial<SubtaskFormData>,
  taskBudget: number = 0
): ValidationResult => {
  const errors: ValidationError[] = [];

  // ✅ Title validation
  if (!form.title || form.title.trim() === "") {
    errors.push({
      field: "title",
      message: "Subtask title is required",
    });
  } else if (form.title.trim().length < 2) {
    errors.push({
      field: "title",
      message: "Subtask title must be at least 2 characters",
    });
  } else if (form.title.length > 150) {
    errors.push({
      field: "title",
      message: "Subtask title must not exceed 150 characters",
    });
  }

  // ✅ Priority validation
  if (!form.priority || form.priority.trim() === "") {
    errors.push({
      field: "priority",
      message: "Priority is required",
    });
  } else if (!["HIGH", "MEDIUM", "LOW"].includes(form.priority.toUpperCase())) {
    errors.push({
      field: "priority",
      message: "Priority must be HIGH, MEDIUM, or LOW",
    });
  }

  // ✅ Projected Start Date validation
  if (!form.projectedStartDate) {
    errors.push({
      field: "projectedStartDate",
      message: "Start date is required",
    });
  }

  // ✅ Projected End Date validation
  if (!form.projectedEndDate) {
    errors.push({
      field: "projectedEndDate",
      message: "End date is required",
    });
  }

  // ✅ Date range validation
  if (form.projectedStartDate && form.projectedEndDate) {
    const startDate = new Date(form.projectedStartDate);
    const endDate = new Date(form.projectedEndDate);

    if (startDate > endDate) {
      errors.push({
        field: "projectedEndDate",
        message: "End date must be after start date",
      });
    }
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

  // ✅ Budget validation against task budget
  if (form.budgetAllocated !== undefined && form.budgetAllocated !== null && taskBudget > 0 && form.budgetAllocated > taskBudget) {
    errors.push({
      field: "budgetAllocated",
      message: `Budget allocation (₱${form.budgetAllocated}) exceeds task budget (₱${taskBudget})`,
    });
  }

  // ✅ Description validation (optional but has limits)
  if (form.description && form.description.length > 500) {
    errors.push({
      field: "description",
      message: "Description must not exceed 500 characters",
    });
  }

  // ✅ Remarks validation (optional but has limits)
  if (form.remarks && form.remarks.length > 500) {
    errors.push({
      field: "remarks",
      message: "Remarks must not exceed 500 characters",
    });
  }

  // ✅ User IDs validation
  if (!form.userIds || form.userIds.length === 0) {
    errors.push({
      field: "userIds",
      message: "At least one assignee is required",
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
 * @param taskBudget - The parent task budget
 * @returns ValidationError or null if valid
 */
export const validateField = (
  fieldName: string,
  value: any,
  form?: Partial<SubtaskFormData>,
  taskBudget?: number
): ValidationError | null => {
  const fullForm = { ...form, [fieldName]: value };
  const result = validateSubtaskForm(fullForm, taskBudget);
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
 * @param budgetAllocated - Amount allocated to subtask
 * @param taskBudget - Task budget
 * @returns Calculated percentage
 */
export const calculateBudgetPercent = (
  budgetAllocated: number,
  taskBudget: number
): number => {
  if (taskBudget <= 0) return 0;
  return (budgetAllocated / taskBudget) * 100;
};

/**
 * Get remaining budget for task
 * @param taskBudget - Task budget
 * @param allocatedSubtasks - Array of subtasks with their budgets
 * @returns Remaining budget amount
 */
export const getRemainingBudget = (
  taskBudget: number,
  allocatedSubtasks: Array<{ budgetAllocated: number }>
): number => {
  const totalAllocated = allocatedSubtasks.reduce(
    (sum, subtask) => sum + (subtask.budgetAllocated || 0),
    0
  );
  return Math.max(0, taskBudget - totalAllocated);
};

/**
 * Get remaining budget percentage
 * @param taskBudget - Task budget
 * @param allocatedSubtasks - Array of subtasks with their budgets
 * @returns Remaining budget percentage
 */
export const getRemainingBudgetPercent = (
  taskBudget: number,
  allocatedSubtasks: Array<{ budgetAllocated: number }>
): number => {
  const remaining = getRemainingBudget(taskBudget, allocatedSubtasks);
  return taskBudget > 0 ? (remaining / taskBudget) * 100 : 0;
};

/**
 * Get priority color
 * @param priority - Priority level (HIGH, MEDIUM, LOW)
 * @returns Color hex code
 */
export const getPriorityColor = (priority: string): string => {
  const p = priority?.toUpperCase() || "";
  switch (p) {
    case "HIGH":
      return "#ef4444";
    case "MEDIUM":
      return "#f59e0b";
    case "LOW":
      return "#10b981";
    default:
      return "#6b7280";
  }
};

/**
 * Get priority background color
 * @param priority - Priority level (HIGH, MEDIUM, LOW)
 * @returns Light background color hex code
 */
export const getPriorityBgColor = (priority: string): string => {
  const p = priority?.toUpperCase() || "";
  switch (p) {
    case "HIGH":
      return "#fef2f2";
    case "MEDIUM":
      return "#fffbeb";
    case "LOW":
      return "#f0fdf4";
    default:
      return "#f9fafb";
  }
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

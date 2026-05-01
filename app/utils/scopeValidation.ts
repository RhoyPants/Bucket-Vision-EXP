// Scope Validation Schema & Utilities

export interface ScopeFormData {
  name: string;
  description?: string;
  projectId: string;
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
 * Validates a complete Scope form
 * @param form - The Scope form data to validate
 * @param projectBudget - The total project budget (for percent validation)
 * @returns ValidationResult with errors array if any
 */
export const validateScopeForm = (
  form: Partial<ScopeFormData>,
  projectBudget: number = 0
): ValidationResult => {
  const errors: ValidationError[] = [];

  // ✅ Name validation
  if (!form.name || form.name.trim() === "") {
    errors.push({
      field: "name",
      message: "Scope name is required",
    });
  } else if (form.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Scope name must be at least 2 characters",
    });
  } else if (form.name.length > 100) {
    errors.push({
      field: "name",
      message: "Scope name must not exceed 100 characters",
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

  // ✅ Budget validation against project budget
  if (form.budgetAllocated !== undefined && form.budgetAllocated !== null && projectBudget > 0 && form.budgetAllocated > projectBudget) {
    errors.push({
      field: "budgetAllocated",
      message: `Budget allocation (₱${form.budgetAllocated}) exceeds project budget (₱${projectBudget})`,
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
 * @param projectBudget - The total project budget
 * @returns ValidationError or null if valid
 */
export const validateField = (
  fieldName: string,
  value: any,
  form?: Partial<ScopeFormData>,
  projectBudget?: number
): ValidationError | null => {
  const fullForm = { ...form, [fieldName]: value };
  const result = validateScopeForm(fullForm, projectBudget);
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
 * @param budgetAllocated - Amount allocated to Scope
 * @param projectBudget - Total project budget
 * @returns Calculated percentage
 */
export const calculateBudgetPercent = (
  budgetAllocated: number,
  projectBudget: number
): number => {
  if (projectBudget <= 0) return 0;
  return (budgetAllocated / projectBudget) * 100;
};

/**
 * Get remaining budget for project
 * @param projectBudget - Total project budget
 * @param allocatedScopes - Array of scopes with their budgets
 * @returns Remaining budget amount
 */
export const getRemainingBudget = (
  projectBudget: number,
  allocatedScopes: Array<{ budgetAllocated: number }>
): number => {
  const totalAllocated = allocatedScopes.reduce(
    (sum, scope) => sum + (scope.budgetAllocated || 0),
    0
  );
  return Math.max(0, projectBudget - totalAllocated);
};

/**
 * Get remaining budget percentage
 * @param projectBudget - Total project budget
 * @param allocatedScopes - Array of scopes with their budgets
 * @returns Remaining budget percentage
 */
export const getRemainingBudgetPercent = (
  projectBudget: number,
  allocatedScopes: Array<{ budgetAllocated: number }>
): number => {
  const remaining = getRemainingBudget(projectBudget, allocatedScopes);
  return projectBudget > 0 ? (remaining / projectBudget) * 100 : 0;
};

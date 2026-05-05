// Project Validation Schema & Utilities
// Validates all required fields for project creation and update

export interface ProjectFormData {
  name: string;
  description?: string;
  location?: {
    provinceCode: string;
    provinceName: string;
    cityCode: string;
    cityName: string;
    barangayCode: string;
    barangayName: string;
    street?: string;
  };
  startDate: string;
  expectedEndDate: string;
  totalBudget: number;
  priority: string;
  pin: string;
  businessUnit: string;
  entity: string;
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
 * Validates a complete project form
 * @param form - The project form data to validate
 * @returns ValidationResult with errors array if any
 */
export const validateProjectForm = (form: Partial<ProjectFormData>): ValidationResult => {
  const errors: ValidationError[] = [];

  // ✅ Name validation
  if (!form.name || form.name.trim() === "") {
    errors.push({
      field: "name",
      message: "Project name is required",
    });
  } else if (form.name.trim().length < 3) {
    errors.push({
      field: "name",
      message: "Project name must be at least 3 characters",
    });
  } else if (form.name.length > 100) {
    errors.push({
      field: "name",
      message: "Project name must not exceed 100 characters",
    });
  }

  // ✅ PIN validation
  if (!form.pin || form.pin.trim() === "") {
    errors.push({
      field: "pin",
      message: "Project Code (PIN) is required",
    });
  } else if (form.pin.trim().length < 2) {
    errors.push({
      field: "pin",
      message: "Project Code must be at least 2 characters",
    });
  } else if (form.pin.length > 20) {
    errors.push({
      field: "pin",
      message: "Project Code must not exceed 20 characters",
    });
  } else if (!/^[A-Z0-9\-_]+$/i.test(form.pin)) {
    errors.push({
      field: "pin",
      message: "Project Code can only contain alphanumeric characters, hyphens, and underscores",
    });
  }

  // ✅ Priority validation
  if (!form.priority || form.priority.trim() === "") {
    errors.push({
      field: "priority",
      message: "Priority level is required",
    });
  } else if (!["High", "Medium", "Low"].includes(form.priority)) {
    errors.push({
      field: "priority",
      message: "Priority must be High, Medium, or Low",
    });
  }

  // ✅ Business Unit validation
  if (!form.businessUnit || form.businessUnit.trim() === "") {
    errors.push({
      field: "businessUnit",
      message: "Business Unit is required",
    });
  } else if (form.businessUnit.length > 100) {
    errors.push({
      field: "businessUnit",
      message: "Business Unit must not exceed 100 characters",
    });
  }

  // ✅ Entity validation
  if (!form.entity || form.entity.trim() === "") {
    errors.push({
      field: "entity",
      message: "Entity is required",
    });
  } else if (form.entity.length > 100) {
    errors.push({
      field: "entity",
      message: "Entity must not exceed 100 characters",
    });
  }

  // ✅ Location validation
  if (!form.location?.provinceCode || form.location.provinceCode === "") {
    errors.push({
      field: "location.province",
      message: "Province is required",
    });
  }

  if (!form.location?.cityCode || form.location.cityCode === "") {
    errors.push({
      field: "location.city",
      message: "City is required",
    });
  }

  if (!form.location?.barangayCode || form.location.barangayCode === "") {
    errors.push({
      field: "location.barangay",
      message: "Barangay is required",
    });
  }

  // ✅ Start Date validation
  if (!form.startDate || form.startDate.trim() === "") {
    errors.push({
      field: "startDate",
      message: "Start date is required",
    });
  } else {
    const startDate = new Date(form.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: "startDate",
        message: "Invalid start date format",
      });
    }
  }

  // ✅ End Date validation
  if (!form.expectedEndDate || form.expectedEndDate.trim() === "") {
    errors.push({
      field: "expectedEndDate",
      message: "End date is required",
    });
  } else {
    const endDate = new Date(form.expectedEndDate);
    if (isNaN(endDate.getTime())) {
      errors.push({
        field: "expectedEndDate",
        message: "Invalid end date format",
      });
    }
  }

  // ✅ Date range validation
  if (form.startDate && form.expectedEndDate) {
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.expectedEndDate);
    const today = new Date();
    
    // Set time to midnight for fair comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // ✅ Start date must not be earlier than today
    if (startDate < today) {
      errors.push({
        field: "startDate",
        message: "Start date cannot be earlier than today",
      });
    }

    // ✅ End date must be AFTER start date (not equal)
    if (startDate >= endDate) {
      errors.push({
        field: "expectedEndDate",
        message: "End date must be after start date (cannot be the same day)",
      });
    }

    // Check if dates are in reasonable range (not in distant future)
    const tenYearsFromNow = new Date(today);
    tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

    if (endDate > tenYearsFromNow) {
      errors.push({
        field: "expectedEndDate",
        message: "End date cannot be more than 10 years in the future",
      });
    }
  }

  // ✅ Total Budget validation
  if (form.totalBudget === undefined || form.totalBudget === null) {
    errors.push({
      field: "totalBudget",
      message: "Total Budget is required",
    });
  } else if (form.totalBudget < 0) {
    errors.push({
      field: "totalBudget",
      message: "Budget cannot be negative",
    });
  } else if (form.totalBudget > 999999999) {
    errors.push({
      field: "totalBudget",
      message: "Budget exceeds maximum allowed value",
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
 * @returns ValidationError or null if valid
 */
export const validateField = (
  fieldName: string,
  value: any,
  form?: Partial<ProjectFormData>
): ValidationError | null => {
  const fullForm = { ...form, [fieldName]: value };
  const result = validateProjectForm(fullForm);
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

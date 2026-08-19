const NON_BUDGETED_SCOPE_CODES = new Set(["PL-SOLARIUM"]);

const normalizeScopeCode = (value?: string | null) =>
  (value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Temporary frontend policy until budget requirements are stored by the API. */
export const scopeRequiresBudget = (scopeCode?: string | null): boolean =>
  !NON_BUDGETED_SCOPE_CODES.has(normalizeScopeCode(scopeCode));

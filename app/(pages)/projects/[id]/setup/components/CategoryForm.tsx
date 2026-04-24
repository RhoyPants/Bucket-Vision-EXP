import { Box, Button, TextField, Alert, Typography, Chip } from "@mui/material";
import { useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import {
  validateCategoryForm,
  getFieldError,
  hasFieldError,
  calculateBudgetPercent,
  ValidationError,
} from "@/app/utils/categoryValidation";

interface CategoryFormProps {
  categoryForm: { name: string; budgetAllocated: string; description?: string };
  setCategoryForm: (form: any) => void;
  onAddCategory: () => void;
  projectBudget?: number;
  existingCategories?: any[];
}

export default function CategoryForm({
  categoryForm,
  setCategoryForm,
  onAddCategory,
  projectBudget = 0,
  existingCategories = [],
}: CategoryFormProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const validation = validateCategoryForm(
      {
        name: categoryForm.name,
        description: categoryForm.description,
        projectId: "",
        budgetAllocated: Number(categoryForm.budgetAllocated) || 0,
      },
      projectBudget
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      const allTouched: Record<string, boolean> = {};
      validation.errors.forEach((err) => {
        allTouched[err.field] = true;
      });
      setTouched(allTouched);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);
      onAddCategory();
      setCategoryForm({ name: "", budgetAllocated: "", description: "" });
      setTouched({});
    } catch (err: any) {
      setErrors([
        {
          field: "submit",
          message: err?.message || "Failed to add category",
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const budgetPercent = projectBudget > 0 ? calculateBudgetPercent(Number(categoryForm.budgetAllocated) || 0, projectBudget) : 0;

  return (
    <Box sx={{ mb: 3, p: 2.5, bgcolor: "white", borderRadius: 2, border: "1px solid #e5e7eb" }}>
      {/* HEADER */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Create New Category
      </Typography>

      {/* ERROR ALERT */}
      {errors.length > 0 && errors.some((e) => e.field === "submit") && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
          <Typography fontWeight={600}>
            {errors.find((e) => e.field === "submit")?.message}
          </Typography>
        </Alert>
      )}

      {/* VALIDATION SUMMARY */}
      {errors.length > 0 && !errors.some((e) => e.field === "submit") && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
          icon={<WarningIcon />}
        >
          <Box>
            <Typography fontWeight={600} fontSize="0.95rem">
              Please fix {errors.length} error{errors.length !== 1 ? "s" : ""} below
            </Typography>
            <Box sx={{ mt: 0.5, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 0.5 }}>
              All fields marked with <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} /> are required
            </Box>
          </Box>
        </Alert>
      )}

      {/* FORM GRID */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
        {/* CATEGORY NAME */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Category Name
            </Typography>
            <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
          </Box>
          <TextField
            fullWidth
            placeholder="e.g., Frontend Development, Design, Testing"
            value={categoryForm.name}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, name: e.target.value })
            }
            onBlur={() => handleFieldBlur("name")}
            error={touched.name && hasFieldError("name", errors)}
            helperText={touched.name && getFieldError("name", errors)}
            variant="outlined"
            size="small"
            inputProps={{ maxLength: 100 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                backgroundColor: "white",
              },
            }}
          />
        </Box>

        {/* BUDGET ALLOCATED */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Budget Allocation
            </Typography>
            <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
          </Box>
          <TextField
            fullWidth
            type="number"
            placeholder="0.00"
            value={categoryForm.budgetAllocated}
            onChange={(e) =>
              setCategoryForm({
                ...categoryForm,
                budgetAllocated: e.target.value,
              })
            }
            onBlur={() => handleFieldBlur("budgetAllocated")}
            error={touched.budgetAllocated && hasFieldError("budgetAllocated", errors)}
            helperText={touched.budgetAllocated && getFieldError("budgetAllocated", errors)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: "₱ ",
            }}
            inputProps={{ step: "0.01", min: "0" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                backgroundColor: "white",
              },
            }}
          />
          {budgetPercent > 0 && (
            <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "text.secondary" }}>
              {budgetPercent.toFixed(2)}% of project budget
            </Typography>
          )}
        </Box>

        {/* DESCRIPTION (OPTIONAL) */}
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Description
            </Typography>
            <Chip label="Optional" size="small" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
          </Box>
          <TextField
            fullWidth
            placeholder="Describe this category..."
            value={categoryForm.description || ""}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, description: e.target.value })
            }
            variant="outlined"
            size="small"
            multiline
            rows={2}
            inputProps={{ maxLength: 500 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                backgroundColor: "white",
              },
            }}
          />
        </Box>
      </Box>

      {/* BUDGET INFO */}
      {projectBudget > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f9fafb", borderRadius: 1.5, border: "1px solid #e5e7eb" }}>
          <Typography variant="caption" fontWeight={600} display="block">
            Budget Summary
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Project Total: ₱{projectBudget.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Allocating: ₱{(Number(categoryForm.budgetAllocated) || 0).toLocaleString()} ({budgetPercent.toFixed(2)}%)
          </Typography>
        </Box>
      )}

      {/* ACTION BUTTON */}
      <Box sx={{ mt: 2.5, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            borderRadius: 1,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {saving ? "Adding..." : "+ Add Category"}
        </Button>
      </Box>
    </Box>
  );
}

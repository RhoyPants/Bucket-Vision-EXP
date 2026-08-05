import { Box, Button, TextField, Alert, Typography, Chip, Backdrop, CircularProgress, Stack, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import {
  validateScopeForm,
  getFieldError,
  hasFieldError,
  calculateBudgetPercent,
  ValidationError,
} from "@/app/utils/scopeValidation";
import {
  getMaintenanceRecords,
  MaintenanceRecord,
} from "@/app/api-service/workBreakdownMaintenanceService";
import DecimalBudgetField from "@/app/components/shared/DecimalBudgetField";

interface ScopeFormProps {
  scopeForm: {
    name: string;
    budgetAllocated: string;
    sourceType?: "MAINTENANCE" | "";
    scopeMaintenanceId?: string;
  };
  setScopeForm: (form: any) => void;
  onAddScope: () => void;
  projectBudget?: number;
  existingScopes?: any[];
}

export default function ScopeForm({
  scopeForm,
  setScopeForm,
  onAddScope,
  projectBudget = 0,
  existingScopes = [],
}: ScopeFormProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [maintenanceScopes, setMaintenanceScopes] = useState<MaintenanceRecord[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const selectedScopeMaintenanceIds = new Set(
    (existingScopes || [])
      .map((scope) => scope.scopeMaintenanceId)
      .filter(Boolean),
  );
  const availableMaintenanceScopes = maintenanceScopes.filter(
    (scope) => !selectedScopeMaintenanceIds.has(scope.id),
  );

  useEffect(() => {
    getMaintenanceRecords("scope")
      .then((items) =>
        setMaintenanceScopes(items.filter((item) => item.isActive !== false)),
      )
      .finally(() => setMaintenanceLoading(false));
  }, []);

  useEffect(() => {
    if (!scopeMenuOpen) return;
    const closeMenuOnScroll = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(".MuiMenu-paper, [role='listbox']")
      ) {
        return;
      }
      setScopeMenuOpen(false);
    };
    window.addEventListener("scroll", closeMenuOnScroll, true);
    return () => window.removeEventListener("scroll", closeMenuOnScroll, true);
  }, [scopeMenuOpen]);

  const handleSubmit = async () => {
    const validation = validateScopeForm(
      {
        name: scopeForm.name,
        projectId: "",
        budgetAllocated: Number(scopeForm.budgetAllocated) || 0,
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
      await onAddScope();
      setScopeForm({
        name: "",
        budgetAllocated: "",
        sourceType: "",
        scopeMaintenanceId: "",
      });
      setTouched({});
    } catch (err: any) {
      setErrors([
        {
          field: "submit",
          message: err?.message || "Failed to add scope",
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const budgetPercent = projectBudget > 0 ? calculateBudgetPercent(Number(scopeForm.budgetAllocated) || 0, projectBudget) : 0;

  return (
    <Box sx={{ mb: 3, p: 2.5, bgcolor: "white", borderRadius: 2, border: "1px solid #e5e7eb" }}>
      {/* HEADER */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Create New Scope
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
        {/* SCOPE NAME */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Scope Name
            </Typography>
            <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
          </Box>
          <TextField
            select
            fullWidth
            label="Scope Name"
            value={scopeForm.scopeMaintenanceId || ""}
            onChange={(e) => {
              const value = e.target.value;
              const selected = maintenanceScopes.find(
                (item) => item.id === value,
              );
              setScopeForm({
                ...scopeForm,
                sourceType: "MAINTENANCE",
                scopeMaintenanceId: value,
                name: selected?.name || "",
              });
            }}
            onBlur={() => handleFieldBlur("name")}
            error={touched.name && hasFieldError("name", errors)}
            helperText={
              (touched.name && getFieldError("name", errors)) ||
              "Select a scope from Project Maintenance."
            }
            variant="outlined"
            size="small"
            disabled={saving || maintenanceLoading}
            SelectProps={{
              open: scopeMenuOpen,
              onOpen: () => setScopeMenuOpen(true),
              onClose: () => setScopeMenuOpen(false),
              MenuProps: {
                disablePortal: true,
                PaperProps: { sx: { maxHeight: 280 } },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                backgroundColor: "white",
              },
            }}
          >
            <MenuItem value="" disabled>
              Select scope
            </MenuItem>
            {availableMaintenanceScopes.map((scope) => (
              <MenuItem key={scope.id} value={scope.id}>
                {scope.name} ({scope.code})
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* BUDGET ALLOCATED */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Budget Allocation
            </Typography>
            <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
          </Box>
          <DecimalBudgetField
            fullWidth
            placeholder="0"
            value={scopeForm.budgetAllocated}
            onValueChange={(value) =>
              setScopeForm({
                ...scopeForm,
                budgetAllocated: value === 0 ? "" : String(value),
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
            Allocating: ₱{(Number(scopeForm.budgetAllocated) || 0).toLocaleString()} ({budgetPercent.toFixed(2)}%)
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
          {saving ? "Adding..." : "+ Add Scope"}
        </Button>
      </Box>

      {/* LOADING MODAL */}
      <Backdrop
        open={saving}
        sx={{
          color: "#fff",
          zIndex: 1300,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Stack alignItems="center" gap={2}>
          <CircularProgress color="inherit" size={50} />
          <Typography fontWeight={600} fontSize={16}>
            Adding Scope...
          </Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}

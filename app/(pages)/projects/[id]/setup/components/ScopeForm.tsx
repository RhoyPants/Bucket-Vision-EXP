import { Box, Button, TextField, Alert, Typography, Chip, Backdrop, CircularProgress, Stack, Autocomplete, Paper } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import {
  validateScopeForm,
  getFieldError,
  hasFieldError,
  calculateBudgetPercent,
  ValidationError,
} from "@/app/utils/scopeValidation";
import {
  getProjectMaintenanceHierarchyResult,
  MaintenanceHierarchyScope,
  ProjectMaintenanceHierarchyMeta,
} from "@/app/api-service/workBreakdownMaintenanceService";
import DecimalBudgetField from "@/app/components/shared/DecimalBudgetField";
import { scopeRequiresBudget } from "@/app/utils/budgetPolicy";
import AnchoredDropdownPopper from "@/app/components/shared/selectors/AnchoredDropdownPopper";

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
  projectId: string;
  wbsBusinessUnitIds: string[];
}

export default function ScopeForm({
  scopeForm,
  setScopeForm,
  onAddScope,
  projectBudget = 0,
  existingScopes = [],
  projectId,
  wbsBusinessUnitIds,
}: ScopeFormProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [maintenanceScopes, setMaintenanceScopes] = useState<MaintenanceHierarchyScope[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceMeta, setMaintenanceMeta] = useState<ProjectMaintenanceHierarchyMeta | undefined>();
  const [unassignedBusinessUnits, setUnassignedBusinessUnits] = useState<Array<{ id: string; code?: string; name?: string }>>([]);
  const [activeTemplateId, setActiveTemplateId] = useState("");
  const selectedScopeMaintenanceIds = new Set(
    (existingScopes || [])
      .map((scope) => scope.scopeMaintenanceId)
      .filter(Boolean),
  );
  // Keep every backend-returned LOV visible. Existing project scopes are
  // disabled instead of removed so a valid BU/template never looks empty.
  const availableMaintenanceScopes = maintenanceScopes;
  const scopeGroups = useMemo(() => {
    const groups = new Map<string, { id: string; label: string }>();
    maintenanceScopes.forEach((scope) => {
      const id = scope.templateId || scope.maintenanceTableId || "default";
      if (!groups.has(id)) groups.set(id, { id, label: scope.templateBusinessUnits?.map((unit) => unit.code || unit.name).join(", ") || "Selected BU" });
    });
    return [...groups.values()];
  }, [maintenanceScopes]);
  const visibleMaintenanceScopes = availableMaintenanceScopes.filter(
    (scope) => (scope.templateId || scope.maintenanceTableId || "default") === activeTemplateId,
  );
  const selectedMaintenanceScope = maintenanceScopes.find(
    (scope) => scope.id === scopeForm.scopeMaintenanceId,
  );
  const budgetRequired = scopeRequiresBudget(selectedMaintenanceScope?.code);

  useEffect(() => {
    if (!wbsBusinessUnitIds.length) {
      setMaintenanceScopes([]);
      setMaintenanceLoading(false);
      return;
    }
    setMaintenanceLoading(true);
    getProjectMaintenanceHierarchyResult(projectId, wbsBusinessUnitIds)
      .then((result) => {
        setMaintenanceMeta(result.meta);
        setMaintenanceScopes(result.data.filter((item) => item.isActive !== false));
        setUnassignedBusinessUnits(result.unassignedBusinessUnits || []);
      })
      .finally(() => setMaintenanceLoading(false));
  }, [projectId, wbsBusinessUnitIds]);

  useEffect(() => {
    if (!scopeGroups.some((group) => group.id === activeTemplateId)) {
      setActiveTemplateId(scopeGroups[0]?.id || "");
    }
  }, [activeTemplateId, scopeGroups]);

  const handleSubmit = async () => {
    const validation = validateScopeForm(
      {
        name: scopeForm.name,
        projectId: "",
        budgetAllocated: Number(scopeForm.budgetAllocated) || 0,
      },
      projectBudget,
      budgetRequired
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
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#111827" }}>
        Create New Scope
      </Typography>

      {/* ERROR ALERT */}
      {maintenanceMeta?.status === "EMPTY_ASSIGNED_WBS" && (
        <Alert severity="info" sx={{ mb: 2 }}>{maintenanceMeta.message || "The assigned WBS template has no active structure entries."}</Alert>
      )}
      {!wbsBusinessUnitIds.length && <Alert severity="info" sx={{ mb: 2 }}>Select at least one WBS Business Unit to load the available scope LOV.</Alert>}
      {unassignedBusinessUnits.length > 0 && <Alert severity="warning" sx={{ mb: 2 }}>No active WBS template: {unassignedBusinessUnits.map((unit) => unit.code || unit.name).join(", ")}. Other selected templates remain available.</Alert>}
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
          <Autocomplete
            fullWidth
            options={visibleMaintenanceScopes}
            value={visibleMaintenanceScopes.find((scope) => scope.id === scopeForm.scopeMaintenanceId) || null}
            getOptionLabel={(scope) => `${scope.name} (${scope.code})`}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            getOptionDisabled={(scope) => selectedScopeMaintenanceIds.has(scope.id)}
            onChange={(_, selected) => {
              setScopeForm({
                ...scopeForm,
                sourceType: selected ? "MAINTENANCE" : "",
                scopeMaintenanceId: selected?.id || "",
                name: selected?.name || "",
                budgetAllocated: scopeRequiresBudget(selected?.code) ? scopeForm.budgetAllocated : "",
              });
            }}
            onBlur={() => handleFieldBlur("name")}
            size="small"
            disabled={saving || maintenanceLoading}
            noOptionsText="No scopes available for the selected Business Units"
            slots={{
              popper: AnchoredDropdownPopper,
              paper: (paperProps: any) => {
                const { children, ownerState: _ownerState, ...rest } = paperProps;
                return (
                  <Paper {...rest}>
                    {scopeGroups.length > 0 && (
                      <Box
                        onMouseDown={(event) => event.preventDefault()}
                        sx={{ position: "sticky", top: 0, zIndex: 2, display: "flex", flexWrap: "wrap", gap: 0.75, p: 1.25, bgcolor: "#F7F5FC", borderBottom: "1px solid #E5E0F0" }}
                      >
                        <Typography sx={{ width: "100%", fontSize: 10.5, fontWeight: 700, color: "#667085" }}>Browse scopes under</Typography>
                        {scopeGroups.map((group) => (
                          <Chip
                            key={group.id}
                            label={group.label}
                            size="small"
                            clickable
                            onClick={() => {
                              setActiveTemplateId(group.id);
                              setScopeForm({ ...scopeForm, name: "", scopeMaintenanceId: "", sourceType: "" });
                            }}
                            sx={{ bgcolor: activeTemplateId === group.id ? "#4B2E83" : "#E8E1F8", color: activeTemplateId === group.id ? "#fff" : "#24106F", fontWeight: 800, "&:hover": { bgcolor: activeTemplateId === group.id ? "#3D246B" : "#DDD3F2" } }}
                          />
                        ))}
                      </Box>
                    )}
                    {children}
                  </Paper>
                );
              },
            }}
            slotProps={{
              paper: { sx: { maxHeight: 420 } },
              listbox: { sx: { maxHeight: 340, "& .MuiAutocomplete-option": { fontSize: 12, "&:hover": { bgcolor: "#E8E1F8" }, "&.Mui-focused": { bgcolor: "#DED3F5" }, '&[aria-selected="true"]': { bgcolor: "#D4C6F0", color: "#24106F", fontWeight: 700 } } } },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Scope Name"
                error={touched.name && hasFieldError("name", errors)}
                helperText={(touched.name && getFieldError("name", errors)) || "Select or search a scope from the selected Business Units."}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, backgroundColor: "white" } }}
              />
            )}
            renderOption={(props, scope) => {
              const { key, ...optionProps } = props;
              const alreadyAdded = selectedScopeMaintenanceIds.has(scope.id);
              return <Box component="li" key={key} {...optionProps} sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: 12, "&:hover": { bgcolor: "#E8E1F8 !important" }, "&.Mui-focused": { bgcolor: "#DED3F5 !important" } }}><span>{scope.name} ({scope.code})</span>{alreadyAdded && <Chip label="Already added" size="small" sx={{ height: 18, fontSize: 9 }} />}</Box>;
            }}
          />
        </Box>

        {/* BUDGET ALLOCATED */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Budget Allocation
            </Typography>
            {budgetRequired && <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />}
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
            disabled={saving || !budgetRequired}
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

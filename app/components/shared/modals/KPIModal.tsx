"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  PersonalDashboard,
  PersonalDashboardKpi,
  SourceOptions,
  SourcePreview,
} from "@/app/api-service/personalDashboardService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  createKpi,
  fetchKpiSourceOptions,
  fetchKpiSourcePreview,
  updateKpi,
} from "@/app/redux/controllers/personalDashboardController";
import { usePermissions } from "@/app/lib/usePermissions";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatPreviewDate = (value?: string | null) => {
  if (!value) return "No data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const detectSourceType = (scopeId: string, taskId: string, subtaskId: string) => {
  if (subtaskId) return "SUBTASK";
  if (taskId) return "TASK";
  if (scopeId) return "SCOPE";
  return "PROJECT";
};

const buildPreviewFromSourceOptions = (
  sourceOptions: SourceOptions | null,
  params: { scopeId: string; taskId: string; subtaskId: string; field: string; unit: string }
): SourcePreview | null => {
  if (!sourceOptions) return null;

  const selectedScope = sourceOptions.scopes.find((scope) => scope.id === params.scopeId);
  const selectedTask = selectedScope?.tasks?.find((task) => task.id === params.taskId);
  const selectedSubtask = selectedTask?.subtasks?.find((subtask) => subtask.id === params.subtaskId);
  const source = selectedSubtask ?? selectedTask ?? selectedScope ?? sourceOptions.project;

  return {
    sourceType: detectSourceType(params.scopeId, params.taskId, params.subtaskId),
    field: params.field,
    unit: params.unit,
    currentProgress: source.progress,
    currentValue: source.progress,
    expectedStartDate: source.expectedStartDate ?? null,
    expectedEndDate: source.expectedEndDate ?? null,
  };
};

const getSimplifiedThresholds = (kpi?: PersonalDashboardKpi | null) => {
  if (kpi?.thresholdConfig) {
    return {
      criticalBelow: String(kpi.thresholdConfig.criticalBelow),
      healthyAtOrAbove: String(kpi.thresholdConfig.healthyAtOrAbove),
    };
  }
  const critical = kpi?.thresholds?.find((threshold) => threshold.status === "CRITICAL");
  const healthy = kpi?.thresholds?.find((threshold) => threshold.status === "HEALTHY");
  return {
    criticalBelow: critical?.value1 === undefined ? "30" : String(critical.value1),
    healthyAtOrAbove: healthy?.value1 === undefined ? "70" : String(healthy.value1),
  };
};

interface KPIModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  dashboard: PersonalDashboard | null;
  editingKpi?: PersonalDashboardKpi | null;
}

export default function KPIModal({
  open,
  onClose,
  onSaved,
  dashboard,
  editingKpi,
}: KPIModalProps) {
  const dispatch = useAppDispatch();
  const { sourceOptions, sourceLoading } = useAppSelector((state) => state.personalDashboard);
  const { canCreate, canUpdate } = usePermissions();
  const isEdit = Boolean(editingKpi?.id);
  const canSaveKpi = isEdit
    ? canUpdate("projects")
    : canCreate("projects");
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    unit: "%",
    description: "",
    scopeId: "",
    taskId: "",
    subtaskId: "",
    field: "PROGRESS",
    criticalBelow: "30",
    healthyAtOrAbove: "70",
  });

  const sourceType = useMemo(
    () => detectSourceType(form.scopeId, form.taskId, form.subtaskId),
    [form.scopeId, form.subtaskId, form.taskId]
  );

  const selectedScope = sourceOptions?.scopes.find((scope) => scope.id === form.scopeId);
  const selectedTask = selectedScope?.tasks?.find((task) => task.id === form.taskId);
  const fieldOptions = useMemo(
    () =>
      sourceOptions?.fieldOptions?.length
        ? sourceOptions.fieldOptions
        : [{ field: "PROGRESS", unit: "%", label: "Progress" }],
    [sourceOptions?.fieldOptions]
  );

  const isValid = useMemo(() => {
    if (form.name.trim().length < 2) return false;
    if (!dashboard?.id) return false;
    if (!form.field) return false;

    const critical = Number(form.criticalBelow);
    const healthy = Number(form.healthyAtOrAbove);
    return (
      form.criticalBelow.trim() !== "" &&
      form.healthyAtOrAbove.trim() !== "" &&
      Number.isFinite(critical) &&
      Number.isFinite(healthy) &&
      critical >= 0 &&
      critical <= 100 &&
      healthy >= 0 &&
      healthy <= 100 &&
      critical < healthy
    );
  }, [dashboard?.id, form.criticalBelow, form.field, form.healthyAtOrAbove, form.name]);

  useEffect(() => {
    if (!open || !dashboard?.id) return;
    setError("");
    setPreview(editingKpi?.preview ?? null);
    const simplifiedThresholds = getSimplifiedThresholds(editingKpi);
    setForm({
      name: editingKpi?.name ?? "",
      unit: editingKpi?.unit ?? "%",
      description: editingKpi?.description ?? "",
      scopeId: editingKpi?.scopeId ?? "",
      taskId: editingKpi?.taskId ?? "",
      subtaskId: editingKpi?.subtaskId ?? "",
      field: editingKpi?.field ?? "PROGRESS",
      ...simplifiedThresholds,
    });

    dispatch(fetchKpiSourceOptions(dashboard.id)).catch((err: unknown) =>
      setError(getErrorMessage(err, "Failed to load KPI source options."))
    );
  }, [dashboard?.id, dispatch, editingKpi, open]);

  useEffect(() => {
    if (!open || !dashboard?.id) return;
    const selectedField = fieldOptions.find((option) => option.field === form.field);
    if (selectedField?.unit && selectedField.unit !== form.unit) {
      setForm((prev) => ({ ...prev, unit: selectedField.unit }));
    }

    const derivedPreview = buildPreviewFromSourceOptions(sourceOptions, {
      scopeId: form.scopeId,
      taskId: form.taskId,
      subtaskId: form.subtaskId,
      field: form.field,
      unit: selectedField?.unit ?? form.unit,
    });

    if (derivedPreview) {
      setPreview((prev) => ({ ...prev, ...derivedPreview }));
    }

    if (isEdit) return;

    const timeout = window.setTimeout(() => {
      dispatch(
        fetchKpiSourcePreview(dashboard.id, {
          scopeId: form.scopeId || undefined,
          taskId: form.taskId || undefined,
          subtaskId: form.subtaskId || undefined,
        })
      )
        .then((data) => setPreview(data))
        .catch(() => setPreview(null));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [dashboard?.id, dispatch, fieldOptions, form.field, form.scopeId, form.subtaskId, form.taskId, form.unit, isEdit, open, sourceOptions]);

  const handleSubmit = async () => {
    if (!dashboard?.id || !isValid || !canSaveKpi) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        scopeId: form.scopeId || null,
        taskId: form.taskId || null,
        subtaskId: form.subtaskId || null,
        criticalBelow: Number(form.criticalBelow),
        healthyAtOrAbove: Number(form.healthyAtOrAbove),
      };

      if (isEdit && editingKpi?.id) {
        await dispatch(updateKpi(dashboard.id, editingKpi.id, payload));
      } else {
        await dispatch(
          createKpi(dashboard.id, {
            ...payload,
            scopeId: form.scopeId || undefined,
            taskId: form.taskId || undefined,
            subtaskId: form.subtaskId || undefined,
          })
        );
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save KPI."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 800 }}>{isEdit ? "Edit KPI" : "Create KPI"}</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: "calc(100vh - 230px)" }}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          {sourceLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!sourceLoading && (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="KPI Name"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  helperText="At least 2 characters"
                />
                <TextField label="Unit" value={form.unit} InputProps={{ readOnly: true }} />
                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  sx={{ gridColumn: { xs: "auto", md: "1 / 3" } }}
                />
                <TextField label="Project" value={dashboard?.project?.name ?? sourceOptions?.project?.name ?? dashboard?.name ?? ""} InputProps={{ readOnly: true }} />
                <TextField
                  select
                  label="Scope"
                  disabled={isEdit || !dashboard?.id}
                  value={form.scopeId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, scopeId: event.target.value, taskId: "", subtaskId: "" }))
                  }
                >
                  <MenuItem value="">Project level</MenuItem>
                  {sourceOptions?.scopes.map((scope) => (
                    <MenuItem key={scope.id} value={scope.id}>
                      {scope.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Task"
                  disabled={isEdit || !form.scopeId}
                  value={form.taskId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, taskId: event.target.value, subtaskId: "" }))
                  }
                >
                  <MenuItem value="">Scope level</MenuItem>
                  {selectedScope?.tasks?.map((task) => (
                    <MenuItem key={task.id} value={task.id}>
                      {task.title}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Subtask"
                  disabled={isEdit || !form.taskId}
                  value={form.subtaskId}
                  onChange={(event) => setForm((prev) => ({ ...prev, subtaskId: event.target.value }))}
                >
                  <MenuItem value="">Task level</MenuItem>
                  {selectedTask?.subtasks?.map((subtask) => (
                    <MenuItem key={subtask.id} value={subtask.id}>
                      {subtask.title}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Detected Source Type" value={sourceType} InputProps={{ readOnly: true }} />
                <TextField
                  select
                  label="Field"
                  value={form.field}
                  onChange={(event) => setForm((prev) => ({ ...prev, field: event.target.value }))}
                >
                  {fieldOptions.map((field) => (
                    <MenuItem key={field.field} value={field.field}>
                      {field.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, backgroundColor: "#f9fafb" }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Source Preview
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                  {[
                    ["Source Type", preview?.sourceType ?? sourceType],
                    ["Field", preview?.field ?? form.field],
                    ["Current Progress", preview?.currentProgress ?? preview?.currentValue ?? "No data"],
                    ["Unit", preview?.unit ?? form.unit],
                    ["Expected Start Date", formatPreviewDate(preview?.expectedStartDate ?? preview?.startDate)],
                    ["Expected End Date", formatPreviewDate(preview?.expectedEndDate ?? preview?.endDate)],
                  ].map(([label, value]) => (
                    <Box key={String(label)} sx={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 1.5, p: 1.5 }}>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700 }}>
                        {label}
                      </Typography>
                      <Typography fontWeight={800}>{String(value)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ border: "1px solid #DBEAFE", borderRadius: 2, p: 2, bgcolor: "#F8FAFC" }}>
                <Typography fontWeight={800}>Progress Thresholds</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 12, mt: 0.4, mb: 2 }}>
                  Enter two values. Critical, In Flow, and Healthy rules are generated automatically.
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField
                    required
                    type="number"
                    label="Critical Below"
                    value={form.criticalBelow}
                    inputProps={{ min: 0, max: 100, step: "any" }}
                    onChange={(event) => setForm((prev) => ({ ...prev, criticalBelow: event.target.value }))}
                    helperText="Progress below this percentage is Critical"
                  />
                  <TextField
                    required
                    type="number"
                    label="Healthy At or Above"
                    value={form.healthyAtOrAbove}
                    inputProps={{ min: 0, max: 100, step: "any" }}
                    onChange={(event) => setForm((prev) => ({ ...prev, healthyAtOrAbove: event.target.value }))}
                    helperText="Progress at or above this percentage is Healthy"
                  />
                </Box>
                {form.criticalBelow.trim() !== "" && form.healthyAtOrAbove.trim() !== "" && (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1, mt: 2 }}>
                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FECACA" }}>
                      <Typography sx={{ color: "#B91C1C", fontSize: 11, fontWeight: 800 }}>CRITICAL</Typography>
                      <Typography sx={{ color: "#7F1D1D", fontSize: 12 }}>Progress &lt; {form.criticalBelow}%</Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <Typography sx={{ color: "#B45309", fontSize: 11, fontWeight: 800 }}>IN FLOW</Typography>
                      <Typography sx={{ color: "#78350F", fontSize: 12 }}>From {form.criticalBelow}% to below {form.healthyAtOrAbove}%</Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "#ECFDF5", border: "1px solid #BBF7D0" }}>
                      <Typography sx={{ color: "#047857", fontSize: 11, fontWeight: 800 }}>HEALTHY</Typography>
                      <Typography sx={{ color: "#065F46", fontSize: 12 }}>Progress ≥ {form.healthyAtOrAbove}%</Typography>
                    </Box>
                  </Box>
                )}
                {!isValid && form.name.trim().length >= 2 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Thresholds must be between 0 and 100, and Critical Below must be lower than Healthy At or Above.
                  </Alert>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        {canSaveKpi && (
          <Button variant="contained" disabled={!isValid || saving} onClick={handleSubmit}>
            {saving ? "Saving..." : isEdit ? "Update KPI" : "Create KPI"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

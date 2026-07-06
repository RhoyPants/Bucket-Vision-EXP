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
  KpiThreshold,
  PersonalDashboard,
  PersonalDashboardKpi,
  SourceOptions,
  SourcePreview,
  ThresholdOperator,
} from "@/app/api-service/personalDashboardService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  createKpi,
  fetchKpiSourceOptions,
  fetchKpiSourcePreview,
  updateKpi,
} from "@/app/redux/controllers/personalDashboardController";
import { usePermissions } from "@/app/lib/usePermissions";

const statusColors: Record<string, { bg: string; color: string; accent: string }> = {
  CRITICAL: { bg: "#fef2f2", color: "#b91c1c", accent: "#ef4444" },
  ONFLOW: { bg: "#fffbeb", color: "#b45309", accent: "#f59e0b" },
  HEALTHY: { bg: "#ecfdf5", color: "#047857", accent: "#10b981" },
};

const thresholdStatuses: KpiThreshold["status"][] = ["CRITICAL", "ONFLOW", "HEALTHY"];
const operators: ThresholdOperator[] = ["LT", "LTE", "EQ", "GTE", "GT", "BETWEEN"];

const valueOperatorLabels: Record<ThresholdOperator, string> = {
  LT: "Less than",
  LTE: "Less than or equal to",
  EQ: "Equal to",
  GTE: "Greater than or equal to",
  GT: "Greater than",
  BETWEEN: "Between",
};

const dateOperatorLabels: Record<ThresholdOperator, string> = {
  LT: "Before",
  LTE: "On or before",
  EQ: "On this date",
  GTE: "On or after",
  GT: "After",
  BETWEEN: "Between dates",
};

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

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toIsoDateValue = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
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

const emptyThresholds = (): KpiThreshold[] =>
  thresholdStatuses.map((status) => ({
    status,
    operator: status === "ONFLOW" ? "BETWEEN" : "",
    value1: "",
    value2: status === "ONFLOW" ? "" : undefined,
    dateOperator: "",
    dateValue1: "",
    dateValue2: "",
  }));

const cleanThresholds = (thresholds: KpiThreshold[]) =>
  thresholds.map((threshold) => ({
    status: threshold.status,
    operator: threshold.operator as ThresholdOperator,
    value1: Number(threshold.value1),
    ...(threshold.operator === "BETWEEN" ? { value2: Number(threshold.value2) } : {}),
    ...(threshold.dateOperator ? { dateOperator: threshold.dateOperator } : {}),
    ...(threshold.dateOperator ? { dateValue1: toIsoDateValue(threshold.dateValue1) } : {}),
    ...(threshold.dateOperator === "BETWEEN" ? { dateValue2: toIsoDateValue(threshold.dateValue2) } : {}),
  }));

const normalizeKpiThresholds = (thresholds?: KpiThreshold[]) => {
  const byStatus = new Map((thresholds ?? []).map((threshold) => [threshold.status, threshold]));

  return thresholdStatuses.map((status) => {
    const threshold = byStatus.get(status);
    return {
      status,
      operator: threshold?.operator ?? "",
      value1: threshold?.value1 ?? "",
      value2: threshold?.operator === "BETWEEN" ? threshold.value2 ?? "" : undefined,
      dateOperator: threshold?.dateOperator ?? "",
      dateValue1: toDateInputValue(threshold?.dateValue1),
      dateValue2: threshold?.dateOperator === "BETWEEN" ? toDateInputValue(threshold.dateValue2) : "",
    };
  });
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
    ? canUpdate("personal_dashboard")
    : canCreate("personal_dashboard");
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
    thresholds: emptyThresholds(),
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

    return form.thresholds.every((threshold) => {
      if (!threshold.operator || threshold.value1 === "") return false;
      if (threshold.operator === "BETWEEN" && threshold.value2 === "") return false;
      if (threshold.dateOperator && !threshold.dateValue1) return false;
      if (threshold.dateOperator === "BETWEEN" && !threshold.dateValue2) return false;
      return true;
    });
  }, [dashboard?.id, form.field, form.name, form.thresholds]);

  useEffect(() => {
    if (!open || !dashboard?.id) return;
    setError("");
    setPreview(editingKpi?.preview ?? null);
    setForm({
      name: editingKpi?.name ?? "",
      unit: editingKpi?.unit ?? "%",
      description: editingKpi?.description ?? "",
      scopeId: editingKpi?.scopeId ?? "",
      taskId: editingKpi?.taskId ?? "",
      subtaskId: editingKpi?.subtaskId ?? "",
      field: editingKpi?.field ?? "PROGRESS",
      thresholds: editingKpi?.thresholds?.length
        ? normalizeKpiThresholds(editingKpi.thresholds)
        : emptyThresholds(),
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

  const updateThreshold = (index: number, key: keyof KpiThreshold, value: string) => {
    setForm((prev) => ({
      ...prev,
      thresholds: prev.thresholds.map((threshold, currentIndex) => {
        if (currentIndex !== index) return threshold;
        const next = { ...threshold, [key]: value };
        if (key === "operator" && value !== "BETWEEN") next.value2 = undefined;
        if (key === "operator" && value === "BETWEEN") next.value2 = next.value2 ?? "";
        if (key === "dateOperator" && !value) {
          next.dateValue1 = "";
          next.dateValue2 = "";
        }
        if (key === "dateOperator" && value !== "BETWEEN") next.dateValue2 = "";
        return next;
      }),
    }));
  };

  const handleSubmit = async () => {
    if (!dashboard?.id || !isValid || !canSaveKpi) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        thresholds: cleanThresholds(form.thresholds),
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

              <Box>
                <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                  Threshold Rules
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
                  {form.thresholds.map((threshold, index) => {
                    const colors = statusColors[threshold.status];
                    return (
                      <Box key={threshold.status} sx={{ border: `1px solid ${colors.accent}`, borderRadius: 2, p: 2, backgroundColor: colors.bg }}>
                        <Typography fontWeight={900} sx={{ color: colors.color, mb: 1.5 }}>
                          {threshold.status}
                        </Typography>
                        <Stack spacing={1.5}>
                          <TextField
                            select
                            label="Value Operator"
                            required
                            size="small"
                            value={threshold.operator}
                            onChange={(event) => updateThreshold(index, "operator", event.target.value)}
                          >
                            {operators.map((operator) => (
                              <MenuItem key={operator} value={operator}>
                                {valueOperatorLabels[operator]}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            label="Value 1"
                            required
                            type="number"
                            size="small"
                            value={threshold.value1}
                            onChange={(event) => updateThreshold(index, "value1", event.target.value)}
                          />
                          {threshold.operator === "BETWEEN" && (
                            <TextField
                              label="Value 2"
                              required
                              type="number"
                              size="small"
                              value={threshold.value2 ?? ""}
                              onChange={(event) => updateThreshold(index, "value2", event.target.value)}
                            />
                          )}
                          <TextField
                            select
                            label="Date Operator"
                            size="small"
                            value={threshold.dateOperator ?? ""}
                            onChange={(event) => updateThreshold(index, "dateOperator", event.target.value)}
                          >
                            <MenuItem value="">None</MenuItem>
                            {operators.map((operator) => (
                              <MenuItem key={operator} value={operator}>
                                {dateOperatorLabels[operator]}
                              </MenuItem>
                            ))}
                          </TextField>
                          {threshold.dateOperator && (
                            <TextField
                              label="Date 1"
                              required
                              type="date"
                              size="small"
                              value={threshold.dateValue1 ?? ""}
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) => updateThreshold(index, "dateValue1", event.target.value)}
                            />
                          )}
                          {threshold.dateOperator === "BETWEEN" && (
                            <TextField
                              label="Date 2"
                              required
                              type="date"
                              size="small"
                              value={threshold.dateValue2 ?? ""}
                              InputLabelProps={{ shrink: true }}
                              onChange={(event) => updateThreshold(index, "dateValue2", event.target.value)}
                            />
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
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

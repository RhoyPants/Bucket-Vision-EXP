"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Slider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { KpiTarget, PersonalDashboard, PersonalDashboardKpi, SourceOptions, SourcePreview } from "@/app/api-service/personalDashboardService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { createKpi, fetchKpiSourceOptions, fetchKpiSourcePreview, updateKpi } from "@/app/redux/controllers/personalDashboardController";
import { usePermissions } from "@/app/lib/usePermissions";

type TargetForm = { key: string; id?: string; scopeId: string; taskId: string; subtaskId: string; field: string; unit: string; criticalBelow: string; healthyAtOrAbove: string };
const makeTarget = (target?: KpiTarget): TargetForm => ({ key: target?.id ?? `${Date.now()}-${Math.random()}`, id: target?.id, scopeId: target?.scopeId ?? "", taskId: target?.taskId ?? "", subtaskId: target?.subtaskId ?? "", field: target?.field ?? "PROGRESS", unit: target?.unit ?? "%", criticalBelow: String(target?.thresholds.criticalBelow ?? -15), healthyAtOrAbove: String(target?.thresholds.healthyAtOrAbove ?? -5) });
const sourceType = (target: TargetForm) => target.subtaskId ? "SUBTASK" : target.taskId ? "TASK" : target.scopeId ? "SCOPE" : "PROJECT";
const sourceKey = (target: TargetForm, projectId?: string) => `${sourceType(target)}:${target.subtaskId || target.taskId || target.scopeId || projectId}:${target.field}`;
const validTarget = (target: TargetForm) => { const critical = Number(target.criticalBelow); const healthy = Number(target.healthyAtOrAbove); return target.field === "PROGRESS" && target.unit === "%" && target.criticalBelow.trim() !== "" && target.healthyAtOrAbove.trim() !== "" && Number.isFinite(critical) && Number.isFinite(healthy) && critical >= -100 && critical <= 100 && healthy >= -100 && healthy <= 100 && critical < healthy; };
const completeSource = (target: TargetForm) => Boolean(target.scopeId && target.taskId && target.subtaskId);
const findSource = (options: SourceOptions | null, target: TargetForm) => { const scope = options?.scopes.find((item) => item.id === target.scopeId); return { scope, task: scope?.tasks?.find((item) => item.id === target.taskId) }; };
const errorMessage = (error: unknown) => { const value = error as { response?: { data?: { message?: string } }; message?: string }; return value.response?.data?.message ?? value.message ?? "Failed to save KPI."; };

interface Props { open: boolean; onClose: () => void; onSaved: () => void | Promise<void>; dashboard: PersonalDashboard | null; editingKpi?: PersonalDashboardKpi | null }

export default function KPIModal({ open, onClose, onSaved, dashboard, editingKpi }: Props) {
  const dispatch = useAppDispatch();
  const { sourceOptions, sourceLoading } = useAppSelector((state) => state.personalDashboard);
  const { canCreate, canUpdate } = usePermissions();
  const isEdit = Boolean(editingKpi?.id);
  const allowed = isEdit ? canUpdate("project_dashboard") : canCreate("project_dashboard");
  const [name, setName] = useState("");
  const [targets, setTargets] = useState<TargetForm[]>([]);
  const [draft, setDraft] = useState<TargetForm>(makeTarget());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletedTargetIds, setDeletedTargetIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, SourcePreview | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [targetAttempted, setTargetAttempted] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const committedKeys = targets.map((target) => sourceKey(target, dashboard?.projectId ?? dashboard?.id));
  const hasDuplicates = new Set(committedKeys).size !== committedKeys.length;
  const draftDuplicate = targets.some((target, index) => index !== editingIndex && sourceKey(target, dashboard?.projectId ?? dashboard?.id) === sourceKey(draft, dashboard?.projectId ?? dashboard?.id));
  const canCommitDraft = completeSource(draft) && validTarget(draft) && !draftDuplicate;
  const canSave = Boolean(dashboard?.id) && name.trim().length >= 2 && targets.length > 0 && targets.every((target) => completeSource(target) && validTarget(target)) && !hasDuplicates;

  useEffect(() => {
    if (!open || !dashboard?.id) return;
    setName(editingKpi?.name ?? "");
    setTargets(editingKpi?.targets?.length ? editingKpi.targets.map(makeTarget) : []);
    setDraft(makeTarget()); setEditingIndex(null); setDeletedTargetIds([]); setPreviews({}); setError(""); setTargetAttempted(false); setSaveAttempted(false);
    dispatch(fetchKpiSourceOptions(dashboard.id)).catch((caught: unknown) => setError(errorMessage(caught)));
  }, [dashboard?.id, dispatch, editingKpi, open]);

  useEffect(() => {
    if (!open || !dashboard?.id || sourceLoading) return;
    const candidates = [...targets, draft];
    const timer = window.setTimeout(() => candidates.forEach((target) => {
      if (!validTarget(target)) return;
      dispatch(fetchKpiSourcePreview(dashboard.id, { scopeId: target.scopeId || undefined, taskId: target.taskId || undefined, subtaskId: target.subtaskId || undefined, field: target.field, criticalBelow: Number(target.criticalBelow), healthyAtOrAbove: Number(target.healthyAtOrAbove) }))
        .then((preview) => setPreviews((current) => ({ ...current, [target.key]: preview })))
        .catch(() => setPreviews((current) => ({ ...current, [target.key]: null })));
    }), 300);
    return () => window.clearTimeout(timer);
  }, [dashboard?.id, dispatch, draft, open, sourceLoading, targets]);

  const commitDraft = () => {
    setTargetAttempted(true);
    if (!canCommitDraft) return;
    if (editingIndex === null) setTargets((current) => [...current, draft]);
    else setTargets((current) => current.map((target, index) => index === editingIndex ? draft : target));
    setDraft(makeTarget()); setEditingIndex(null); setTargetAttempted(false);
  };
  const editTarget = (index: number) => { setDraft({ ...targets[index] }); setEditingIndex(index); };
  const cancelEdit = () => { setDraft(makeTarget()); setEditingIndex(null); setTargetAttempted(false); };
  const removeTarget = (index: number) => {
    const removed = targets[index];
    if (removed.id) setDeletedTargetIds((current) => [...current, removed.id!]);
    setTargets((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) cancelEdit(); else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };
  const labelFor = (target: TargetForm) => { const { scope, task } = findSource(sourceOptions, target); return target.subtaskId ? task?.subtasks?.find((item) => item.id === target.subtaskId)?.title ?? "Subtask" : target.taskId ? task?.title ?? "Task" : target.scopeId ? scope?.name ?? "Scope" : sourceOptions?.project.name ?? "Project"; };

  const submit = async () => {
    setSaveAttempted(true);
    if (!dashboard?.id || !canSave || !allowed) return;
    setSaving(true); setError("");
    const payload = { name: name.trim(), description: editingKpi?.description ?? "", chartTypes: ["DONUT", "BAR"] as ("DONUT" | "BAR")[], targets: targets.map((target, index) => ({ id: target.id, scopeId: target.scopeId || null, taskId: target.taskId || null, subtaskId: target.subtaskId || null, field: target.field, unit: target.unit, criticalBelow: Number(target.criticalBelow), healthyAtOrAbove: Number(target.healthyAtOrAbove), sortOrder: index })), ...(isEdit ? { deletedTargetIds } : {}) };
    try { if (isEdit && editingKpi?.id) await dispatch(updateKpi(dashboard.id, editingKpi.id, payload)); else await dispatch(createKpi(dashboard.id, payload)); await onSaved(); onClose(); }
    catch (caught) { setError(errorMessage(caught)); } finally { setSaving(false); }
  };

  const selected = findSource(sourceOptions, draft);
  const preview = previews[draft.key];

  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xl" PaperProps={{ sx: { height: { md: "min(780px, calc(100vh - 32px))" } } }}>
    <DialogTitle sx={{ fontWeight: 900 }}>{isEdit ? "Edit KPI" : "Create KPI"}</DialogTitle>
    <DialogContent dividers sx={{ overflow: { xs: "auto", lg: "hidden" } }}><Stack spacing={2} sx={{ height: { lg: "100%" }, minHeight: 0 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {sourceLoading ? <Box sx={{ py: 6, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : <>
        <TextField required label="KPI Name" value={name} onChange={(event) => setName(event.target.value)} error={saveAttempted && name.trim().length < 2} helperText={saveAttempted && !name.trim() ? "KPI name is required" : saveAttempted && name.trim().length < 2 ? "KPI name must contain at least 2 characters" : "At least 2 characters"} fullWidth />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(480px, .95fr)" }, gap: 2, alignItems: "stretch", flex: { lg: 1 }, minHeight: 0 }}>
          <Box sx={{ border: "1px solid #DBEAFE", borderRadius: 2, bgcolor: "#F8FAFC", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.15, bgcolor: "#EFF6FF" }}><Typography fontWeight={850}>{editingIndex === null ? "Add Target" : `Edit Target ${editingIndex + 1}`}</Typography><Typography sx={{ color: "#64748B", fontSize: 10 }}>Configure a target, then add it to the KPI.</Typography></Box>
            <Stack spacing={2} sx={{ p: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
                <TextField required select label="Scope" value={draft.scopeId} error={targetAttempted && !draft.scopeId} helperText={targetAttempted && !draft.scopeId ? "Scope is required" : " "} onChange={(event) => setDraft((current) => ({ ...current, scopeId: event.target.value, taskId: "", subtaskId: "" }))}><MenuItem value="">Select scope</MenuItem>{sourceOptions?.scopes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
                <TextField required select label="Task" disabled={!draft.scopeId} value={draft.taskId} error={targetAttempted && !draft.taskId} helperText={targetAttempted && !draft.taskId ? draft.scopeId ? "Task is required" : "Select a scope first" : " "} onChange={(event) => setDraft((current) => ({ ...current, taskId: event.target.value, subtaskId: "" }))}><MenuItem value="">Select task</MenuItem>{selected.scope?.tasks?.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}</TextField>
                <TextField required select label="Subtask" disabled={!draft.taskId} value={draft.subtaskId} error={targetAttempted && !draft.subtaskId} helperText={targetAttempted && !draft.subtaskId ? draft.taskId ? "Subtask is required" : "Select a task first" : " "} onChange={(event) => setDraft((current) => ({ ...current, subtaskId: event.target.value }))}><MenuItem value="">Select subtask</MenuItem>{selected.task?.subtasks?.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}</TextField>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(5, 1fr)" }, gap: 1 }}>{[["Source", preview?.sourceType ?? sourceType(draft)], ["Actual", preview?.actualProgress == null ? "No data" : `${preview.actualProgress}%`], ["Expected", preview?.expectedProgress == null ? "No data" : `${preview.expectedProgress}%`], ["Variance", preview?.variance == null ? "No data" : `${preview.variance > 0 ? "+" : ""}${preview.variance}%`], ["Status", preview?.previewStatus ?? "UNCLASSIFIED"]].map(([label, value]) => <Box key={String(label)} sx={{ p: 1, border: "1px solid #E2E8F0", bgcolor: "white", borderRadius: 1.5 }}><Typography sx={{ color: "#64748B", fontSize: 9, fontWeight: 700 }}>{label}</Typography><Typography sx={{ fontSize: 11, fontWeight: 850 }}>{value}</Typography></Box>)}</Box>
              <Divider />
              <Box><Typography fontWeight={850}>Variance Thresholds</Typography><Typography sx={{ color: "#64748B", fontSize: 11 }}>Status uses actual progress minus expected progress. Drag the handles or type an exact value below.</Typography><Box sx={{ px: 1.5, pt: 3.5, pb: 1 }}><Slider value={[Number(draft.criticalBelow) || 0, Number(draft.healthyAtOrAbove) || 0]} min={-100} max={100} step={0.01} disableSwap valueLabelDisplay="on" valueLabelFormat={(value) => `${value > 0 ? "+" : ""}${value}%`} marks={[{ value: -100, label: "-100%" }, { value: 0, label: "0%" }, { value: 100, label: "+100%" }]} onChange={(_, value) => { if (!Array.isArray(value)) return; setDraft((current) => ({ ...current, criticalBelow: String(value[0]), healthyAtOrAbove: String(value[1]) })); }} sx={{ color: "transparent", "& .MuiSlider-rail": { opacity: 1, background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)" }, "& .MuiSlider-track": { border: 0, bgcolor: "transparent" }, "& .MuiSlider-thumb": { bgcolor: "#FFF", border: "2px solid #334155" }, '& .MuiSlider-thumb[data-index="0"]': { borderColor: "#EF4444" }, '& .MuiSlider-thumb[data-index="1"]': { borderColor: "#10B981" }, "& .MuiSlider-valueLabel": { bgcolor: "#0F172A", fontSize: 10 }, "& .MuiSlider-markLabel": { color: "#64748B", fontSize: 9.5 } }} /></Box><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}><Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FECACA" }}><Typography sx={{ color: "#B91C1C", fontSize: 9, fontWeight: 850 }}>CRITICAL BELOW</Typography><TextField required variant="standard" type="number" value={draft.criticalBelow} inputProps={{ min: -100, max: 100, step: 0.01 }} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} onChange={(event) => setDraft((current) => ({ ...current, criticalBelow: event.target.value }))} sx={{ mt: 0.1, width: "100%", "& input": { color: "#7F1D1D", fontSize: 14, fontWeight: 900 } }} /></Box><Box sx={{ p: 1, display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: 1.5, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", textAlign: "center" }}><Typography sx={{ color: "#B45309", fontSize: 9, fontWeight: 850 }}>IN FLOW</Typography><Typography sx={{ color: "#78350F", fontSize: 11, fontWeight: 800 }}>{draft.criticalBelow || "..."}% to below {draft.healthyAtOrAbove || "..."}%</Typography></Box><Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#ECFDF5", border: "1px solid #A7F3D0" }}><Typography sx={{ color: "#047857", fontSize: 9, fontWeight: 850 }}>HEALTHY AT OR ABOVE</Typography><TextField required variant="standard" type="number" value={draft.healthyAtOrAbove} inputProps={{ min: -100, max: 100, step: 0.01 }} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} onChange={(event) => setDraft((current) => ({ ...current, healthyAtOrAbove: event.target.value }))} sx={{ mt: 0.1, width: "100%", "& input": { color: "#065F46", fontSize: 14, fontWeight: 900 } }} /></Box></Box></Box>
              {draftDuplicate && <Alert severity="warning">This source and field already exist in the target list.</Alert>}
              {!validTarget(draft) && <Alert severity="warning">Thresholds must be from -100 to 100, and Critical must be lower than Healthy.</Alert>}
              <Stack direction="row" justifyContent="flex-end" spacing={1}>{editingIndex !== null && <Button onClick={cancelEdit}>Cancel edit</Button>}<Button variant="contained" startIcon={editingIndex === null ? <AddIcon /> : undefined} onClick={commitDraft} sx={!canCommitDraft ? { bgcolor: "#CBD5E1", color: "#475569", "&:hover": { bgcolor: "#94A3B8" } } : undefined}>{editingIndex === null ? "Add Target" : "Update Target"}</Button></Stack>
            </Stack>
          </Box>

          <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFF", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ px: 1.5, py: 1.1, borderBottom: "1px solid #E2E8F0" }}><Box><Typography fontWeight={850}>Target fields</Typography><Typography sx={{ color: "#64748B", fontSize: 10 }}>Click a row to edit it. Changes are applied after Update Target.</Typography></Box><Box sx={{ textAlign: "right", flexShrink: 0 }}><Typography sx={{ color: "#0F172A", fontSize: 18, lineHeight: 1, fontWeight: 900 }}>{targets.length}</Typography><Typography sx={{ color: "#64748B", fontSize: 9 }}>Total targets</Typography></Box></Stack>
            <TableContainer sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell sx={{ width: 32, fontWeight: 850 }}>#</TableCell><TableCell sx={{ fontWeight: 850 }}>Source</TableCell><TableCell align="right" sx={{ fontWeight: 850 }}>Critical</TableCell><TableCell align="right" sx={{ fontWeight: 850 }}>Healthy</TableCell><TableCell align="right" sx={{ fontWeight: 850 }}>Variance</TableCell><TableCell sx={{ fontWeight: 850 }}>Status</TableCell><TableCell sx={{ width: 38 }} /></TableRow></TableHead><TableBody>{targets.map((target, index) => { const targetPreview = previews[target.key]; const status = targetPreview?.previewStatus ?? "UNCLASSIFIED"; return <TableRow key={target.key} hover selected={index === editingIndex} onClick={() => editTarget(index)} sx={{ cursor: "pointer", "&.Mui-selected": { bgcolor: "#EFF6FF" } }}><TableCell>{index + 1}</TableCell><TableCell><Typography noWrap title={labelFor(target)} sx={{ maxWidth: 130, fontSize: 11, fontWeight: 750 }}>{labelFor(target)}</Typography><Typography sx={{ color: "#64748B", fontSize: 9 }}>{sourceType(target)} · {target.field}</Typography></TableCell><TableCell align="right" sx={{ fontSize: 11, color: "#DC2626", fontWeight: 800 }}>{target.criticalBelow}%</TableCell><TableCell align="right" sx={{ fontSize: 11, color: "#059669", fontWeight: 800 }}>{target.healthyAtOrAbove}%</TableCell><TableCell align="right" sx={{ fontSize: 11, fontWeight: 800 }}>{targetPreview?.variance == null ? "—" : `${targetPreview.variance > 0 ? "+" : ""}${targetPreview.variance}%`}</TableCell><TableCell><Chip size="small" label={status === "ONFLOW" ? "IN FLOW" : status} sx={{ height: 20, fontSize: 8, fontWeight: 800 }} /></TableCell><TableCell><Tooltip title="Remove target"><IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); removeTarget(index); }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip></TableCell></TableRow>; })}{!targets.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748B" }}>Add your first target using the form.</TableCell></TableRow>}</TableBody></Table></TableContainer>
          </Box>
        </Box>
      </>}
    </Stack></DialogContent>
    <DialogActions sx={{ p: 2, borderTop: "1px solid #E2E8F0" }}>{saveAttempted && !targets.length && <Typography sx={{ mr: "auto", color: "#DC2626", fontSize: 12, fontWeight: 700 }}>Add at least one target before saving the KPI.</Typography>}{saveAttempted && targets.length > 0 && !canSave && <Typography sx={{ mr: "auto", color: "#DC2626", fontSize: 12, fontWeight: 700 }}>Review the KPI name and target validation errors.</Typography>}<Button onClick={onClose} disabled={saving}>Cancel</Button>{allowed && <Button variant="contained" disabled={saving} onClick={submit} sx={!canSave ? { bgcolor: "#CBD5E1", color: "#475569", "&:hover": { bgcolor: "#94A3B8" } } : undefined}>{saving ? "Saving..." : isEdit ? "Update KPI" : "Create KPI"}</Button>}</DialogActions>
  </Dialog>;
}

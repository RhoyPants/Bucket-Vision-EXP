"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Pagination, Stack, Switch, TextField, Typography } from "@mui/material";
import { ActionPayload, ActionUpdate, IncidentAction, incidentCaseService } from "@/app/api-service/incidentCaseService";
import { Incident } from "@/app/api-service/incidentService";
import { LookupOption, Page, workflowError } from "@/app/api-service/incidentManagementService";
import { dueDateInput } from "@/app/utils/incidentCase";
import IncidentEvidence from "./IncidentEvidence";
import IncidentAcknowledgements from "./IncidentAcknowledgements";

export default function IncidentActions({ incident, initial, initialActionId, onChanged }: { incident: Incident; initial: Page<IncidentAction>; initialActionId?: string; onChanged: () => Promise<void> }) {
  const [result, setResult] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState<{ action?: IncidentAction } | null>(null);
  const locatedDeepLink = useRef(false);
  const load = async (next = page) => {
    setLoading(true);
    try { setResult(await incidentCaseService.actions(incident.id, next)); setError(""); }
    catch (err) { setError(workflowError(err).message); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let alive = true;
    setLoading(true);
    incidentCaseService.actions(incident.id, page).then((value) => { if (alive) { setResult(value); setError(""); } }).catch((err) => { if (alive) setError(workflowError(err).message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [incident.id, page, retry]);
  useEffect(() => {
    if (!initialActionId || locatedDeepLink.current) return;
    const action = result.data.find((item) => item.id === initialActionId);
    if (action) { locatedDeepLink.current = true; return; }
    if (result.pagination.totalPages <= 1) return;
    let alive = true;
    void (async () => {
      for (let next = 2; next <= result.pagination.totalPages; next += 1) {
        const candidatePage = await incidentCaseService.actions(incident.id, next);
        const candidate = candidatePage.data.find((item) => item.id === initialActionId);
        if (candidate && alive) {
          locatedDeepLink.current = true;
          setPage(next);
          return;
        }
      }
    })().catch((err) => { if (alive) setError(workflowError(err).message); });
    return () => { alive = false; };
  }, [incident.id, initialActionId, result.data, result.pagination.totalPages]);
  useEffect(() => {
    if (!initialActionId || !result.data.some((item) => item.id === initialActionId)) return;
    const timer = window.setTimeout(() => document.getElementById(`incident-action-${initialActionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => window.clearTimeout(timer);
  }, [initialActionId, result.data]);
  const pending = incident.status === "PENDING";
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" gap={2}><Typography fontWeight={700}>Corrective & preventive actions</Typography>{pending && incident.permissions?.canCreateAction && <Button variant="contained" onClick={() => setForm({})}>Add Action</Button>}</Stack>
    {error && <Alert severity="error" action={<Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
    {loading ? <CircularProgress size={24} /> : !result.data.length ? <Typography color="text.secondary">No actions recorded.</Typography> : result.data.map((action) => {
      const isAssignedTarget = action.id === initialActionId;
      const actionAttachments = [...(incident.attachments || []), ...(action.evidence || [])].filter((attachment, index, all) => all.findIndex((item) => item.id === attachment.id) === index);
      const canManageActionEvidence = action.permissions.canManageEvidence !== undefined
        ? action.permissions.canManageEvidence
        : action.permissions.canUpdateProgress || action.permissions.canComplete || Boolean(incident.permissions?.canManageEvidence);
      return <Box id={`incident-action-${action.id}`} key={action.id} sx={{ p: 2, border: "1px solid", borderColor: isAssignedTarget ? "primary.main" : "divider", borderRadius: 2, bgcolor: isAssignedTarget ? "#F5F3FF" : "background.paper", boxShadow: isAssignedTarget ? "0 0 0 3px rgba(79,70,229,.12)" : "none", animation: isAssignedTarget ? "assignedActionPulse 900ms ease-in-out 2" : "none", "@keyframes assignedActionPulse": { "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 3px rgba(79,70,229,.12)" }, "50%": { transform: "scale(1.012)", boxShadow: "0 0 0 7px rgba(79,70,229,.18)" } } }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}><Stack direction="row" gap={1} alignItems="center"><Typography fontWeight={700}>{action.title}</Typography>{isAssignedTarget && <Chip size="small" color="primary" label="Assigned to you" />}</Stack><Stack direction="row" gap={1}><Chip size="small" label={action.status.replaceAll("_", " ")} color={action.status === "COMPLETED" ? "success" : "default"} />{action.requiredForResolution && <Chip size="small" label="Required for resolution" variant="outlined" />}</Stack></Stack>
        <Typography variant="body2">{action.description}</Typography>
        <Typography variant="body2" color={action.isOverdue ? "error" : "text.secondary"}>{action.actionType} · {action.owner?.name || "Assigned owner"} · {dueDateInput(action.dueDate) ? `Due ${dueDateInput(action.dueDate)}` : "No due date"}{action.isOverdue && dueDateInput(action.dueDate) ? " · Overdue" : ""}</Typography>
        {action.completionRemarks && <Typography variant="body2">Completion: {action.completionRemarks}</Typography>}
        {action.cancellationReason && <Typography variant="body2">Cancellation: {action.cancellationReason}</Typography>}
        {action.status === "CANCELLED" && action.requiredForResolution && <Alert severity="warning">This cancelled action still blocks resolution until an authorized resolver removes its requirement with a reason.</Alert>}
        <IncidentEvidence incidentId={incident.id} section="ACTION" actionId={action.id} attachments={actionAttachments} canManage={pending && canManageActionEvidence} onChanged={onChanged} />
        <IncidentAcknowledgements incidentId={incident.id} resourceType="INCIDENT_ACTION" actionId={action.id} title="Action-owner acknowledgement" />
        {pending && Object.values(action.permissions).some(Boolean) && <Button variant="outlined" sx={{ alignSelf: "flex-end" }} onClick={() => setForm({ action })}>Update action</Button>}
      </Stack>
    </Box>; })}
    {result.pagination.totalPages > 1 && <Pagination page={page} count={result.pagination.totalPages} onChange={(_, value) => setPage(value)} />}
    {form && <ActionForm incident={incident} action={form.action} onClose={() => setForm(null)} onSaved={async () => { setForm(null); await Promise.all([load(), onChanged()]); }} />}
  </Stack>;
}

function ActionForm({ incident, action, onClose, onSaved }: { incident: Incident; action?: IncidentAction; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<ActionPayload>(action ? { title: action.title, description: action.description || "", actionType: action.actionType, ownerId: action.ownerId, dueDate: dueDateInput(action.dueDate), requiredForResolution: action.requiredForResolution } : { title: "", description: "", actionType: "CORRECTIVE", ownerId: "", dueDate: "", requiredForResolution: true });
  const [status, setStatus] = useState<IncidentAction["status"]>(action?.status || "PENDING");
  const [remarks, setRemarks] = useState(action?.completionRemarks || "");
  const [cancelReason, setCancelReason] = useState("");
  const [requirementReason, setRequirementReason] = useState("");
  const [owners, setOwners] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stale, setStale] = useState(false);
  const canEdit = !action ? Boolean(incident.permissions?.canCreateAction) : action.permissions.canEdit;
  useEffect(() => {
    let alive = true;
    if (!canEdit) return;
    setLoading(true);
    incidentCaseService.owners(incident.id).then((items) => { if (alive) setOwners(items); }).catch((err) => { if (alive) setError(workflowError(err).message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [incident.id, canEdit]);
  const save = async () => {
    if (canEdit && (!draft.title.trim() || !draft.ownerId || !draft.dueDate)) { setError("Enter a title, owner, and due date."); return; }
    if (action && draft.requiredForResolution !== action.requiredForResolution && !requirementReason.trim()) { setError("Explain the change to the resolution requirement."); return; }
    if (action && status !== action.status && ((status === "COMPLETED" && !remarks.trim()) || (status === "CANCELLED" && !cancelReason.trim()))) { setError("Provide completion remarks or a cancellation reason."); return; }
    setBusy(true); setError("");
    try {
      if (!action) await incidentCaseService.createAction(incident.id, { ...draft, title: draft.title.trim() });
      else {
        const payload: ActionUpdate = { revision: action.revision };
        if (canEdit) Object.entries(draft).forEach(([key, value]) => {
          const previous = key === "dueDate" ? dueDateInput(action.dueDate) : action[key as keyof ActionPayload];
          if (previous !== value) Object.assign(payload, { [key]: value });
        });
        if (draft.requiredForResolution !== action.requiredForResolution) payload.requirementChangeReason = requirementReason.trim();
        if (status !== action.status) {
          payload.status = status;
          if (status === "COMPLETED") payload.completionRemarks = remarks.trim();
          if (status === "CANCELLED") payload.cancellationReason = cancelReason.trim();
        }
        if (Object.keys(payload).length > 1) await incidentCaseService.updateAction(incident.id, action.id, payload);
      }
      await onSaved();
    } catch (err) { const failure = workflowError(err); setError(failure.message); setFields(failure.fields); setStale(failure.code === "STALE_REVISION"); }
    finally { setBusy(false); }
  };
  const field = (key: string) => ({ error: Boolean(fields[key]), helperText: fields[key] });
  return <Dialog open fullWidth maxWidth="sm" onClose={() => !busy && onClose()}><DialogTitle>{action ? "Update assigned corrective action" : "Create action"}</DialogTitle><DialogContent dividers><Stack spacing={2}>
    {action && <Alert severity="info">Review this assigned action and update its current status.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    {stale && <Alert severity="warning" action={<Button onClick={onSaved}>Reload actions</Button>}>This action changed. Reload and review it before editing again. Your unsaved changes will be discarded.</Alert>}
    <TextField label="Title" required value={draft.title} disabled={!canEdit || busy || stale} onChange={(e) => setDraft({ ...draft, title: e.target.value })} {...field("title")} />
    <TextField label="Description" multiline minRows={2} value={draft.description} disabled={!canEdit || busy || stale} onChange={(e) => setDraft({ ...draft, description: e.target.value })} {...field("description")} />
    <TextField select label="Action type" value={draft.actionType} disabled={!canEdit || busy || stale} onChange={(e) => setDraft({ ...draft, actionType: e.target.value as ActionPayload["actionType"] })}><MenuItem value="CORRECTIVE">Corrective</MenuItem><MenuItem value="PREVENTIVE">Preventive</MenuItem></TextField>
    <Autocomplete options={owners} loading={loading} disabled={!canEdit || busy || stale} value={owners.find((owner) => owner.id === draft.ownerId) || (action?.ownerId === draft.ownerId ? { id: action.ownerId, name: action.owner?.name || "Assigned owner" } : null)} getOptionLabel={(owner) => owner.name} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, owner) => setDraft({ ...draft, ownerId: owner?.id || "" })} renderInput={(params) => <TextField {...params} label="Owner" required {...field("ownerId")} />} />
    <TextField label="Due date (project local)" type="date" value={draft.dueDate} disabled={!canEdit || busy || stale} slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} {...field("dueDate")} />
    <FormControlLabel label="Required for incident resolution" control={<Switch checked={draft.requiredForResolution} disabled={!canEdit || busy || stale} onChange={(_, checked) => setDraft({ ...draft, requiredForResolution: checked })} />} />
    {action && draft.requiredForResolution !== action.requiredForResolution && <TextField required label="Reason for requirement change" multiline value={requirementReason} onChange={(e) => setRequirementReason(e.target.value)} {...field("requirementChangeReason")} />}
    {action && <TextField select label="Status" disabled={busy || stale} value={status} onChange={(e) => setStatus(e.target.value as IncidentAction["status"])}><MenuItem value={action.status}>{action.status.replaceAll("_", " ")}</MenuItem>{action.status !== "IN_PROGRESS" && action.permissions.canUpdateProgress && <MenuItem value="IN_PROGRESS">In progress</MenuItem>}{action.status !== "COMPLETED" && action.permissions.canComplete && <MenuItem value="COMPLETED">Completed</MenuItem>}{action.status !== "CANCELLED" && action.permissions.canCancel && <MenuItem value="CANCELLED">Cancelled</MenuItem>}</TextField>}
    {status === "COMPLETED" && action?.status !== status && <TextField required label="Completion remarks" multiline value={remarks} onChange={(e) => setRemarks(e.target.value)} {...field("completionRemarks")} />}
    {status === "CANCELLED" && action?.status !== status && <TextField required label="Cancellation reason" multiline value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} {...field("cancellationReason")} />}
  </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button><Button variant="contained" disabled={busy || stale || loading} onClick={save}>{busy ? "Saving…" : "Save action"}</Button></DialogActions></Dialog>;
}

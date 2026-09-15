"use client";

import { useEffect, useState } from "react";
import { Add, ArrowDownward, ArrowUpward, DeleteOutline } from "@mui/icons-material";
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { activeNotificationMatrices, activeWorkflows, assignmentOptions, AssignmentType, Criticality, DurationUnit, IncidentType, IncidentTypePayload, IncidentWorkflow, IncidentWorkflowPayload, LookupOption, NotificationLevel, NotificationMatrix, NotificationMatrixPayload, incidentTypeService, incidentWorkflowService, notificationMatrixService, serializeNotificationLevels, serializeWorkflowLevels, validateNotificationMatrix, validateWorkflow, WorkflowLevel, workflowError } from "@/app/api-service/incidentManagementService";
import type { IncidentLibrary } from "./IncidentManagement";

const assignmentLabels: Record<AssignmentType, string> = { REQUESTER_BU_HEAD: "Incident Creator's BU Head", PROJECT_BU_HEAD: "Project's BU Head", PROJECT_OWNER: "Project Owner", ROLE: "Selected Role", SPECIFIC_USER: "Specific User" };
const workflowLevel = (): WorkflowLevel => ({ order: 1, assignmentType: "REQUESTER_BU_HEAD", completionRule: "ANY_ONE", slaValue: 3, slaUnit: "DAYS", isFinal: true });
const notificationLevel = (): NotificationLevel => ({ order: 1, assignmentType: "ROLE", notifyAfterValue: 0, notifyAfterUnit: "DAYS" });

export default function IncidentManagementForm(props: { kind: IncidentLibrary; id?: string; readOnly?: boolean; onClose: () => void; onSaved: (warning?: string) => void }) {
  if (props.kind === "types") return <TypeForm {...props} kind="types" />;
  return <LevelLibraryForm {...props} kind={props.kind} />;
}

function TypeForm({ id, readOnly = false, onClose, onSaved }: { kind: "types"; id?: string; readOnly?: boolean; onClose: () => void; onSaved: (warning?: string) => void }) {
  const empty: IncidentTypePayload = { name: "", description: "", defaultCriticality: "MEDIUM", incidentWorkflowId: "", resolutionSlaValue: 1, resolutionSlaUnit: "DAYS", notificationMatrixId: "", isActive: true };
  const [draft, setDraft] = useState(empty);
  const [original, setOriginal] = useState<IncidentType | null>(null);
  const [workflows, setWorkflows] = useState<IncidentWorkflow[]>([]);
  const [notifications, setNotifications] = useState<NotificationMatrix[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [fields, setFields] = useState<Record<string, string>>({}); const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true; setLoading(true); setError("");
    void Promise.all([id ? incidentTypeService.get(id) : null, readOnly ? [] : activeWorkflows(), readOnly ? [] : activeNotificationMatrices()]).then(([item, workflowItems, notificationItems]) => {
      if (!alive) return; setOriginal(item); if (item) setDraft({ name: item.name, description: item.description || "", defaultCriticality: item.defaultCriticality, incidentWorkflowId: item.incidentWorkflowId, resolutionSlaValue: item.resolutionSlaValue, resolutionSlaUnit: item.resolutionSlaUnit, notificationMatrixId: item.notificationMatrixId, isActive: item.isActive }); setWorkflows(workflowItems); setNotifications(notificationItems);
    }).catch((err) => { if (alive) setError(workflowError(err).message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; };
  }, [id, readOnly, reload]);
  const workflowChoices = original?.incidentWorkflow && !workflows.some((item) => item.id === original.incidentWorkflowId) ? [...workflows, original.incidentWorkflow as IncidentWorkflow] : workflows;
  const notificationChoices = original?.notificationMatrix && !notifications.some((item) => item.id === original.notificationMatrixId) ? [...notifications, original.notificationMatrix as NotificationMatrix] : notifications;
  const save = async () => {
    const validation: Record<string, string> = {};
    if (!draft.name.trim()) validation.name = "Enter an incident type name.";
    if (!draft.incidentWorkflowId) validation.incidentWorkflowId = "Select an active workflow.";
    if (!draft.notificationMatrixId) validation.notificationMatrixId = "Select an active notification matrix.";
    if (!draft.resolutionSlaUnit || !draft.resolutionSlaValue || draft.resolutionSlaValue <= 0 || draft.resolutionSlaValue > 36500 || (draft.resolutionSlaUnit === "DAYS" && !Number.isInteger(draft.resolutionSlaValue))) validation.resolutionSlaValue = "Enter a positive SLA up to 36500; working days must be whole numbers.";
    setFields(validation); if (Object.keys(validation).length) return;
    setSaving(true); setError("");
    try {
      const payload = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
      const changes = original ? Object.fromEntries(Object.entries(payload).filter(([key, value]) => value !== (key === "description" ? original.description || "" : original[key as keyof IncidentType]))) as Partial<IncidentTypePayload> : payload;
      const result = !id || !original
        ? await incidentTypeService.create(payload)
        : Object.keys(changes).length ? await incidentTypeService.update(id, changes) : original;
      onSaved(result.slaWarning?.message);
    } catch (err) { const failure = workflowError(err); setError(failure.message); setFields(failure.fields); }
    finally { setSaving(false); }
  };
  const field = (key: string) => ({ error: Boolean(fields[key]), helperText: fields[key] });
  return <Shell title={`${readOnly ? "View" : id ? "Edit" : "Create"} Incident Type`} loading={loading} saving={saving} readOnly={readOnly} error={error} onClose={onClose} onSave={save} saveLabel={id ? "Save changes" : "Create Incident Type"} retry={() => setReload((value) => value + 1)}>
    <TextField label="Incident type name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} {...field("name")} />
    <TextField label="Description" multiline minRows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
    <TextField select label="Default criticality" required value={draft.defaultCriticality} onChange={(e) => setDraft({ ...draft, defaultCriticality: e.target.value as Criticality })}>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
    <Autocomplete options={workflowChoices} value={workflowChoices.find((item) => item.id === draft.incidentWorkflowId) || null} getOptionLabel={(item) => `${item.name}${item.isActive ? "" : " (inactive)"}`} getOptionDisabled={(item) => !item.isActive} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, item) => setDraft({ ...draft, incidentWorkflowId: item?.id || "" })} renderInput={(params) => <TextField {...params} required label="Incident Report Workflow" {...field("incidentWorkflowId")} />} />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Overall resolution SLA" required type="number" value={draft.resolutionSlaValue} onChange={(e) => setDraft({ ...draft, resolutionSlaValue: Number(e.target.value) })} {...field("resolutionSlaValue")} /><TextField fullWidth select label="SLA unit" value={draft.resolutionSlaUnit} onChange={(e) => setDraft({ ...draft, resolutionSlaUnit: e.target.value as DurationUnit })}><MenuItem value="DAYS">Working days</MenuItem><MenuItem value="HOURS">Elapsed hours</MenuItem></TextField></Stack>
    <Autocomplete options={notificationChoices} value={notificationChoices.find((item) => item.id === draft.notificationMatrixId) || null} getOptionLabel={(item) => `${item.name}${item.isActive ? "" : " (inactive)"}`} getOptionDisabled={(item) => !item.isActive} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, item) => setDraft({ ...draft, notificationMatrixId: item?.id || "" })} renderInput={(params) => <TextField {...params} required label="Escalation Notification Matrix" {...field("notificationMatrixId")} />} />
    <Alert severity="info">The overall SLA starts when the incident is submitted. If breached, the selected notification matrix starts without changing workflow responsibility.</Alert>
    <FormControlLabel control={<Switch checked={draft.isActive} onChange={(_, checked) => setDraft({ ...draft, isActive: checked })} />} label="Active" />
  </Shell>;
}

function LevelLibraryForm({ kind, id, readOnly = false, onClose, onSaved }: { kind: "workflows" | "notifications"; id?: string; readOnly?: boolean; onClose: () => void; onSaved: (warning?: string) => void }) {
  const isWorkflow = kind === "workflows";
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [isActive, setIsActive] = useState(true); const [peer, setPeer] = useState(true);
  const [levels, setLevels] = useState<(WorkflowLevel | NotificationLevel)[]>([isWorkflow ? workflowLevel() : notificationLevel()]);
  const [original, setOriginal] = useState<IncidentWorkflow | NotificationMatrix | null>(null);
  const [roles, setRoles] = useState<LookupOption[]>([]); const [users, setUsers] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [fields, setFields] = useState<Record<string, string>>({}); const [stale, setStale] = useState(false); const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true; setLoading(true); setError("");
    const service = isWorkflow ? incidentWorkflowService : notificationMatrixService;
    void Promise.all([id ? service.get(id) : null, readOnly ? [] : assignmentOptions("roles"), readOnly ? [] : assignmentOptions("users")]).then(([item, roleItems, userItems]) => {
      if (!alive) return; setOriginal(item); setRoles(roleItems); setUsers(userItems); if (item) { setName(item.name); setDescription(item.description || ""); setIsActive(item.isActive); setLevels(item.levels); if ("allowPeerResolution" in item) setPeer(item.allowPeerResolution); } setStale(false);
    }).catch((err) => { if (alive) setError(workflowError(err).message); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; };
  }, [id, isWorkflow, readOnly, reload]);
  const move = (index: number, direction: number) => { const next = [...levels]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; setLevels(next); };
  const edit = (index: number, changes: Record<string, unknown>) => setLevels((items) => items.map((item, current) => current === index ? { ...item, ...changes } as WorkflowLevel | NotificationLevel : item));
  const save = async () => {
    const common = { name: name.trim(), description: description.trim(), isActive };
    const payload = isWorkflow ? { ...common, allowPeerResolution: peer, levels: serializeWorkflowLevels(levels as WorkflowLevel[]) } : { ...common, levels: serializeNotificationLevels(levels as NotificationLevel[]) };
    const validation = isWorkflow ? validateWorkflow(payload as IncidentWorkflowPayload) : validateNotificationMatrix(payload as NotificationMatrixPayload); setFields(validation); if (Object.keys(validation).length) return;
    setSaving(true); setError("");
    try {
      const service = isWorkflow ? incidentWorkflowService : notificationMatrixService;
      if (id && original) await service.update(id, { ...payload, version: original.version } as never); else await service.create(payload as never); onSaved();
    } catch (err) { const failure = workflowError(err); setError(failure.message); setFields(failure.fields); setStale(failure.code === "STALE_VERSION"); }
    finally { setSaving(false); }
  };
  return <Shell title={`${readOnly ? "View" : id ? "Edit" : "Create"} ${isWorkflow ? "Incident Report Workflow" : "Escalation Notification Matrix"}`} loading={loading} saving={saving} readOnly={readOnly} error={error} stale={stale} onClose={onClose} onSave={save} saveLabel={id ? "Save changes" : isWorkflow ? "Create Workflow" : "Create Notification Matrix"} retry={() => setReload((value) => value + 1)}>
    <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={Boolean(fields.name)} helperText={fields.name} /><TextField label="Description" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} /><FormControlLabel control={<Switch checked={isActive} onChange={(_, value) => setIsActive(value)} />} label="Active" />
    {isWorkflow && <><FormControlLabel control={<Switch checked={peer} onChange={(_, value) => setPeer(value)} />} label="Allow peer completion" /><Alert severity="info">When a level SLA expires, it becomes overdue and keeps the same resolver. Completion, not SLA expiry, activates the next workflow level.</Alert></>}
    {!isWorkflow && <Alert severity="info">This matrix starts only after the Incident Type’s overall SLA is breached. Recipients receive notification visibility only and cannot process the workflow.</Alert>}
    <Typography fontWeight={700}>{isWorkflow ? "Workflow levels" : "Notification levels"}</Typography>{fields.levels && <Alert severity="error">{fields.levels}</Alert>}
    {levels.map((level, index) => <LevelCard key={level.id || index} level={level} index={index} total={levels.length} isWorkflow={isWorkflow} roles={roles} users={users} readOnly={readOnly || stale} fields={fields} onEdit={(changes) => edit(index, changes)} onMove={(direction) => move(index, direction)} onRemove={() => setLevels(levels.filter((_, item) => item !== index))} />)}
    {!readOnly && <Button variant="outlined" startIcon={<Add />} disabled={stale} onClick={() => setLevels([...levels, isWorkflow ? workflowLevel() : { ...notificationLevel(), notifyAfterValue: 1 }])}>Add level</Button>}
  </Shell>;
}

function LevelCard({ level, index, total, isWorkflow, roles, users, readOnly, fields, onEdit, onMove, onRemove }: { level: WorkflowLevel | NotificationLevel; index: number; total: number; isWorkflow: boolean; roles: LookupOption[]; users: LookupOption[]; readOnly: boolean; fields: Record<string, string>; onEdit: (changes: Record<string, unknown>) => void; onMove: (direction: number) => void; onRemove: () => void }) {
  const prefix = `levels[${index}]`; const isFinal = index === total - 1; const choiceKey = level.assignmentType === "ROLE" ? "roleId" : "userId"; const choices = choiceKey === "roleId" ? roles : users; const selected = level[choiceKey];
  const allowed = (isWorkflow ? ["REQUESTER_BU_HEAD", "PROJECT_BU_HEAD", "PROJECT_OWNER", "ROLE", "SPECIFIC_USER"] : ["ROLE", "SPECIFIC_USER"]) as AssignmentType[];
  const field = (key: string) => ({ error: Boolean(fields[`${prefix}.${key}`]), helperText: fields[`${prefix}.${key}`] });
  return <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#fafbff" }}><Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between"><Stack direction="row" gap={1}><Typography fontWeight={700}>Level {index + 1}</Typography>{isFinal && <Chip size="small" label="Final" color="primary" variant="outlined" />}</Stack>{!readOnly && <Box><Tooltip title="Move up"><span><IconButton disabled={index === 0} onClick={() => onMove(-1)}><ArrowUpward fontSize="small" /></IconButton></span></Tooltip><Tooltip title="Move down"><span><IconButton disabled={isFinal} onClick={() => onMove(1)}><ArrowDownward fontSize="small" /></IconButton></span></Tooltip><Tooltip title="Remove"><span><IconButton disabled={total === 1} onClick={onRemove}><DeleteOutline fontSize="small" /></IconButton></span></Tooltip></Box>}</Stack>
    <TextField select label={isWorkflow ? "Responsible party" : "Notification recipient"} value={level.assignmentType} onChange={(e) => onEdit({ assignmentType: e.target.value, roleId: undefined, userId: undefined })}>{allowed.map((value) => <MenuItem key={value} value={value}>{assignmentLabels[value]}</MenuItem>)}</TextField>
    {(level.assignmentType === "ROLE" || level.assignmentType === "SPECIFIC_USER") && <Autocomplete options={choices} value={choices.find((item) => item.id === selected) || (selected ? { id: selected, name: ("responsiblePartyLabel" in level ? level.responsiblePartyLabel : (level as NotificationLevel).recipientLabel) || "Previously selected" } : null)} isOptionEqualToValue={(a, b) => a.id === b.id} getOptionLabel={(item) => item.name} onChange={(_, item) => onEdit({ [choiceKey]: item?.id })} renderInput={(params) => <TextField {...params} required label={choiceKey === "roleId" ? "Role" : "User"} {...field(choiceKey)} />} />}
    {isWorkflow ? <><TextField select label="Completion rule" value={(level as WorkflowLevel).completionRule} onChange={(e) => onEdit({ completionRule: e.target.value })}><MenuItem value="ANY_ONE">Any one</MenuItem><MenuItem value="ALL">All eligible users</MenuItem></TextField><DurationFields value={(level as WorkflowLevel).slaValue} unit={(level as WorkflowLevel).slaUnit} label="Level SLA" prefix="sla" field={field} onEdit={onEdit} /></> : <DurationFields value={(level as NotificationLevel).notifyAfterValue} unit={(level as NotificationLevel).notifyAfterUnit} label={index === 0 ? "Notify after overall SLA breach" : "Notify after previous level"} prefix="notifyAfter" field={field} onEdit={onEdit} />}
  </Stack></Box>;
}
function DurationFields({ value, unit, label, prefix, field, onEdit }: { value: number | null; unit: DurationUnit | null; label: string; prefix: "sla" | "notifyAfter"; field: (key: string) => { error: boolean; helperText?: string }; onEdit: (changes: Record<string, unknown>) => void }) {
  return <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth required type="number" label={label} value={value ?? ""} onChange={(e) => onEdit({ [`${prefix}Value`]: e.target.value === "" ? null : Number(e.target.value) })} {...field(`${prefix}Value`)} /><TextField fullWidth required select label="Unit" value={unit || ""} onChange={(e) => onEdit({ [`${prefix}Unit`]: e.target.value })} {...field(`${prefix}Unit`)}><MenuItem value="DAYS">Working days</MenuItem><MenuItem value="HOURS">Elapsed hours</MenuItem></TextField></Stack>;
}
function Shell({ title, loading, saving, readOnly, error, stale = false, onClose, onSave, saveLabel, retry, children }: { title: string; loading: boolean; saving: boolean; readOnly: boolean; error: string; stale?: boolean; onClose: () => void; onSave: () => void; saveLabel: string; retry: () => void; children: React.ReactNode }) {
  return <Dialog open fullWidth maxWidth="md" onClose={() => !saving && onClose()}><DialogTitle>{title}</DialogTitle><DialogContent dividers>{loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box> : <Stack spacing={2.5}>{error && <Alert severity="error" action={stale ? <Button color="inherit" onClick={retry}>Reload latest</Button> : undefined}>{error}</Alert>}<Box component="fieldset" disabled={readOnly || saving || stale} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>{children}</Box></Stack>}</DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>{readOnly ? "Close" : "Cancel"}</Button>{!readOnly && <Button variant="contained" disabled={loading || saving || stale} onClick={onSave}>{saving ? "Saving…" : saveLabel}</Button>}</DialogActions></Dialog>;
}

"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Autocomplete, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Add, ArrowForward, AttachFile, LocationOnOutlined } from "@mui/icons-material";
import { Incident, IncidentSeverity, incidentService } from "@/app/api-service/incidentService";
import { IncidentType, selectableIncidentTypes, workflowError } from "@/app/api-service/incidentManagementService";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import { useAppDispatch } from "@/app/redux/hook";
import { manilaInput, manilaTimestamp } from "@/app/utils/incidentCase";
import IncidentCaseDetail from "./IncidentCaseDetail";
import { incidentDate } from "./IncidentEscalationPanel";
import { useRouter, useSearchParams } from "next/navigation";
import type { IncidentDetailTab } from "./IncidentCaseDetail";
import ConfirmationModal from "@/app/components/shared/modals/ConfirmationModal";

type Scope = { id: string; name: string; tasks?: { id: string; title: string; subtasks?: { id: string; title: string }[] }[] };
const emptyForm = { incidentTypeId: "", title: "", description: "", occurredAt: "", location: "", immediateActionTaken: "", reportRecipient: "", scopeId: "", taskId: "", subtaskId: "" };

export default function ProjectIncidentReports({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedIncidentId = searchParams.get("incidentId") || "";
  const requestedTab = searchParams.get("incidentTab");
  const initialTab: IncidentDetailTab = requestedTab === "investigation" || requestedTab === "actions" || requestedTab === "workflow" || requestedTab === "history" ? requestedTab : "overview";
  const initialActionId = searchParams.get("actionId") || undefined;
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [dateOrder, setDateOrder] = useState("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const listScrollPosition = useRef(0);
  const dismissedLinkedIncident = useRef("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        incidentService.list(projectId, { status: status || undefined, severity: severity || undefined }),
        dispatch(getProjectFull(projectId, { preferCache: true })),
      ]);
      const [list, project] = results;
      if (list.status === "fulfilled") setIncidents(list.value.incidents);
      if (project.status === "fulfilled") setScopes((project.value?.scopes || []) as unknown as Scope[]);
      const failures = results.filter((item) => item.status === "rejected");
      setError(failures.map((item) => workflowError(item.reason).message).join(" "));
    } finally { setLoading(false); }
  }, [projectId, dispatch, status, severity]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!linkedIncidentId || dismissedLinkedIncident.current === linkedIncidentId || selected?.id === linkedIncidentId) return;
    let alive = true;
    void incidentService.get(linkedIncidentId).then((incident) => {
      if (alive) setSelected(incident);
    }).catch((err) => {
      if (alive) setError(workflowError(err).message);
    });
    return () => { alive = false; };
  }, [linkedIncidentId, selected?.id]);
  useEffect(() => {
    let alive = true;
    if (!formOpen) return;
    setTypesLoading(true); setTypes([]);
    selectableIncidentTypes(projectId).then((items) => { if (alive) setTypes(items); }).catch((err) => { if (alive) setError(workflowError(err).message); }).finally(() => { if (alive) setTypesLoading(false); });
    return () => { alive = false; };
  }, [projectId, formOpen, retry]);
  const tasks = scopes.find((scope) => scope.id === form.scopeId)?.tasks || [];
  const subtasks = tasks.find((task) => task.id === form.taskId)?.subtasks || [];
  const visible = useMemo(() => incidents.filter((incident) => [incident.title, incident.description, incident.incidentNumber, incident.reportedBy?.name, incident.location].some((value) => value?.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => (dateOrder === "newest" ? -1 : 1) * (new Date(a.dateRaised).getTime() - new Date(b.dateRaised).getTime())), [incidents, search, dateOrder]);
  const validate = () => {
    const validation: Record<string, string> = {};
    if (!types.some((type) => type.id === form.incidentTypeId)) validation.incidentTypeId = "Select an available incident type.";
    if (form.title.trim().length < 3) validation.title = "Enter at least three characters.";
    if (form.description.trim().length < 5) validation.description = "Enter at least five characters.";
    if (!form.location.trim()) validation.location = "Enter the incident location.";
    let occurredAt = "";
    try { occurredAt = manilaTimestamp(form.occurredAt); } catch { validation.occurredAt = "Enter a valid incident date and time."; }
    setFields(validation);
    return { valid: Object.keys(validation).length === 0, occurredAt };
  };
  const requestSubmit = () => {
    const result = validate();
    if (!result.valid) return;
    setConfirmSubmitOpen(true);
  };
  const save = async () => {
    const { valid, occurredAt } = validate();
    if (!valid) { setConfirmSubmitOpen(false); return; }
    setSaving(true); setError("");
    try {
      const created = await incidentService.create({
        projectId, incidentTypeId: form.incidentTypeId, title: form.title.trim(), description: form.description.trim(),
        occurredAt, location: form.location.trim(), immediateActionTaken: form.immediateActionTaken.trim() || undefined, reportRecipient: form.reportRecipient.trim() || undefined,
        scopeId: form.scopeId || null, taskId: form.taskId || null, subtaskId: form.subtaskId || null,
      }, files);
      setConfirmSubmitOpen(false); setFormOpen(false); setSelected(created); await load();
    } catch (err) { const failure = workflowError(err); setConfirmSubmitOpen(false); setError(failure.message); setFields(failure.fields); }
    finally { setSaving(false); }
  };
  const openDetail = async (id: string) => {
    if (openingId) return;
    listScrollPosition.current = window.scrollY;
    setOpeningId(id); setError("");
    try { setSelected(await incidentService.get(id)); } catch (err) { setError(workflowError(err).message); }
    finally { setOpeningId(null); }
  };
  const chooseFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = "";
    if (selectedFiles.length > 10) { setError("An incident can have at most ten attachments."); return; }
    setFiles(selectedFiles);
  };
  if (selected) return <Box sx={{ p: { xs: 1.5, md: 2.5 }, minWidth: 0, mx: "auto" }}><IncidentCaseDetail key={`${selected.id}-${initialTab}-${initialActionId || ""}`} initial={selected} initialTab={initialTab} initialActionId={initialActionId} onClose={(latest) => {
    setIncidents((items) => items.map((item) => item.id === latest.id ? { ...item, ...latest } : item));
    setSelected(null);
    if (linkedIncidentId) {
      dismissedLinkedIncident.current = linkedIncidentId;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("incidentId"); params.delete("incidentTab"); params.delete("actionId");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
    requestAnimationFrame(() => window.scrollTo({ top: listScrollPosition.current, behavior: "instant" }));
  }} onUpdated={(updated) => { setSelected(updated); setIncidents((items) => items.map((item) => item.id === updated.id ? updated : item)); }} /></Box>;

  return <Box sx={{ p: { xs: 1, md: 2 }, minWidth: 0, mx: "auto" }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Box><Typography variant="h5" fontWeight={700}>Incident Reports</Typography><Typography variant="body2" color="text.secondary">Report incidents, investigate findings, and track corrective actions.</Typography></Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ ...emptyForm, occurredAt: manilaInput(new Date().toISOString()) }); setFiles([]); setFields({}); setError(""); setFormOpen(true); }}>Report Incident</Button>
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField fullWidth size="small" label="Search incidents" value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField select size="small" label="Status" sx={{ minWidth: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">All statuses</MenuItem>{["PENDING", "RESOLVED", "CANCELLED"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        <TextField select size="small" label="Criticality" sx={{ minWidth: 160 }} value={severity} onChange={(e) => setSeverity(e.target.value)}><MenuItem value="">All criticalities</MenuItem>{(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        <TextField select size="small" label="Sort by date" sx={{ minWidth: 160 }} value={dateOrder} onChange={(e) => setDateOrder(e.target.value)}><MenuItem value="newest">Newest first</MenuItem><MenuItem value="oldest">Oldest first</MenuItem></TextField>
      </Stack>
      {error && !formOpen && <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>{error}</Alert>}
      {loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box> : !visible.length ? <Alert severity="info">No incidents match your filters.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {visible.map((incident) => {
          const isOpening = openingId === incident.id;
          return <Card key={incident.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden", transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease", "&:hover": { borderColor: "primary.main", boxShadow: 3, transform: "translateY(-2px)" }, "&:focus-within": { borderColor: "primary.main", boxShadow: 3 } }}>
            <CardActionArea disabled={Boolean(openingId)} onClick={() => void openDetail(incident.id)} sx={{ height: "100%", alignItems: "stretch", textAlign: "left", "& .MuiCardActionArea-focusHighlight": { bgcolor: "primary.main" } }}>
              <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1.25, p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography variant="caption" fontWeight={700} color="primary.main">{incident.incidentNumber}</Typography><Chip size="small" label={incident.status} color={incident.status === "RESOLVED" ? "success" : incident.status === "PENDING" ? "warning" : "default"} /></Stack>
                <Box><Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.25}>{incident.title}</Typography>{incident.incidentType?.name && <Typography variant="caption" color="primary.main">{incident.incidentType.name}</Typography>}</Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 }}>{incident.description}</Typography>
                {incident.location && <Stack direction="row" gap={0.5} alignItems="center"><LocationOnOutlined sx={{ fontSize: 16, color: "text.secondary" }} /><Typography variant="caption" color="text.secondary" noWrap>{incident.location}</Typography></Stack>}
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Chip size="small" variant="outlined" label={incident.severity} />{incident.actionSummary && <Typography variant="caption" color="text.secondary">{incident.actionSummary.completed}/{incident.actionSummary.total} actions completed</Typography>}</Stack>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} pt={1} borderTop="1px solid" borderColor="divider"><Typography variant="caption" color="text.secondary">{incident.reportedBy?.name || "Reporter"} · {incidentDate(incident.dateRaised)}</Typography><Stack direction="row" alignItems="center" gap={0.5} color="primary.main">{isOpening ? <CircularProgress size={16} /> : <><Typography variant="caption" fontWeight={800}>View details</Typography><ArrowForward sx={{ fontSize: 16 }} /></>}</Stack></Stack>
              </CardContent>
            </CardActionArea>
          </Card>;
        })}
      </Box>}
    </Stack>
    <Dialog open={formOpen} fullWidth maxWidth="md" onClose={() => !saving && setFormOpen(false)}><DialogTitle>Report an Incident</DialogTitle><DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Autocomplete options={types} loading={typesLoading} disabled={saving || typesLoading} getOptionLabel={(type) => type.name} isOptionEqualToValue={(a, b) => a.id === b.id} value={types.find((type) => type.id === form.incidentTypeId) || null} onChange={(_, type) => setForm({ ...form, incidentTypeId: type?.id || "" })} renderInput={(params) => <TextField {...params} required label="Incident Type" error={Boolean(fields.incidentTypeId)} helperText={fields.incidentTypeId} />} />
      {!typesLoading && !types.length && <Alert severity="info" action={<Button onClick={() => setRetry((value) => value + 1)}>Reload</Button>}>No active incident types are available for this project.</Alert>}
      {form.incidentTypeId && <Alert severity="info">Criticality: {types.find((type) => type.id === form.incidentTypeId)?.defaultCriticality}. Responsibility and SLA are assigned automatically upon submission.</Alert>}
      {([["title", "Title"], ["description", "Description"], ["occurredAt", "Incident date/time · Asia/Manila"], ["location", "Location"], ["immediateActionTaken", "Immediate action taken (optional)"], ["reportRecipient", "Report recipient (optional)"]] as const).map(([key, label]) => <TextField key={key} label={label} value={form[key]} disabled={saving} required={["title", "description", "occurredAt", "location"].includes(key)} type={key === "occurredAt" ? "datetime-local" : "text"} slotProps={key === "occurredAt" ? { inputLabel: { shrink: true } } : undefined} multiline={["description", "immediateActionTaken"].includes(key)} minRows={key === "description" ? 3 : undefined} onChange={(e) => setForm({ ...form, [key]: e.target.value })} error={Boolean(fields[key])} helperText={fields[key]} />)}
      <Typography variant="body2" color="text.secondary">Related work breakdown (optional)</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField fullWidth select label="Scope" value={form.scopeId} disabled={saving} onChange={(e) => setForm({ ...form, scopeId: e.target.value, taskId: "", subtaskId: "" })}><MenuItem value="">None</MenuItem>{scopes.map((scope) => <MenuItem key={scope.id} value={scope.id}>{scope.name}</MenuItem>)}</TextField>
        <TextField fullWidth select label="Task" value={form.taskId} disabled={saving || !form.scopeId} onChange={(e) => setForm({ ...form, taskId: e.target.value, subtaskId: "" })}><MenuItem value="">None</MenuItem>{tasks.map((task) => <MenuItem key={task.id} value={task.id}>{task.title}</MenuItem>)}</TextField>
        <TextField fullWidth select label="Subtask" value={form.subtaskId} disabled={saving || !form.taskId} onChange={(e) => setForm({ ...form, subtaskId: e.target.value })}><MenuItem value="">None</MenuItem>{subtasks.map((task) => <MenuItem key={task.id} value={task.id}>{task.title}</MenuItem>)}</TextField>
      </Stack>
      <Button component="label" startIcon={<AttachFile />} variant="outlined" disabled={saving} sx={{ alignSelf: "flex-start" }}>Attach evidence<input hidden type="file" multiple onChange={chooseFiles} /></Button>
      {files.map((file, index) => <Stack key={index} direction="row" justifyContent="space-between"><Typography variant="body2">{file.name}</Typography><Button disabled={saving} onClick={() => setFiles((items) => items.filter((_, i) => i !== index))}>Remove</Button></Stack>)}
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving || typesLoading || !form.incidentTypeId} onClick={requestSubmit}>Submit Incident</Button></DialogActions></Dialog>
    <ConfirmationModal
      open={confirmSubmitOpen}
      title="Submit incident report?"
      message={`Submit “${form.title.trim()}” as an incident report? The backend will assign its criticality, workflow resolver, and SLA. ${files.length ? `${files.length} attachment${files.length === 1 ? "" : "s"} will be included.` : "No initial evidence is attached."}`}
      confirmLabel="Submit incident"
      loading={saving}
      onClose={() => setConfirmSubmitOpen(false)}
      onConfirm={save}
    />
  </Box>;
}

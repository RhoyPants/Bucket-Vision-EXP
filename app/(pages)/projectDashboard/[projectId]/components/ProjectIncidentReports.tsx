"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputAdornment, InputLabel, MenuItem,
  Select, Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import { incidentService, Incident, IncidentPayload, IncidentSeverity } from "@/app/api-service/incidentService";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import { useAppDispatch } from "@/app/redux/hook";

type HierarchySubtask = { id: string; title: string };
type HierarchyTask = { id: string; title: string; subtasks?: HierarchySubtask[] };
type HierarchyScope = { id: string; name: string; tasks?: HierarchyTask[] };

const severityTone = {
  LOW: { color: "#0369A1", bg: "#E0F2FE" },
  MEDIUM: { color: "#A16207", bg: "#FEF9C3" },
  HIGH: { color: "#C2410C", bg: "#FFEDD5" },
  CRITICAL: { color: "#B91C1C", bg: "#FEE2E2" },
};
const statusTone = {
  PENDING: { color: "#B45309", bg: "#FFFBEB" },
  RESOLVED: { color: "#047857", bg: "#ECFDF5" },
  CANCELLED: { color: "#64748B", bg: "#F1F5F9" },
};
const emptyForm: IncidentPayload = { title: "", description: "", severity: "MEDIUM", remarks: "", scopeId: "", taskId: "", subtaskId: "" };
const messageOf = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Something went wrong.";
};
const displayDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function ProjectIncidentReports({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scopes, setScopes] = useState<HierarchyScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [dateOrder, setDateOrder] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [form, setForm] = useState<IncidentPayload>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [action, setAction] = useState<"resolve" | "cancel" | null>(null);
  const [actionText, setActionText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, project] = await Promise.all([
        incidentService.list(projectId, { status: status || undefined, severity: severity || undefined }),
        dispatch(getProjectFull(projectId, { preferCache: true })),
      ]);
      setIncidents(list.incidents);
      setScopes((project?.scopes ?? []) as unknown as HierarchyScope[]);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }, [dispatch, projectId, severity, status]);

  useEffect(() => { load(); }, [load]);

  const tasks = useMemo(() => scopes.find((scope) => scope.id === form.scopeId)?.tasks ?? [], [form.scopeId, scopes]);
  const subtasks = useMemo(() => tasks.find((task) => task.id === form.taskId)?.subtasks ?? [], [form.taskId, tasks]);
  const visibleIncidents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return incidents
      .filter((incident) => {
        if (!query) return true;
        return [
          incident.incidentNumber,
          incident.title,
          incident.description,
          incident.reportedBy?.name,
          incident.scope?.name,
          incident.task?.title,
          incident.subtask?.title,
        ].some((value) => value?.toLocaleLowerCase().includes(query));
      })
      .sort((left, right) => {
        const leftDate = new Date(left.dateRaised).getTime();
        const rightDate = new Date(right.dateRaised).getTime();
        return dateOrder === "newest" ? rightDate - leftDate : leftDate - rightDate;
      });
  }, [dateOrder, incidents, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, projectId });
    setFiles([]);
    setFormOpen(true);
  };
  const openEdit = (incident: Incident) => {
    setEditing(incident);
    setForm({
      title: incident.title, description: incident.description, severity: incident.severity,
      remarks: incident.remarks ?? "",
      scopeId: incident.scopeId ?? "", taskId: incident.taskId ?? "", subtaskId: incident.subtaskId ?? "",
    });
    setFiles([]);
    setFormOpen(true);
  };
  const save = async () => {
    if (form.title.trim().length < 1 || form.description.trim().length < 5) {
      setError("Please enter a title and a description of at least five characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await incidentService.update(editing.id, form);
        if (files.length) await incidentService.upload(editing.id, files);
      } else {
        await incidentService.create({ ...form, projectId, dateRaised: new Date().toISOString() }, files);
      }
      setFormOpen(false);
      await load();
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setSaving(false);
    }
  };
  const openDetail = async (incident: Incident) => {
    try { setSelected(await incidentService.get(incident.id)); }
    catch (requestError) { setError(messageOf(requestError)); }
  };
  const performAction = async () => {
    if (!selected || !action) return;
    setSaving(true);
    try {
      if (action === "resolve") await incidentService.resolve(selected.id, { remarks: actionText || undefined });
      else await incidentService.cancel(selected.id, actionText);
      setAction(null); setActionText(""); setSelected(null);
      await load();
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!selected || !window.confirm(`Delete ${selected.incidentNumber}? This cannot be undone.`)) return;
    try { await incidentService.remove(selected.id); setSelected(null); await load(); }
    catch (requestError) { setError(messageOf(requestError)); }
  };
  const fileChange = (event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files ?? []).slice(0, 10));
  const removeEditAttachment = async (attachmentId: string) => {
    if (!editing || !window.confirm("Delete this attachment?")) return;
    try {
      await incidentService.removeAttachment(attachmentId);
      setEditing(await incidentService.get(editing.id));
    } catch (requestError) {
      setError(messageOf(requestError));
    }
  };

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, maxWidth: 1500, mx: "auto" }}>
      <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#CBD5E1", mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 900 }}>Incident Reports</Typography>
              <Typography sx={{ color: "#64748B", fontSize: 12 }}>Record, monitor, and close project incidents.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: "none", fontWeight: 800, boxShadow: "none" }}>Report Incident</Button>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2, alignItems: { sm: "center" } }}>
            <TextField
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incident number, title, reporter…"
              aria-label="Search incident reports"
              sx={{ flex: 1, minWidth: { sm: 260 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="PENDING">Pending</MenuItem><MenuItem value="RESOLVED">Resolved</MenuItem><MenuItem value="CANCELLED">Cancelled</MenuItem></Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Severity</InputLabel><Select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}><MenuItem value="">All severities</MenuItem>{(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 165 }}>
              <InputLabel>Sort by date</InputLabel>
              <Select
                label="Sort by date"
                value={dateOrder}
                onChange={(event) => setDateOrder(event.target.value as "newest" | "oldest")}
                startAdornment={<InputAdornment position="start"><SwapVertOutlinedIcon fontSize="small" /></InputAdornment>}
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {!loading && (
            <Typography sx={{ mt: 1, color: "#64748B", fontSize: 10.5 }}>
              Showing {visibleIncidents.length} of {incidents.length} incident{incidents.length === 1 ? "" : "s"}
            </Typography>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}><CircularProgress /></Box> :
        visibleIncidents.length === 0 ? <Alert severity="info">No incident reports match your search and selected filters.</Alert> :
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          {visibleIncidents.map((incident) => (
            <Card key={incident.id} variant="outlined" onClick={() => openDetail(incident)} sx={{ cursor: "pointer", borderRadius: 2, borderColor: "#E2E8F0", "&:hover": { borderColor: "#93C5FD", boxShadow: "0 4px 14px rgba(15,23,42,.07)" } }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography sx={{ color: "#2563EB", fontSize: 11, fontWeight: 800 }}>{incident.incidentNumber}</Typography>
                  <Stack direction="row" spacing={0.5}><Chip size="small" label={incident.severity} sx={{ height: 20, fontSize: 9, fontWeight: 800, ...severityTone[incident.severity] }} /><Chip size="small" label={incident.status} sx={{ height: 20, fontSize: 9, fontWeight: 800, ...statusTone[incident.status] }} /></Stack>
                </Stack>
                <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 850 }}>{incident.title}</Typography>
                <Typography sx={{ mt: 0.5, color: "#64748B", fontSize: 11.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{incident.description}</Typography>
                <Divider sx={{ my: 1.25 }} />
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ color: "#64748B", fontSize: 10.5 }}>{incident.reportedBy?.name ?? "Unknown reporter"}</Typography><Typography sx={{ color: "#64748B", fontSize: 10.5 }}>{displayDate(incident.dateRaised)}</Typography></Stack>
              </CardContent>
            </Card>
          ))}
        </Box>}

      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>{editing ? "Edit Incident" : "Report an Incident"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Description" required multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}>{(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
              <TextField select label="Scope" value={form.scopeId ?? ""} onChange={(e) => setForm({ ...form, scopeId: e.target.value, taskId: "", subtaskId: "" })}><MenuItem value="">None</MenuItem>{scopes.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
              <TextField select label="Task" disabled={!form.scopeId} value={form.taskId ?? ""} onChange={(e) => setForm({ ...form, taskId: e.target.value, subtaskId: "" })}><MenuItem value="">None</MenuItem>{tasks.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}</TextField>
              <TextField select label="Subtask" disabled={!form.taskId} value={form.subtaskId ?? ""} onChange={(e) => setForm({ ...form, subtaskId: e.target.value })}><MenuItem value="">None</MenuItem>{subtasks.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}</TextField>
            </Box>
            <TextField label="Remarks" multiline minRows={2} value={form.remarks ?? ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            <Button component="label" variant="outlined" startIcon={<AttachFileIcon />} sx={{ alignSelf: "flex-start", textTransform: "none" }}>Attach files<input hidden type="file" multiple onChange={fileChange} /></Button>
            {files.length > 0 && (
              <Stack spacing={0.5}>
                <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 800 }}>Files to upload</Typography>
                {files.map((file) => (
                  <Stack key={`${file.name}-${file.size}-${file.lastModified}`} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography noWrap sx={{ minWidth: 0, fontSize: 12 }}>{file.name}</Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                    >
                      Remove
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}
            {editing?.attachments && editing.attachments.length > 0 && (
              <Stack spacing={0.5}>
                <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 800 }}>Uploaded attachments</Typography>
                {editing.attachments.map((attachment) => (
                  <Stack key={attachment.id} direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Typography noWrap sx={{ minWidth: 0, fontSize: 12 }}>{attachment.fileName}</Typography>
                    <Stack direction="row">
                      <Button size="small" startIcon={<DownloadOutlinedIcon />} onClick={() => incidentService.downloadAttachment(attachment)}>Download</Button>
                      <Button size="small" color="error" onClick={() => removeEditAttachment(attachment.id)}>Delete</Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setFormOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={save}>{saving ? "Saving…" : editing ? "Save Changes" : "Submit Incident"}</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        {selected && <>
          <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Box><Typography sx={{ fontWeight: 900 }}>{selected.title}</Typography><Typography sx={{ color: "#2563EB", fontSize: 11, fontWeight: 800 }}>{selected.incidentNumber}</Typography></Box><Stack direction="row" spacing={0.5}><Chip label={selected.severity} size="small" sx={{ ...severityTone[selected.severity], fontWeight: 800 }} /><Chip label={selected.status} size="small" sx={{ ...statusTone[selected.status], fontWeight: 800 }} /></Stack></Stack></DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Box><Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 800 }}>DESCRIPTION</Typography><Typography sx={{ mt: 0.5, fontSize: 13 }}>{selected.description}</Typography></Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
                <Box><Typography sx={{ color: "#64748B", fontSize: 11 }}>Reported by</Typography><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selected.reportedBy?.name ?? "—"}</Typography></Box>
                <Box><Typography sx={{ color: "#64748B", fontSize: 11 }}>Date raised</Typography><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{displayDate(selected.dateRaised)}</Typography></Box>
                <Box><Typography sx={{ color: "#64748B", fontSize: 11 }}>Location in project</Typography><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{[selected.scope?.name, selected.task?.title, selected.subtask?.title].filter(Boolean).join(" / ") || "Project level"}</Typography></Box>
                <Box><Typography sx={{ color: "#64748B", fontSize: 11 }}>Remarks</Typography><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selected.remarks || "—"}</Typography></Box>
              </Box>
              <Divider />
              <Typography sx={{ fontWeight: 850 }}>Attachments ({selected.attachments?.length ?? 0})</Typography>
              {!selected.attachments?.length ? <Typography sx={{ color: "#64748B", fontSize: 12 }}>No attachments.</Typography> :
                selected.attachments.map((attachment) => (
                  <Button
                    key={attachment.id}
                    variant="text"
                    size="small"
                    startIcon={<AttachFileIcon />}
                    onClick={async () => {
                      try {
                        await incidentService.viewAttachment(attachment);
                      } catch (requestError) {
                        setError(messageOf(requestError));
                      }
                    }}
                    sx={{ alignSelf: "flex-start", maxWidth: "100%", px: 0, justifyContent: "flex-start", textTransform: "none" }}
                  >
                    <Typography component="span" noWrap sx={{ fontSize: 12 }}>{attachment.fileName}</Typography>
                  </Button>
                ))}
              {selected.status === "CANCELLED" && <Alert severity="info">Cancellation reason: {selected.cancellationReason}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ flexWrap: "wrap" }}>
            {selected.status === "PENDING" && <>
              <Button startIcon={<EditOutlinedIcon />} onClick={() => { setSelected(null); openEdit(selected); }}>Edit</Button>
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={remove}>Delete</Button>
              <Button color="warning" startIcon={<CancelOutlinedIcon />} onClick={() => setAction("cancel")}>Cancel Incident</Button>
              <Button variant="contained" color="success" startIcon={<TaskAltOutlinedIcon />} onClick={() => setAction("resolve")}>Resolve</Button>
            </>}
            <Button onClick={() => setSelected(null)}>Close</Button>
          </DialogActions>
        </>}
      </Dialog>

      <Dialog open={Boolean(action)} onClose={() => setAction(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>{action === "resolve" ? "Resolve Incident" : "Cancel Incident"}</DialogTitle>
        <DialogContent><TextField autoFocus fullWidth multiline minRows={3} sx={{ mt: 1 }} required={action === "cancel"} label={action === "resolve" ? "Resolution remarks (optional)" : "Cancellation reason"} value={actionText} onChange={(e) => setActionText(e.target.value)} /></DialogContent>
        <DialogActions><Button onClick={() => setAction(null)}>Back</Button><Button variant="contained" color={action === "resolve" ? "success" : "warning"} disabled={saving || (action === "cancel" && actionText.trim().length < 3)} onClick={performAction}>{action === "resolve" ? "Mark Resolved" : "Cancel Incident"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

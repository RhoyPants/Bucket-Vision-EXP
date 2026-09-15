"use client";

import { useEffect, useState } from "react";
import { Add, DeleteOutline, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { IncidentType, IncidentWorkflow, NotificationMatrix, incidentTypeService, incidentWorkflowService, notificationMatrixService, workflowError } from "@/app/api-service/incidentManagementService";
import { usePermissions } from "@/app/lib/usePermissions";
import IncidentManagementForm from "./IncidentManagementForm";

export type IncidentLibrary = "workflows" | "types" | "notifications";
type Row = IncidentWorkflow | IncidentType | NotificationMatrix;
const permissionKey = "settings_incident_management";
const meta = {
  workflows: { tab: "Incident Report Workflows", singular: "Workflow", description: "Define the sequential users responsible for processing each incident level. An overdue level remains with its current resolver." },
  types: { tab: "Incident Types", singular: "Incident Type", description: "Connect a criticality, processing workflow, overall resolution SLA, and notification matrix." },
  notifications: { tab: "Escalation Notification Matrices", singular: "Notification Matrix", description: "Define notification-only recipients after the overall Incident Type SLA is breached. Recipients do not gain processing authority." },
} as const;

export default function IncidentManagement() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [kind, setKind] = useState<IncidentLibrary>("workflows");
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<{ id?: string; readOnly?: boolean } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const service = kind === "workflows" ? incidentWorkflowService : kind === "notifications" ? notificationMatrixService : incidentTypeService;
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const result = await service.list({ page: page + 1, limit, search: search.trim() || undefined, active: active === "" ? undefined : active === "true" });
        if (!alive) return;
        if (page > 0 && page >= result.pagination.totalPages) { setPage(Math.max(0, result.pagination.totalPages - 1)); return; }
        setRows(result.data); setTotal(result.pagination.total);
      } catch (err) { if (alive) { setRows([]); setTotal(0); setError(workflowError(err).message); } }
      finally { if (alive) setLoading(false); }
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [service, page, limit, search, active, refresh]);
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await service.remove(deleting.id); setDeleting(null); setSuccess("Deleted successfully."); setRefresh((value) => value + 1); }
    catch (err) { setError(workflowError(err).message); setDeleting(null); }
    finally { setBusy(false); }
  };
  return <Box>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} mb={2}>
      <Typography variant="h5" fontWeight={700}>Incident Management</Typography>
      {canCreate(permissionKey) && <Button variant="contained" startIcon={<Add />} onClick={() => setForm({})}>Create {meta[kind].singular}</Button>}
    </Stack>
    <Tabs value={kind} onChange={(_, value: IncidentLibrary) => { setKind(value); setPage(0); setSearch(""); setActive(""); setSuccess(""); }} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      {(Object.keys(meta) as IncidentLibrary[]).map((key) => <Tab key={key} value={key} label={meta[key].tab} sx={{ textTransform: "none" }} />)}
    </Tabs>
    <Alert severity="info" sx={{ mb: 3, bgcolor: "#f0f5fc" }}><Typography variant="body2" fontWeight={700}>{meta[kind].tab}</Typography>{meta[kind].description}</Alert>
    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => setRefresh((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
    <Stack direction={{ xs: "column", sm: "row" }} gap={2} mb={2}><TextField fullWidth size="small" label="Search by name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /><TextField select size="small" label="Status" value={active} onChange={(e) => { setActive(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}><MenuItem value="">All statuses</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem></TextField></Stack>
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}><TableContainer><Table sx={{ minWidth: kind === "types" ? 1050 : 720 }}><TableHead sx={{ bgcolor: "#f4f7fb" }}><TableRow>{["Name", "Description", ...(kind === "types" ? ["Criticality", "Workflow", "Overall SLA", "Notification Matrix"] : ["Levels"]), "Status", "Actions"].map((label) => <TableCell key={label} sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase" }} align={label === "Actions" ? "right" : "left"}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
      {loading ? <TableRow><TableCell colSpan={kind === "types" ? 8 : 5} align="center" sx={{ p: 5 }}><CircularProgress size={28} /></TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={kind === "types" ? 8 : 5} align="center" sx={{ p: 5 }}>No records found.</TableCell></TableRow> : rows.map((row) => {
        const type = kind === "types" ? row as IncidentType : null;
        const deletable = row.canDelete !== false;
        return <TableRow hover key={row.id}><TableCell><Button onClick={() => setForm({ id: row.id, readOnly: true })} sx={{ textTransform: "none", p: 0, fontWeight: 600 }}>{row.name}</Button></TableCell><TableCell>{row.description || "—"}</TableCell>
          {type ? <><TableCell><Chip size="small" label={type.defaultCriticality} variant="outlined" /></TableCell><TableCell>{type.incidentWorkflow?.name || "—"}</TableCell><TableCell>{type.resolutionSlaValue} {type.resolutionSlaUnit === "DAYS" ? "working days" : "hours"}{type.slaWarning && <Typography variant="caption" display="block" color="warning.main">{type.slaWarning.message}</Typography>}</TableCell><TableCell>{type.notificationMatrix?.name || "—"}</TableCell></> : <TableCell>{(row as IncidentWorkflow | NotificationMatrix).levelCount}</TableCell>}
          <TableCell><Chip size="small" label={row.isActive ? "Active" : "Inactive"} color={row.isActive ? "success" : "error"} variant="outlined" /></TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap" }}><Tooltip title="View"><IconButton size="small" onClick={() => setForm({ id: row.id, readOnly: true })}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip>{canUpdate(permissionKey) && <Tooltip title="Edit"><IconButton size="small" onClick={() => setForm({ id: row.id })}><EditOutlined fontSize="small" /></IconButton></Tooltip>}{canDelete(permissionKey) && <Tooltip title={deletable ? "Delete" : row.deleteBlockedReason || "In use. Deactivate instead."}><span><IconButton size="small" disabled={!deletable} onClick={() => setDeleting(row)}><DeleteOutline fontSize="small" /></IconButton></span></Tooltip>}</TableCell></TableRow>;
      })}
    </TableBody></Table></TableContainer><TablePagination component="div" count={total} page={page} rowsPerPage={limit} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }} /></Paper>
    {form && <IncidentManagementForm kind={kind} {...form} onClose={() => setForm(null)} onSaved={(warning) => { setForm(null); setSuccess(warning ? `Saved successfully. ${warning}` : "Saved successfully."); setRefresh((value) => value + 1); }} />}
    <Dialog open={Boolean(deleting)} onClose={() => !busy && setDeleting(null)}><DialogTitle>Delete {meta[kind].singular}?</DialogTitle><DialogContent>Delete “{deleting?.name}”? Referenced records must be deactivated instead.</DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button></DialogActions></Dialog>
  </Box>;
}

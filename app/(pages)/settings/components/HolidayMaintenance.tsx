"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { usePermissions } from "@/app/lib/usePermissions";
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  Holiday,
  updateHoliday,
} from "@/app/api-service/holidayService";

const emptyForm = { date: "", name: "", description: "" };
const permissionKeys = ["settings_holiday_maintenance", "admin", "ADMIN"];

const apiError = (error: unknown) => {
  const candidate = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return candidate.response?.data?.error || candidate.response?.data?.message || candidate.message || "The holiday request could not be completed.";
};

const dateInputValue = (date: string) => date?.slice(0, 10) || "";
const displayDate = (date: string) => {
  const value = dateInputValue(date);
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};

export default function HolidayMaintenance() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const allowed = (check: (key: string) => boolean) => permissionKeys.some(check);
  const mayCreate = allowed(canCreate);
  const mayUpdate = allowed(canUpdate);
  const mayDelete = allowed(canDelete);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setHolidays(await getHolidays());
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (holiday: Holiday) => {
    setEditing(holiday);
    setForm({ date: dateInputValue(holiday.date), name: holiday.name, description: holiday.description || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.date || !form.name.trim()) {
      setError("Date and holiday name are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = { date: form.date, name: form.name.trim(), description: form.description.trim() };
      if (editing) await updateHoliday(editing.id, payload);
      else await createHoliday(payload);
      setSuccess(`Holiday ${editing ? "updated" : "created"} successfully.`);
      setDialogOpen(false);
      await load();
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      setSaving(true);
      setError("");
      await deleteHoliday(deleting.id);
      setSuccess("Holiday deleted permanently.");
      setDeleting(null);
      await load();
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1440, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: "#F1EDFF", color: "#4B2E83" }}>
            <CalendarMonthOutlinedIcon />
          </Avatar>
          <Box>
            <Typography sx={{ color: "#0F172A", fontSize: 20, fontWeight: 600 }}>Holiday Maintenance</Typography>
            <Typography sx={{ mt: 0.35, color: "#64748B", fontSize: 13 }}>Manage the non-working dates used across project schedules.</Typography>
          </Box>
        </Stack>
        {mayCreate && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: { xs: "stretch", sm: "center" }, bgcolor: "#4B2E83", px: 2.25 }}>Add Holiday</Button>}
      </Stack>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ borderColor: "#E2E8F0", borderRadius: 2, boxShadow: "0 1px 2px rgba(15,23,42,.03)" }}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1.75, borderBottom: "1px solid #E2E8F0" }}>
          <Typography sx={{ color: "#0F172A", fontSize: 14, fontWeight: 600 }}>Holiday calendar</Typography>
          <Typography sx={{ color: "#64748B", fontSize: 12 }}>{loading ? "Loading holidays…" : `${holidays.length} ${holidays.length === 1 ? "date" : "dates"} configured`}</Typography>
        </Box>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead><TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Holiday name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Last updated</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              : holidays.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CalendarMonthOutlinedIcon sx={{ color: "#CBD5E1", fontSize: 40, mb: 1 }} /><Typography sx={{ color: "#334155", fontSize: 14, fontWeight: 600 }}>No holidays configured</Typography><Typography sx={{ mt: 0.5, color: "#64748B", fontSize: 12 }}>Add a holiday to exclude it from project schedules.</Typography></TableCell></TableRow>
              : holidays.map((holiday) => <TableRow key={holiday.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{displayDate(holiday.date)}</TableCell>
                <TableCell>{holiday.name}</TableCell>
                <TableCell>{holiday.description || "—"}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(holiday.updatedAt).toLocaleString("en-PH")}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {mayUpdate && <Tooltip title="Edit holiday"><IconButton size="small" aria-label={`Edit ${holiday.name}`} onClick={() => openEdit(holiday)}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                  {mayDelete && <Tooltip title="Delete permanently"><IconButton size="small" color="error" aria-label={`Delete ${holiday.name}`} onClick={() => setDeleting(holiday)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>}
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>{editing ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
        <DialogContent><Stack gap={2} pt={1}>
          <TextField type="date" label="Date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Holiday name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required inputProps={{ maxLength: 150 }} />
          <TextField label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={3} inputProps={{ maxLength: 500 }} />
        </Stack></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button variant="text" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={save} disabled={saving || !form.date || !form.name.trim()} sx={{ bgcolor: "#4B2E83", minWidth: 88 }}>{saving ? <CircularProgress size={20} color="inherit" /> : editing ? "Update" : "Create"}</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleting)} onClose={() => !saving && setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>Delete holiday?</DialogTitle>
        <DialogContent><Typography>This will permanently delete <strong>{deleting?.name}</strong> on {deleting ? displayDate(deleting.date) : ""}. This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button variant="text" onClick={() => setDeleting(null)} disabled={saving}>Cancel</Button><Button color="error" variant="contained" onClick={confirmDelete} disabled={saving} sx={{ minWidth: 88 }}>{saving ? <CircularProgress size={20} color="inherit" /> : "Delete"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

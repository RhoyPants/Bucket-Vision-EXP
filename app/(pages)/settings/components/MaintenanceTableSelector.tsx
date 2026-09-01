"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, ListItemText, MenuItem, Paper, Select, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { createMaintenanceTable, getMaintenanceHierarchy, getMaintenanceTables, type MaintenanceTable, updateMaintenanceTable } from "@/app/api-service/workBreakdownMaintenanceService";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";

type FormState = { code: string; name: string; description: string; isActive: boolean; businessUnitIds: string[] };
const emptyForm: FormState = { code: "", name: "", description: "", isActive: true, businessUnitIds: [] };

export default function MaintenanceTableSelector({ selectedId, onSelect, canCreate, canUpdate }: { selectedId: string; onSelect: (id: string) => void; canCreate: boolean; canUpdate: boolean }) {
  const [tables, setTables] = useState<MaintenanceTable[]>([]);
  const [businessUnits, setBusinessUnits] = useState<Array<{ id: string; code?: string; name?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [hasLegacyRecords, setHasLegacyRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTable | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback(async (preferredId?: string) => {
    try {
      setLoading(true); setError("");
      const [tableItems, buItems, hierarchy] = await Promise.all([getMaintenanceTables(), getBusinessUnitsDropdown(), getMaintenanceHierarchy()]);
      setTables(tableItems); setBusinessUnits(buItems);
      const legacyExists = hierarchy.some((scope) => !scope.maintenanceTableId);
      setHasLegacyRecords(legacyExists);
      const requestedId = preferredId || selectedId;
      const requestedIsValid = tableItems.some((table) => table.id === requestedId) || (requestedId === "__legacy__" && legacyExists);
      const nextId = requestedIsValid ? requestedId : tableItems[0]?.id || (legacyExists ? "__legacy__" : "");
      if (nextId !== selectedId) onSelect(nextId);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load WBS templates."); }
    finally { setLoading(false); }
  }, [onSelect, selectedId]);

  useEffect(() => { void load(); }, []);
  const selected = tables.find((table) => table.id === selectedId);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setDialogOpen(true); };
  const openEdit = () => { if (!selected) return; setEditing(selected); setForm({ code: selected.code, name: selected.name, description: selected.description || "", isActive: selected.isActive !== false, businessUnitIds: selected.businessUnits?.map((item) => item.businessUnitId) ?? [] }); setError(""); setDialogOpen(true); };
  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) { setError("Code and name are required."); return; }
    try {
      setSaving(true); setError("");
      const payload = { code: form.code.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim(), isActive: form.isActive, businessUnitIds: form.businessUnitIds };
      const result = editing ? await updateMaintenanceTable(editing.id, payload) : await createMaintenanceTable(payload);
      setDialogOpen(false); await load(result.id);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save the WBS template."); }
    finally { setSaving(false); }
  };

  return <>
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: "#F8FAFC" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
        <Box sx={{ minWidth: 210 }}><Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>Maintenance Table</Typography><Typography sx={{ fontSize: 10.5, color: "#64748B" }}>Select the WBS template whose hierarchy you want to manage.</Typography></Box>
        <TextField select size="small" value={selectedId} onChange={(event) => onSelect(event.target.value)} disabled={loading} sx={{ minWidth: 280, flex: 1, maxWidth: 460 }}>
          {tables.map((table) => <MenuItem key={table.id} value={table.id}><Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}><Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>{table.name} ({table.code})</Typography>{!table.businessUnits?.length && <Chip size="small" label="Private" sx={{ height: 20, fontSize: 9 }} />}{table.isActive === false && <Chip size="small" label="Inactive" sx={{ height: 20, fontSize: 9 }} />}</Stack></MenuItem>)}
          {hasLegacyRecords && <MenuItem value="__legacy__"><Typography sx={{ fontSize: 12.5 }}>Legacy global records</Typography></MenuItem>}
        </TextField>
        {loading && <CircularProgress size={20} />}
        {canUpdate && <Tooltip title={selected ? "Edit this template and its Business Unit access" : "Legacy global records do not belong to a template. Select or create a template first."}><span><Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={openEdit} disabled={!selected} sx={{ textTransform: "none", fontWeight: 700 }}>Edit template</Button></span></Tooltip>}
        {canCreate && <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate} sx={{ bgcolor: "#4B2E83", textTransform: "none", fontWeight: 700, boxShadow: "none" }}>New template</Button>}
      </Stack>
      {selected && <Stack direction="row" spacing={.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>{selected.businessUnits?.length ? selected.businessUnits.map((item) => <Chip key={item.businessUnitId} size="small" label={item.businessUnit?.name || item.businessUnit?.code || item.businessUnitId} sx={{ height: 22, fontSize: 9.5, bgcolor: "#EEF2FF", color: "#3730A3" }} />) : <Alert severity="info" sx={{ width: "100%", py: 0, fontSize: 11 }}>Draft/private template — assign at least one Business Unit to make it available in project WBS dropdowns.</Alert>}</Stack>}
      {error && !dialogOpen && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Paper>
    <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit" : "Create"} WBS Template</DialogTitle><DialogContent dividers><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}<TextField required label="Code" value={form.code} disabled={saving || Boolean(editing)} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /><TextField required label="Name" value={form.name} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /><TextField label="Description" value={form.description} disabled={saving} multiline minRows={2} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /><FormControl fullWidth disabled={saving}><InputLabel>Business Units</InputLabel><Select multiple value={form.businessUnitIds} label="Business Units" onChange={(event) => setForm((current) => ({ ...current, businessUnitIds: typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value }))} renderValue={(ids) => ids.map((id) => businessUnits.find((unit) => unit.id === id)?.name || id).join(", ")}>{businessUnits.map((unit) => <MenuItem key={unit.id} value={unit.id}><Checkbox checked={form.businessUnitIds.includes(unit.id)} /><ListItemText primary={unit.name} secondary={unit.code} /></MenuItem>)}</Select></FormControl><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>Active template</Typography><Typography sx={{ fontSize: 10.5, color: "#64748B" }}>Inactive templates are unavailable for future project selections.</Typography></Box><Switch checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /></Stack></Stack></DialogContent><DialogActions sx={{ px: 3, py: 2 }}><Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={save} disabled={saving} sx={{ bgcolor: "#4B2E83" }}>{saving ? "Saving..." : editing ? "Update template" : "Create template"}</Button></DialogActions></Dialog>
  </>;
}

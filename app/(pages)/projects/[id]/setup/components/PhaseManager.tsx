"use client";

import { useState, type ReactNode } from "react";
import { Alert, Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { ProjectPhase } from "@/app/api-service/phaseService";

type Props = {
  phases: ProjectPhase[];
  disabled?: boolean;
  onCreate: (name: string, description: string) => Promise<void>;
  onUpdate: (phaseId: string, data: { name: string; description?: string; order?: number }) => Promise<void>;
  onDelete: (phase: ProjectPhase) => Promise<void>;
  onMove: (phaseId: string, direction: -1 | 1) => Promise<void>;
  renderContent: (phase: ProjectPhase, showScopeForm: boolean, closeScopeForm: () => void) => ReactNode;
};

export default function PhaseManager({ phases, disabled, onCreate, onUpdate, onDelete, onMove, renderContent }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openScopeForms, setOpenScopeForms] = useState<Set<string>>(() => new Set());
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(() => new Set());

  const submitCreate = async () => {
    if (!name.trim()) return;
    setBusy(true); setError("");
    try { await onCreate(name.trim(), description.trim()); setName(""); setDescription(""); setCreating(false); }
    catch (requestError: unknown) {
      const errorValue = requestError as { response?: { data?: { message?: string } }; message?: string };
      setError(errorValue.response?.data?.message || errorValue.message || "Unable to create phase.");
    }
    finally { setBusy(false); }
  };

  return <Box sx={{ mb: 2 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1} sx={{ mb: 1 }}>
      <Box><Typography sx={{ fontSize: 14, fontWeight: 800 }}>Project Phases</Typography><Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Select a phase before adding and arranging its scopes.</Typography></Box>
      {!disabled && <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>Add Phase</Button>}
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
    {creating && <Stack direction={{ xs: "column", md: "row" }} gap={1} sx={{ p: 1.25, mb: 1, border: "1px solid #C7D2FE", borderRadius: 1.5, bgcolor: "#F8FAFF" }}>
      <TextField size="small" required label="Phase name" value={name} onChange={(event) => setName(event.target.value)} />
      <TextField size="small" label="Description" value={description} onChange={(event) => setDescription(event.target.value)} sx={{ flex: 1 }} />
      <Button disabled={busy || !name.trim()} onClick={() => void submitCreate()}>Save</Button><Button color="inherit" disabled={busy} onClick={() => setCreating(false)}>Cancel</Button>
    </Stack>}
    {!phases.length && !creating ? <Alert severity="info">No phases yet. Create the first phase before adding scopes.</Alert> : <Stack spacing={0.75}>
      {phases.map((phase, index) => {
        const editing = phase.id === editingId;
        const collapsed = collapsedPhases.has(phase.id);
        const hasScopes = Boolean(phase.scopes?.length);
        const showScopeForm = !hasScopes || openScopeForms.has(phase.id);
        const closeScopeForm = () => setOpenScopeForms((current) => {
          const next = new Set(current);
          next.delete(phase.id);
          return next;
        });
        return <Box key={phase.id} sx={{ overflow: "hidden", border: "1px solid #C7D2FE", borderRadius: 2, bgcolor: "#FFF" }}>
          <Box sx={{ p: 1.25, bgcolor: "#F5F3FF", borderBottom: "1px solid #C7D2FE" }}>
          {editing ? <Stack direction={{ xs: "column", md: "row" }} gap={1}>
            <TextField size="small" required value={editName} onChange={(event) => setEditName(event.target.value)} />
            <TextField size="small" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} sx={{ flex: 1 }} />
            <IconButton disabled={busy || !editName.trim()} onClick={async () => { setBusy(true); try { await onUpdate(phase.id, { name: editName.trim(), description: editDescription.trim() }); setEditingId(null); } finally { setBusy(false); } }}><CheckIcon /></IconButton>
            <IconButton onClick={() => setEditingId(null)}><CloseIcon /></IconButton>
          </Stack> : <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title={collapsed ? "Expand phase" : "Collapse phase"}><IconButton size="small" onClick={() => setCollapsedPhases((current) => { const next = new Set(current); collapsed ? next.delete(phase.id) : next.add(phase.id); return next; })}>{collapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton></Tooltip>
            <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{phase.name}</Typography>{phase.description && <Typography noWrap sx={{ fontSize: 11, color: "text.secondary" }}>{phase.description}</Typography>}<Typography sx={{ fontSize: 10, color: "#6366F1", fontWeight: 700 }}>{phase.scopes?.length || 0} scope{phase.scopes?.length === 1 ? "" : "s"}</Typography></Box>
            {!disabled && <>
              <Tooltip title="Move phase up"><span><IconButton size="small" disabled={busy || index === 0} onClick={(event) => { event.stopPropagation(); void onMove(phase.id, -1); }}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
              <Tooltip title="Move phase down"><span><IconButton size="small" disabled={busy || index === phases.length - 1} onClick={(event) => { event.stopPropagation(); void onMove(phase.id, 1); }}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
              <IconButton size="small" onClick={(event) => { event.stopPropagation(); setEditingId(phase.id); setEditName(phase.name); setEditDescription(phase.description || ""); }}><EditOutlinedIcon fontSize="small" /></IconButton>
              <Tooltip title={phase.scopes?.length ? "Remove all scopes before deleting this phase" : "Delete phase"}><span><IconButton size="small" color="error" disabled={busy || Boolean(phase.scopes?.length)} onClick={(event) => { event.stopPropagation(); void onDelete(phase); }}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
            </>}
          </Stack>}
          </Box>
          {!editing && !collapsed && <Box sx={{ p: { xs: 1.25, md: 2 }, bgcolor: "#FAF9FF" }}>
            {renderContent(phase, showScopeForm, closeScopeForm)}
            {hasScopes && showScopeForm && !disabled && <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}><Button size="small" color="inherit" onClick={closeScopeForm}>Cancel adding scope</Button></Stack>}
            {hasScopes && !showScopeForm && !disabled && <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="flex-end" gap={1} sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid #DDD6FE" }}><Box component="span" sx={{ color: "#4C1D95", fontSize: 12, fontWeight: 700, textAlign: { xs: "right", sm: "left" } }}>To add another scope, click Add Scope.</Box><Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenScopeForms((current) => new Set(current).add(phase.id))}>Add Scope</Button></Stack>}
          </Box>}
        </Box>;
      })}
    </Stack>}
  </Box>;
}

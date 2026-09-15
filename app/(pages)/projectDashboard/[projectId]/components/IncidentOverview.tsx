"use client";

import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { Incident, incidentService } from "@/app/api-service/incidentService";
import { workflowError } from "@/app/api-service/incidentManagementService";
import { manilaInput, manilaTimestamp } from "@/app/utils/incidentCase";
import IncidentEvidence from "./IncidentEvidence";
import { incidentDate } from "./IncidentEscalationPanel";
import IncidentAcknowledgements from "./IncidentAcknowledgements";

export default function IncidentOverview({ incident, onChanged, onUpdated }: { incident: Incident; onChanged: () => Promise<void>; onUpdated: (incident: Incident) => void }) {
  const [editing, setEditing] = useState(false);
  const relatedWork = [incident.scope?.name, incident.task?.title, incident.subtask?.title].filter(Boolean).join(" / ");
  const facts = [
    ["Occurred", incidentDate(incident.occurredAt)],
    ["Reported", incidentDate(incident.dateRaised)],
    ["Location", incident.location],
    ["Reported by", incident.reportedBy?.name],
    ["Report recipient", incident.reportRecipient],
    ["Related work", relatedWork],
  ];
  return <Box><Stack spacing={2.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6" fontWeight={800}>Incident overview</Typography><Typography variant="body2" color="text.secondary">Initial report and supporting evidence</Typography></Box>{incident.status === "PENDING" && incident.permissions?.canEditOverview && <Button variant="outlined" onClick={() => setEditing(true)}>Edit overview</Button>}</Stack>
    {incident.status === "RESOLVED" && <Alert severity="success"><strong>Resolved {incidentDate(incident.dateAddressed)}</strong>{incident.resolvedBy?.name ? ` by ${incident.resolvedBy.name}` : ""}{incident.remarks ? ` — ${incident.remarks}` : ""}</Alert>}
    {incident.status === "CANCELLED" && <Alert severity="info">Cancelled: {incident.cancellationReason}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
      <Box sx={{ p: 2, borderRadius: 1, bgcolor: "#FFFFFF", boxShadow: "0 1px 6px rgba(15,23,42,.05)" }}><Typography variant="body2" fontWeight={600} color="text.secondary">What happened</Typography><Typography mt={0.75} sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{incident.description || "No description was recorded."}</Typography></Box>
      <Box sx={{ p: 2, borderRadius: 1, bgcolor: "#FFFFFF", boxShadow: "0 1px 6px rgba(15,23,42,.05)" }}><Typography variant="body2" fontWeight={600} color="text.secondary">Immediate action taken</Typography><Typography mt={0.75} sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{incident.immediateActionTaken || "No immediate action was recorded."}</Typography></Box>
    </Box>
    <Box><Typography variant="subtitle1" fontWeight={600}>Report information</Typography><Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
      {facts.map(([label, value]) => <Box key={label} sx={{ px: 1.5, py: 1.25, borderRadius: 0.75, bgcolor: "#F8FAFC" }}><Typography variant="caption" color="text.secondary" fontWeight={500}>{label}{label === "Occurred" || label === "Reported" ? " · Asia/Manila" : ""}</Typography><Typography variant="body2" fontWeight={400} mt={0.25} sx={{ overflowWrap: "anywhere" }}>{value || "Not recorded"}</Typography></Box>)}
    </Box></Box>
    <IncidentAcknowledgements incidentId={incident.id} resourceType="INCIDENT" title="Resolver acknowledgement status" />
    <Box sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 1, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}><Typography variant="h6" fontWeight={800}>Initial evidence</Typography><Typography variant="body2" color="text.secondary" mb={1.5}>Files and photos submitted with the original report</Typography><IncidentEvidence incidentId={incident.id} section="INITIAL_REPORT" attachments={incident.attachments || []} canManage={incident.status === "PENDING" && Boolean(incident.permissions?.canManageEvidence)} onChanged={onChanged} /></Box>
    {editing && <OverviewForm incident={incident} onClose={() => setEditing(false)} onChanged={onChanged} onSaved={(updated) => { onUpdated(updated); setEditing(false); }} />}
  </Stack></Box>;
}
function OverviewForm({ incident, onClose, onSaved, onChanged }: { incident: Incident; onClose: () => void; onSaved: (incident: Incident) => void; onChanged: () => Promise<void> }) {
  const [original, setOriginal] = useState(incident);
  const toDraft = (value: Incident) => ({ title: value.title, description: value.description, occurredAt: manilaInput(value.occurredAt), location: value.location || "", immediateActionTaken: value.immediateActionTaken || "", reportRecipient: value.reportRecipient || "" });
  const [draft, setDraft] = useState(() => toDraft(incident));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stale, setStale] = useState(false);
  const reload = async () => {
    setBusy(true);
    try { const latest = await incidentService.get(incident.id); setOriginal(latest); setDraft(toDraft(latest)); setStale(false); setError(""); setFields({}); await onChanged(); }
    catch (err) { setError(workflowError(err).message); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (draft.title.trim().length < 3 || draft.description.trim().length < 5) { setError("Enter a title of at least three characters and description of at least five characters."); return; }
    setBusy(true); setError("");
    try {
      const baseline = toDraft(original);
      const changes = Object.fromEntries(Object.entries(draft).filter(([key, value]) => value !== baseline[key as keyof typeof baseline]));
      if ("occurredAt" in changes) changes.occurredAt = manilaTimestamp(draft.occurredAt);
      const updated = Object.keys(changes).length ? await incidentService.update(incident.id, { revision: original.revision, ...changes }) : original;
      onSaved(updated);
    } catch (err) { const failure = workflowError(err); setError(failure.message); setFields(failure.fields); setStale(failure.code === "STALE_REVISION"); }
    finally { setBusy(false); }
  };
  return <Dialog open fullWidth maxWidth="md" onClose={() => !busy && onClose()}><DialogTitle>Edit overview</DialogTitle><DialogContent dividers><Stack spacing={2}>
    {error && <Alert severity="error">{error}</Alert>}{stale && <Alert severity="warning" action={<Button disabled={busy} onClick={reload}>Reload latest</Button>}>This report changed. Reloading discards your unsaved edits.</Alert>}
    {([['title', 'Title'], ['description', 'Description'], ['occurredAt', 'Incident date/time · Asia/Manila'], ['location', 'Location'], ['immediateActionTaken', 'Immediate action taken'], ['reportRecipient', 'Report recipient']] as const).map(([key, label]) => <TextField key={key} label={label} value={draft[key]} disabled={busy || stale || incident.status !== "PENDING" || !incident.permissions?.canEditOverview} required={["title", "description", "occurredAt", "location"].includes(key)} type={key === "occurredAt" ? "datetime-local" : "text"} slotProps={key === "occurredAt" ? { inputLabel: { shrink: true } } : undefined} multiline={["description", "immediateActionTaken"].includes(key)} minRows={key === "description" ? 3 : undefined} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} error={Boolean(fields[key])} helperText={fields[key]} />)}
  </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button><Button variant="contained" disabled={busy || stale || original.revision == null || incident.status !== "PENDING" || !incident.permissions?.canEditOverview} onClick={save}>Save overview</Button></DialogActions></Dialog>;
}

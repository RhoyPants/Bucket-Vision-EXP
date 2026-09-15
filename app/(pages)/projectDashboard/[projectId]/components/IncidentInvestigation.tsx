"use client";

import { useState } from "react";
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { Investigation, InvestigationFields, incidentCaseService } from "@/app/api-service/incidentCaseService";
import { EvidenceSection, Incident } from "@/app/api-service/incidentService";
import { workflowError } from "@/app/api-service/incidentManagementService";
import IncidentEvidence from "./IncidentEvidence";

const sections: { key: keyof InvestigationFields; label: string; description: string; placeholder: string; evidence: EvidenceSection }[] = [
  { key: "siteFindings", label: "Site condition and findings", description: "Describe what was observed during the inspection, including affected areas, equipment, and conditions.", placeholder: "Example: Water was observed beneath the sprinkler connection and several boxes were wet.", evidence: "SITE_FINDINGS" },
  { key: "rootCause", label: "Root cause", description: "State the confirmed underlying cause using facts established by the investigation.", placeholder: "Example: The mechanical rubber gasket was damaged and no longer formed a proper seal.", evidence: "ROOT_CAUSE" },
  { key: "contributingFactors", label: "Contributing factors", description: "List conditions that increased the likelihood or impact of the incident.", placeholder: "Example: High ambient temperature near the ceiling increased system pressure.", evidence: "CONTRIBUTING_FACTORS" },
  { key: "mitigation", label: "Mitigation and corrective measures", description: "Record controls already applied to contain the incident and prevent further damage.", placeholder: "Example: The affected area was isolated and the damaged component was replaced.", evidence: "MITIGATION" },
  { key: "recommendations", label: "Recommendations and preventive measures", description: "Propose follow-up improvements that reduce the chance of recurrence.", placeholder: "Example: Add weekly pressure monitoring and replace aging gaskets during preventive maintenance.", evidence: "RECOMMENDATIONS" },
];
export default function IncidentInvestigation({ incident, initial, onChanged }: { incident: Incident; initial: Investigation; onChanged: () => Promise<void> }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<InvestigationFields>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stale, setStale] = useState(false);
  const [notice, setNotice] = useState("");
  const canEdit = incident.status === "PENDING" && Boolean(incident.permissions?.canEditInvestigation) && saved.permissions.canEdit;
  const save = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const changes = Object.fromEntries(sections.filter(({ key }) => (draft[key] || "") !== (saved[key] || "")).map(({ key }) => [key, draft[key] || ""]));
      const result = Object.keys(changes).length ? await incidentCaseService.saveInvestigation(incident.id, { revision: saved.revision, ...changes }) : saved;
      setSaved(result); setDraft(result); setFields({}); setNotice("Investigation saved. The incident remains pending."); await onChanged();
    } catch (err) { const failure = workflowError(err); setError(failure.message); setFields(failure.fields); setStale(failure.code === "STALE_REVISION"); }
    finally { setBusy(false); }
  };
  const reload = async () => {
    setBusy(true);
    try { const result = await incidentCaseService.investigation(incident.id); setSaved(result); setDraft(result); setStale(false); setFields({}); setError(""); }
    catch (err) { setError(workflowError(err).message); }
    finally { setBusy(false); }
  };
  return <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1.5}>
      <Box><Typography variant="h6" fontWeight={800}>Investigation report</Typography><Typography variant="body2" color="text.secondary">Document what was found, why it happened, and how recurrence will be prevented.</Typography></Box>
      <Chip size="small" label={canEdit ? "Draft · editable" : "Read only"} color={canEdit ? "warning" : "default"} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderRadius: 0.75, fontWeight: 700 }} />
    </Stack>
    {error && <Alert severity="error">{error}</Alert>}{notice && <Alert severity="success">{notice}</Alert>}
    {stale && <Alert severity="warning" action={<Button disabled={busy} onClick={reload}>Reload latest</Button>}>Another user changed the investigation. Reloading replaces your unsaved edits.</Alert>}
    {sections.map(({ key, label, description, placeholder, evidence }, index) => <Stack key={key} spacing={1.5} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid #E2E8F0", borderRadius: 1, bgcolor: "#F8FAFC" }}>
      <Stack direction="row" gap={1.25} alignItems="flex-start"><Box sx={{ width: 24, height: 24, flexShrink: 0, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 0.5, fontSize: 12, fontWeight: 800 }}>{index + 1}</Box><Box><Typography fontWeight={800}>{label}</Typography><Typography variant="body2" color="text.secondary">{description}</Typography></Box></Stack>
      <TextField fullWidth multiline minRows={2} placeholder={placeholder} value={draft[key] || ""} disabled={!canEdit || busy || stale} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} error={Boolean(fields[key])} helperText={fields[key]} sx={{ bgcolor: "#FFFFFF" }} />
      <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>Supporting evidence</Typography><IncidentEvidence incidentId={incident.id} section={evidence} attachments={incident.attachments || []} canManage={incident.status === "PENDING" && saved.permissions.canManageEvidence} onChanged={onChanged} /></Box>
    </Stack>)}
    <Box sx={{ p: 1.5, borderLeft: "3px solid", borderColor: "primary.main", bgcolor: "#F8FAFC" }}><Typography variant="body2" fontWeight={700}>Immediate action from the original report</Typography><Typography variant="body2" color="text.secondary">{incident.immediateActionTaken || "No immediate action was recorded."} Edit this information in Overview.</Typography><Box sx={{ mt: 1 }}><IncidentEvidence incidentId={incident.id} section="IMMEDIATE_ACTION" attachments={incident.attachments || []} canManage={incident.status === "PENDING" && saved.permissions.canManageEvidence} onChanged={onChanged} /></Box></Box>
    {canEdit && <Button variant="contained" disabled={busy || stale} onClick={save} sx={{ alignSelf: "flex-end", borderRadius: 0.75 }}>{busy ? "Saving…" : "Save investigation"}</Button>}
  </Stack>;
}

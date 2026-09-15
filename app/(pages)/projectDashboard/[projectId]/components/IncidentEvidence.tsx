"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { AttachFile, DownloadOutlined } from "@mui/icons-material";
import { EvidenceSection, IncidentAttachment, incidentService } from "@/app/api-service/incidentService";
import { incidentCaseService } from "@/app/api-service/incidentCaseService";
import { workflowError } from "@/app/api-service/incidentManagementService";

export default function IncidentEvidence({ incidentId, section, actionId, attachments, canManage, onChanged }: {
  incidentId: string; section: EvidenceSection; actionId?: string; attachments: IncidentAttachment[]; canManage: boolean; onChanged: () => Promise<void>;
}) {
  const [files, setFiles] = useState<Array<{ file: File; caption: string }>>([]);
  const [editing, setEditing] = useState<IncidentAttachment | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [order, setOrder] = useState(1);
  const [editSection, setEditSection] = useState<EvidenceSection>(section);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const visible = attachments.filter((file) => (file.section || "INITIAL_REPORT") === section && (section !== "ACTION" || file.actionId === actionId)).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const run = async (operation: () => Promise<void>, refresh = true) => {
    setBusy(true); setError("");
    try { await operation(); if (refresh) await onChanged(); }
    catch (err) { setError(workflowError(err).message); }
    finally { setBusy(false); }
  };
  return <Stack spacing={1}>
    {error && <Alert severity="error">{error}</Alert>}
    {!!visible.length && <Box sx={{ display: "flex", gap: 1.25, overflowX: "auto", overflowY: "hidden", pb: 1, scrollSnapType: "x proximity", scrollbarWidth: "thin" }}>
      {visible.map((file) => <Box key={file.id} sx={{ flex: "0 0 260px", width: 260, minWidth: 0, border: "1px solid", borderColor: "divider", p: 1.25, borderRadius: 1, bgcolor: "background.paper", scrollSnapAlign: "start", transition: "box-shadow 160ms ease, border-color 160ms ease", "&:hover, &:focus-within": { borderColor: "primary.light", boxShadow: "0 5px 16px rgba(15,23,42,.10)" }, "&:hover .evidence-actions, &:focus-within .evidence-actions": { opacity: 1, pointerEvents: "auto", transform: "translateY(0)" } }}>
        {file.mimeType?.startsWith("image/") && <EvidenceThumbnail file={file} />}
        <Box component="button" type="button" disabled={busy} title={file.fileName} onClick={() => void run(() => incidentService.viewAttachment(file), false)} sx={{ width: "100%", minHeight: 38, display: "flex", alignItems: "flex-start", gap: 0.75, p: 0, border: 0, bgcolor: "transparent", color: "text.primary", textAlign: "left", cursor: busy ? "default" : "pointer", font: "inherit", "&:hover": { color: "primary.main" }, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2, borderRadius: 0.5 } }}><AttachFile sx={{ mt: 0.15, fontSize: 17, flexShrink: 0, color: "text.secondary" }} /><Typography variant="body2" fontWeight={700} sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere", lineHeight: 1.35 }}>{file.fileName}</Typography></Box>
        {file.caption && <Typography variant="caption" display="block" noWrap title={file.caption}>{file.caption}</Typography>}
        {file.user?.name && <Typography variant="caption" display="block" color="text.secondary" noWrap>By {file.user.name}</Typography>}
        <Stack className="evidence-actions" direction="row" alignItems="center" gap={0.25} sx={{ mt: 0.5, minHeight: 30, opacity: { xs: 1, md: 0 }, pointerEvents: { xs: "auto", md: "none" }, transform: { xs: "none", md: "translateY(3px)" }, transition: "opacity 150ms ease, transform 150ms ease" }}><Button disabled={busy} size="small" aria-label={`Download ${file.fileName}`} onClick={() => void run(() => incidentService.downloadAttachment(file), false)}><DownloadOutlined fontSize="small" /></Button>
          {canManage && <><Button size="small" disabled={busy} onClick={() => { setEditing(file); setEditCaption(file.caption || ""); setOrder(file.displayOrder || 1); setEditSection(file.section || "INITIAL_REPORT"); }}>Edit</Button><Button size="small" color="error" disabled={busy} onClick={() => { if (window.confirm(`Delete evidence “${file.fileName}”?`)) void run(() => incidentService.removeAttachment(file.id)); }}>Delete</Button></>}
        </Stack>
      </Box>)}
    </Box>}
    {!visible.length && <Typography variant="body2" color="text.secondary">No evidence attached to this section.</Typography>}
    {canManage && <>
      <Button component="label" size="small" variant="outlined" disabled={busy || attachments.length + files.length >= 10} startIcon={<AttachFile />} sx={{ alignSelf: "flex-start" }}>Add evidence<input hidden type="file" multiple onChange={(e) => { const selected = Array.from(e.target.files || []); e.target.value = ""; const remaining = 10 - attachments.length - files.length; if (selected.length > remaining) { setError(`You can select ${remaining} more attachment${remaining === 1 ? "" : "s"}.`); return; } setFiles((current) => [...current, ...selected.map((file) => ({ file, caption: "" }))]); setError(""); }} /></Button>
      <Typography variant="caption" color="text.secondary">{attachments.length} uploaded · {Math.max(0, 10 - attachments.length - files.length)} slots available</Typography>
      {!!files.length && <Stack spacing={1.25} sx={{ p: 1.5, borderRadius: 1, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
        <Typography variant="subtitle2">Files ready to upload ({files.length})</Typography>
        {files.map((entry, index) => <Stack key={`${entry.file.name}-${entry.file.lastModified}-${index}`} direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }}>
          <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" fontWeight={700} noWrap>{entry.file.name}</Typography><Typography variant="caption" color="text.secondary">{Math.max(1, Math.ceil(entry.file.size / 1024))} KB</Typography></Box>
          <TextField size="small" label="Caption (optional)" value={entry.caption} disabled={busy} onChange={(event) => setFiles((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, caption: event.target.value } : item))} sx={{ width: { xs: "100%", sm: 280 } }} />
          <Button size="small" color="error" disabled={busy} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
        </Stack>)}
        <Stack direction="row" justifyContent="flex-end" gap={1}><Button disabled={busy} onClick={() => setFiles([])}>Cancel</Button><Button variant="contained" disabled={busy} onClick={() => void run(async () => { for (const entry of files) await incidentService.upload(incidentId, [entry.file], { section, ...(section === "ACTION" ? { actionId } : {}), caption: entry.caption.trim() }); setFiles([]); })}>{busy ? "Uploading…" : `Upload ${files.length} file${files.length === 1 ? "" : "s"}`}</Button></Stack>
      </Stack>}
    </>}
    <Dialog open={Boolean(editing)} onClose={() => !busy && setEditing(null)} fullWidth maxWidth="sm"><DialogTitle>Edit evidence</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField disabled={busy || !canManage} label="Caption" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} /><TextField disabled={busy || !canManage} label="Display order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} slotProps={{ htmlInput: { min: 1, step: 1 } }} /><TextField select label="Report section" disabled={busy || !canManage || section === "ACTION"} value={editSection} onChange={(e) => setEditSection(e.target.value as EvidenceSection)}>{(section === "ACTION" ? ["ACTION"] : ["INITIAL_REPORT", "SITE_FINDINGS", "IMMEDIATE_ACTION", "ROOT_CAUSE", "CONTRIBUTING_FACTORS", "MITIGATION", "RECOMMENDATIONS", "RESOLUTION"]).map((value) => <MenuItem key={value} value={value}>{value.replaceAll("_", " ")}</MenuItem>)}</TextField></Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => setEditing(null)}>Cancel</Button><Button disabled={busy || !canManage || !Number.isInteger(order) || order < 1} onClick={() => void run(async () => { await incidentCaseService.updateEvidence(editing!.id, { caption: editCaption, displayOrder: order, ...(editSection !== section ? { section: editSection } : {}) }); setEditing(null); })}>Save</Button></DialogActions></Dialog>
  </Stack>;
}

function EvidenceThumbnail({ file }: { file: IncidentAttachment }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    incidentService.fileBlob(file.id).then((blob) => { if (alive) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } }).catch(() => { /* File links remain available if a thumbnail cannot load. */ });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file.id]);
  return url ? <Box component="img" src={url} alt={file.caption || file.fileName} sx={{ width: "100%", height: 130, objectFit: "cover", display: "block", mb: 0.75, borderRadius: 0.75, bgcolor: "#F1F5F9" }} /> : <Box sx={{ width: "100%", height: 130, mb: 0.75, borderRadius: 0.75, bgcolor: "#F1F5F9" }} />;
}

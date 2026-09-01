"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, InputAdornment, List, ListItemButton, Stack, TextField, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { orgChartBuilderService, type OrgChartBuilderChart, type OrgChartClonePreview, type OrgChartCopySource } from "@/app/api-service/orgChartBuilderService";

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Unable to copy the organization chart.";
};

function MiniPreview({ chart }: { chart: OrgChartBuilderChart }) {
  const bounds = useMemo(() => {
    const nodes = chart.nodes ?? [];
    if (!nodes.length) return { width: 1, height: 1 };
    return { width: Math.max(...nodes.map((node) => (node.x ?? 0) + 180), 1), height: Math.max(...nodes.map((node) => (node.y ?? 0) + 70), 1) };
  }, [chart.nodes]);
  const scale = Math.min(1, 520 / bounds.width, 230 / bounds.height);
  return <Box sx={{ height: 250, overflow: "auto", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 1.5, backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)", backgroundSize: "16px 16px", p: 1.5 }}>
    <Box sx={{ position: "relative", width: bounds.width * scale, height: bounds.height * scale, mx: "auto" }}>
      <Box component="svg" viewBox={`0 0 ${bounds.width} ${bounds.height}`} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {chart.nodes.filter((node) => node.parentId).map((node) => { const parent = chart.nodes.find((item) => item.id === node.parentId); if (!parent) return null; const sx = (parent.x ?? 0) + 90; const sy = (parent.y ?? 0) + 70; const ex = (node.x ?? 0) + 90; const ey = node.y ?? 0; return <path key={node.id} d={`M ${sx} ${sy} V ${(sy + ey) / 2} H ${ex} V ${ey}`} fill="none" stroke="#64748B" strokeWidth="2" />; })}
      </Box>
      {chart.nodes.map((node) => <Box key={node.id} sx={{ position: "absolute", left: (node.x ?? 0) * scale, top: (node.y ?? 0) * scale, width: 180 * scale, height: 70 * scale, border: "1px solid #94A3B8", borderRadius: `${8 * scale}px`, bgcolor: node.backgroundColor || "#FFF", color: node.textColor || "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", gap: .5, px: 1, textAlign: "center", overflow: "hidden" }}>{node.photoUrl && <Box component="img" src={node.photoUrl} alt="" sx={{ width: 32 * scale, height: 32 * scale, flex: "0 0 auto", borderRadius: "50%", objectFit: "cover" }} />}<Typography sx={{ fontSize: Math.max(7, 10 * scale), lineHeight: 1.15, fontWeight: 800 }}>{node.name || node.position}</Typography></Box>)}
    </Box>
  </Box>;
}

export default function OrgChartCopyDialog({ open, projectId, destinationHasChart, onClose, onCloned }: { open: boolean; projectId: string; destinationHasChart: boolean; onClose: () => void; onCloned: (chart: OrgChartBuilderChart) => void }) {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<OrgChartCopySource[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [preview, setPreview] = useState<OrgChartClonePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  const loadSources = async (search: string, nextCursor?: string | null) => {
    setLoading(true);
    try { setError(""); const result = await orgChartBuilderService.copySources({ query: search, cursor: nextCursor, limit: 20 }); setSources((current) => nextCursor ? [...current, ...result.data] : result.data); setCursor(result.nextCursor); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!open) return;
    setPreview(null); setQuery(""); setSources([]); setCursor(null); setError("");
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => loadSources(query), 350);
    return () => window.clearTimeout(timer);
  }, [query, open]);
  const choose = async (sourceProjectId: string) => {
    setLoading(true);
    try { setError(""); setPreview(await orgChartBuilderService.clonePreview(projectId, sourceProjectId)); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  };
  const confirm = async () => {
    if (!preview) return;
    setCopying(true);
    try { setError(""); const chart = await orgChartBuilderService.clone(projectId, preview.sourceProject.id, destinationHasChart || preview.destinationHasChart); onCloned(chart); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setCopying(false); }
  };
  const rootCount = preview?.chart.nodes.filter((node) => !node.parentId).length ?? 0;
  return <Dialog open={open} onClose={() => !copying && onClose()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
    <DialogTitle sx={{ px: 3, py: 2, fontSize: 17, fontWeight: 900 }}>{preview ? <Stack direction="row" alignItems="center" spacing={1}><Button size="small" startIcon={<ArrowBackOutlinedIcon />} onClick={() => setPreview(null)} sx={{ minWidth: 0, textTransform: "none" }}>Back</Button><Typography sx={{ fontSize: 17, fontWeight: 900 }}>Preview chart</Typography></Stack> : "Copy from another project"}</DialogTitle>
    <Divider />
    <DialogContent sx={{ px: 3, py: 2.25 }}>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {!preview ? <>
        <TextField autoFocus fullWidth size="small" placeholder="Search project or chart title" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment> }} />
        <List disablePadding sx={{ mt: 1.5, maxHeight: 380, overflow: "auto" }}>
          {sources.map((source) => <ListItemButton key={source.projectId} onClick={() => choose(source.projectId)} sx={{ mb: .75, px: 1.5, py: 1.25, border: "1px solid #E2E8F0", borderRadius: 1.5 }}><Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap sx={{ fontSize: 12.5, fontWeight: 900 }}>{source.projectName}</Typography><Typography noWrap sx={{ fontSize: 10.5, color: "#64748B" }}>{source.version ? `${source.version} • ` : ""}{source.chartTitle}</Typography></Box><Typography sx={{ ml: 2, fontSize: 11, color: "#475569", fontWeight: 800 }}>{source.nodeCount} positions</Typography></ListItemButton>)}
          {!loading && !sources.length && <Box sx={{ py: 5, textAlign: "center" }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>No charts found</Typography><Typography sx={{ mt: .5, fontSize: 11, color: "#64748B" }}>Try a different project or chart title.</Typography></Box>}
        </List>
        {loading && <Box sx={{ py: 2, display: "grid", placeItems: "center" }}><CircularProgress size={24} /></Box>}
        {cursor && !loading && <Button fullWidth onClick={() => loadSources(query, cursor)} sx={{ mt: 1, textTransform: "none", fontWeight: 800 }}>Load more</Button>}
      </> : <Stack spacing={1.5}>
        <Box><Typography sx={{ fontSize: 15, fontWeight: 900 }}>Copy “{preview.chart.title}” from {preview.sourceProject.name}?</Typography><Typography sx={{ mt: .25, fontSize: 11, color: "#64748B" }}>{preview.sourceProject.version}</Typography></Box>
        <MiniPreview chart={preview.chart} />
        <Stack spacing={.5} sx={{ color: "#475569" }}><Typography sx={{ fontSize: 12 }}>• {rootCount} root node{rootCount === 1 ? "" : "s"}</Typography><Typography sx={{ fontSize: 12 }}>• {preview.chart.nodes.length} positions</Typography><Typography sx={{ fontSize: 12 }}>• Colors and canvas layout will be copied</Typography><Typography sx={{ fontSize: 12 }}>• Future edits affect this project only</Typography></Stack>
        {(destinationHasChart || preview.destinationHasChart) && <Alert severity="warning">This project already has a chart. Confirming will replace it.</Alert>}
      </Stack>}
    </DialogContent>
    <Divider />
    <DialogActions sx={{ px: 3, py: 1.75 }}><Button onClick={onClose} disabled={copying}>Cancel</Button>{preview && <Button variant="contained" startIcon={copying ? <CircularProgress size={15} color="inherit" /> : <ContentCopyOutlinedIcon />} onClick={confirm} disabled={copying} sx={{ bgcolor: "#24106F", textTransform: "none", fontWeight: 800 }}>{destinationHasChart || preview.destinationHasChart ? "Replace and copy" : "Confirm copy"}</Button>}</DialogActions>
  </Dialog>;
}

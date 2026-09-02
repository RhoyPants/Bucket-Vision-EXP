"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, MenuItem, Paper, Slider, Snackbar, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import FitScreenOutlinedIcon from "@mui/icons-material/FitScreenOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import dagre from "dagre";
import { orgChartBuilderService, type OrgChartAnchor, type OrgChartBuilderChart } from "@/app/api-service/orgChartBuilderService";
import { usePermissions } from "@/app/lib/usePermissions";
import OrgChartCopyDialog from "./OrgChartCopyDialog";

type EditorNode = {
  id: string;
  parentId: string | null;
  name: string;
  position: string;
  sortOrder: number;
  x: number;
  y: number;
  photoUrl: string;
  parentAnchor: OrgChartAnchor;
  childAnchor: OrgChartAnchor;
  backgroundColor: string;
  textColor: string;
};

const DEFAULT_BG = "#FFFFFF";
const DEFAULT_TEXT = "#0F172A";
const MIN_NODE_WIDTH = 180;
const MAX_NODE_WIDTH = 280;
const nodeWidth = (node: Pick<EditorNode, "name" | "position">) => Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, node.name.length * 6.2 + 38));
const nodeHeight = (node: Pick<EditorNode, "name" | "position" | "photoUrl">) => {
  const textWidth = Math.max(70, nodeWidth(node) - (node.photoUrl ? 78 : 52));
  const lineEstimate = (value: string, characterWidth: number) => {
    if (!value.trim()) return 0;
    const maxCharacters = Math.max(5, Math.floor(textWidth / characterWidth));
    let lines = 1; let currentLength = 0;
    value.trim().split(/\s+/).forEach((word) => {
      const wordLines = Math.max(1, Math.ceil(word.length / maxCharacters));
      if (wordLines > 1) { lines += wordLines - (currentLength === 0 ? 1 : 0); currentLength = word.length % maxCharacters; return; }
      if (currentLength && currentLength + 1 + word.length > maxCharacters) { lines += 1; currentLength = word.length; }
      else currentLength += (currentLength ? 1 : 0) + word.length;
    });
    return lines;
  };
  const nameLines = node.name ? lineEstimate(node.name, 7.2) : 0;
  const positionLines = Math.max(1, lineEstimate(node.position, node.name ? 6 : 6.5));
  const contentHeight = 20 + nameLines * 15 + positionLines * 13;
  return Math.max(node.photoUrl ? 68 : node.name ? 58 : 50, contentHeight);
};
const newId = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const messageFrom = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
};
const escapeXml = (value: string) => value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]!));

const ORG_CHART_ANCHORS: OrgChartAnchor[] = [
  "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT",
  "RIGHT_TOP", "RIGHT_CENTER", "RIGHT_BOTTOM",
  "BOTTOM_RIGHT", "BOTTOM_CENTER", "BOTTOM_LEFT",
  "LEFT_BOTTOM", "LEFT_CENTER", "LEFT_TOP",
];

const anchorOffset = (anchor: OrgChartAnchor, width: number, height: number) => {
  const positions: Record<OrgChartAnchor, { x: number; y: number }> = {
    TOP_LEFT: { x: width * .25, y: 0 }, TOP_CENTER: { x: width * .5, y: 0 }, TOP_RIGHT: { x: width * .75, y: 0 },
    RIGHT_TOP: { x: width, y: height * .25 }, RIGHT_CENTER: { x: width, y: height * .5 }, RIGHT_BOTTOM: { x: width, y: height * .75 },
    BOTTOM_RIGHT: { x: width * .75, y: height }, BOTTOM_CENTER: { x: width * .5, y: height }, BOTTOM_LEFT: { x: width * .25, y: height },
    LEFT_BOTTOM: { x: 0, y: height * .75 }, LEFT_CENTER: { x: 0, y: height * .5 }, LEFT_TOP: { x: 0, y: height * .25 },
  };
  return positions[anchor];
};

const anchorPoint = (node: EditorNode, anchor: OrgChartAnchor) => {
  const offset = anchorOffset(anchor, nodeWidth(node), nodeHeight(node));
  return { x: node.x + offset.x, y: node.y + offset.y };
};

const anchorSide = (anchor: OrgChartAnchor) => anchor.split("_")[0] as "TOP" | "RIGHT" | "BOTTOM" | "LEFT";
const routedConnectorPath = (start: { x: number; y: number }, end: { x: number; y: number }, sourceAnchor: OrgChartAnchor) => {
  const side = anchorSide(sourceAnchor);
  if (side === "LEFT" || side === "RIGHT") {
    const middleX = start.x + (end.x - start.x) / 2;
    return `M ${start.x} ${start.y} H ${middleX} V ${end.y} H ${end.x}`;
  }
  const middleY = start.y + (end.y - start.y) / 2;
  return `M ${start.x} ${start.y} V ${middleY} H ${end.x} V ${end.y}`;
};

type ChartPoint = { x: number; y: number };
const outwardPoint = (point: ChartPoint, anchor: OrgChartAnchor, distance = 18): ChartPoint => {
  const side = anchorSide(anchor);
  if (side === "LEFT") return { x: point.x - distance, y: point.y };
  if (side === "RIGHT") return { x: point.x + distance, y: point.y };
  if (side === "TOP") return { x: point.x, y: point.y - distance };
  return { x: point.x, y: point.y + distance };
};
const compactPoints = (points: ChartPoint[]) => points.filter((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y).filter((point, index, items) => index === 0 || index === items.length - 1 || !((items[index - 1].x === point.x && point.x === items[index + 1].x) || (items[index - 1].y === point.y && point.y === items[index + 1].y)));
const pointsPath = (points: ChartPoint[]) => compactPoints(points).map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
const segmentHitsRect = (a: ChartPoint, b: ChartPoint, rect: { left: number; right: number; top: number; bottom: number }) => {
  if (a.x === b.x) return a.x > rect.left && a.x < rect.right && Math.max(a.y, b.y) > rect.top && Math.min(a.y, b.y) < rect.bottom;
  if (a.y === b.y) return a.y > rect.top && a.y < rect.bottom && Math.max(a.x, b.x) > rect.left && Math.min(a.x, b.x) < rect.right;
  return false;
};
const responsiveConnectorPath = (start: ChartPoint, end: ChartPoint, sourceAnchor: OrgChartAnchor, targetAnchor: OrgChartAnchor, nodes: EditorNode[], excludedIds: string[]) => {
  const sourceOut = outwardPoint(start, sourceAnchor);
  const targetOut = outwardPoint(end, targetAnchor);
  const bounds = nodes.reduce((result, node) => ({ minX: Math.min(result.minX, node.x), maxX: Math.max(result.maxX, node.x + nodeWidth(node)), minY: Math.min(result.minY, node.y), maxY: Math.max(result.maxY, node.y + nodeHeight(node)) }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const xRoutes = [(sourceOut.x + targetOut.x) / 2, bounds.minX - 28, bounds.maxX + 28];
  const yRoutes = [(sourceOut.y + targetOut.y) / 2, bounds.minY - 28, bounds.maxY + 28];
  const candidates: ChartPoint[][] = [
    ...xRoutes.map((x) => [start, sourceOut, { x, y: sourceOut.y }, { x, y: targetOut.y }, targetOut, end]),
    ...yRoutes.map((y) => [start, sourceOut, { x: sourceOut.x, y }, { x: targetOut.x, y }, targetOut, end]),
  ];
  const obstacles = nodes.filter((node) => !excludedIds.includes(node.id)).map((node) => ({ left: node.x - 8, right: node.x + nodeWidth(node) + 8, top: node.y - 8, bottom: node.y + nodeHeight(node) + 8 }));
  const scored = candidates.map((points) => {
    const compact = compactPoints(points);
    let hits = 0; let length = 0;
    for (let index = 1; index < compact.length; index += 1) { const a = compact[index - 1]; const b = compact[index]; length += Math.abs(a.x - b.x) + Math.abs(a.y - b.y); obstacles.forEach((rect) => { if (segmentHitsRect(a, b, rect)) hits += 1; }); }
    return { points: compact, score: hits * 100000 + length };
  }).sort((a, b) => a.score - b.score);
  return pointsPath(scored[0]?.points ?? [start, end]);
};

function normalize(chart: OrgChartBuilderChart | null): EditorNode[] {
  const source = chart?.nodes ?? [];
  if (!source.length) return [];
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "TB", nodesep: 42, ranksep: 62, marginx: 35, marginy: 30 });
  graph.setDefaultEdgeLabel(() => ({}));
  [...source].sort((a, b) => a.sortOrder - b.sortOrder).forEach((node) => graph.setNode(node.id, { width: nodeWidth({ name: node.name ?? "", position: node.position }), height: nodeHeight({ name: node.name ?? "", position: node.position, photoUrl: node.photoUrl ?? "" }) }));
  source.forEach((node) => { if (node.parentId) graph.setEdge(node.parentId, node.id); });
  dagre.layout(graph);
  return source.map((node) => {
    const fallback = graph.node(node.id);
    return {
    id: node.id,
    parentId: node.parentId,
    name: node.name ?? "",
    position: node.position,
    sortOrder: node.sortOrder,
    x: typeof node.x === "number" ? node.x : Math.round(fallback.x - nodeWidth({ name: node.name ?? "", position: node.position }) / 2),
    y: typeof node.y === "number" ? node.y : Math.round(fallback.y - nodeHeight({ name: node.name ?? "", position: node.position, photoUrl: node.photoUrl ?? "" }) / 2),
    photoUrl: node.photoUrl ?? "",
    parentAnchor: node.parentAnchor ?? "BOTTOM_CENTER",
    childAnchor: node.childAnchor ?? "TOP_CENTER",
    backgroundColor: node.backgroundColor ?? DEFAULT_BG,
    textColor: node.textColor ?? DEFAULT_TEXT,
    };
  });
}

function ChartCanvas({
  nodes, selectedId, editable, zoom, onSelect, onAdd, onMove, onAnchorChange, onCanvasReady,
}: {
  nodes: EditorNode[];
  selectedId: string | null;
  editable: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onAdd: (parentId: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onAnchorChange: (childId: string, endpoint: "parent" | "child", anchor: OrgChartAnchor) => void;
  onCanvasReady?: (element: HTMLDivElement | null) => void;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectionDrag, setConnectionDrag] = useState<{ childId: string; endpoint: "parent" | "child"; pointer: { x: number; y: number }; targetKey?: string; targetValid?: boolean } | null>(null);
  const connectionDragRef = useRef<typeof connectionDrag>(null);
  const layout = useMemo(() => {
    const width = Math.max(1100, ...nodes.map((node) => node.x + nodeWidth(node) + 100));
    const height = Math.max(650, ...nodes.map((node) => node.y + nodeHeight(node) + 100));
    return { width, height };
  }, [nodes]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const activeDrag = connectionDragRef.current;
      if (!activeDrag) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const child = nodes.find((node) => node.id === activeDrag.childId);
      const expectedNodeId = activeDrag.endpoint === "parent" ? child?.parentId : child?.id;
      const expectedNode = nodes.find((node) => node.id === expectedNodeId);
      const pointer = { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
      const nearest = expectedNode ? ORG_CHART_ANCHORS.map((anchor) => ({ anchor, point: anchorPoint(expectedNode, anchor) })).map((candidate) => ({ ...candidate, distance: Math.hypot(pointer.x - candidate.point.x, pointer.y - candidate.point.y) })).sort((a, b) => a.distance - b.distance)[0] : undefined;
      const targetKey = nearest && nearest.distance <= 24 ? `${expectedNodeId}:${nearest.anchor}` : undefined;
      const next = { ...activeDrag, pointer, targetKey, targetValid: Boolean(targetKey) };
      connectionDragRef.current = next;
      setConnectionDrag(next);
    };
    const end = (event: PointerEvent) => {
      const activeDrag = connectionDragRef.current;
      if (!activeDrag) return;
      const targetAnchor = activeDrag.targetKey?.split(":")[1];
      if (targetAnchor) {
        onAnchorChange(activeDrag.childId, activeDrag.endpoint, targetAnchor as OrgChartAnchor);
      }
      connectionDragRef.current = null;
      setConnectionDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
  }, [nodes, onAnchorChange, zoom]);

  const beginEndpointDrag = (childId: string, endpoint: "parent" | "child", pointer: { x: number; y: number }) => {
    const drag = { childId, endpoint, pointer };
    connectionDragRef.current = drag;
    setConnectionDrag(drag);
  };

  return (
    <Box sx={{ width: layout.width * zoom, height: layout.height * zoom, mx: "auto", position: "relative" }}>
      <Box ref={(element: HTMLDivElement | null) => { canvasRef.current = element; onCanvasReady?.(element); }} sx={{ position: "absolute", width: layout.width, height: layout.height, transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform .15s" }}>
        <Box component="svg" viewBox={`0 0 ${layout.width} ${layout.height}`} sx={{ position: "absolute", zIndex: 4, inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
          {nodes.filter((node) => node.parentId).map((node) => {
            const child = nodes.find((item) => item.id === node.id);
            const parent = nodes.find((item) => item.id === node.parentId);
            if (!child || !parent) return null;
            const start = anchorPoint(parent, child.parentAnchor);
            const end = anchorPoint(child, child.childAnchor);
            const path = responsiveConnectorPath(start, end, child.parentAnchor, child.childAnchor, nodes, [parent.id, child.id]);
            const selected = selectedEdgeId === child.id;
            return <g key={`${node.parentId}-${node.id}`}>
              <path d={path} fill="none" stroke={selected ? "#4F46E5" : "#3F5F8F"} strokeWidth={selected ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
              {editable && <path d={path} fill="none" stroke="transparent" strokeWidth="14" pointerEvents="stroke" style={{ cursor: "pointer" }} onClick={(event) => { event.stopPropagation(); setSelectedEdgeId(child.id); onSelect(child.id); }} />}
              {editable && selected && <>
                <circle cx={start.x} cy={start.y} r="7" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" pointerEvents="all" style={{ cursor: "grab" }} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); beginEndpointDrag(child.id, "parent", start); }} />
                <circle cx={end.x} cy={end.y} r="7" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" pointerEvents="all" style={{ cursor: "grab" }} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); beginEndpointDrag(child.id, "child", end); }} />
              </>}
            </g>;
          })}
          {connectionDrag && (() => { const child = nodes.find((node) => node.id === connectionDrag.childId); const parent = nodes.find((node) => node.id === child?.parentId); if (!child || !parent) return null; const fixed = connectionDrag.endpoint === "parent" ? anchorPoint(child, child.childAnchor) : anchorPoint(parent, child.parentAnchor); const start = connectionDrag.endpoint === "parent" ? connectionDrag.pointer : fixed; const end = connectionDrag.endpoint === "parent" ? fixed : connectionDrag.pointer; return <path d={routedConnectorPath(start, end, child.parentAnchor)} fill="none" stroke="#4F46E5" strokeWidth="2" strokeDasharray="5 4" />; })()}
        </Box>
        {nodes.map((node) => {
          const point = { x: node.x, y: node.y };
          return <Box
            key={node.id}
            onPointerDown={(event) => {
              if (!editable || (event.target as HTMLElement).closest("button")) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              event.currentTarget.dataset.startX = String(event.clientX);
              event.currentTarget.dataset.startY = String(event.clientY);
              event.currentTarget.dataset.nodeX = String(node.x);
              event.currentTarget.dataset.nodeY = String(node.y);
            }}
            onPointerMove={(event) => {
              if (!editable || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const startX = Number(event.currentTarget.dataset.startX);
              const startY = Number(event.currentTarget.dataset.startY);
              const originX = Number(event.currentTarget.dataset.nodeX);
              const originY = Number(event.currentTarget.dataset.nodeY);
              onMove(node.id, Math.max(0, Math.round(originX + (event.clientX - startX) / zoom)), Math.max(0, Math.round(originY + (event.clientY - startY) / zoom)));
            }}
            onClick={() => { setSelectedEdgeId(null); onSelect(node.id); }}
            sx={{
              position: "absolute", left: point.x, top: point.y, width: nodeWidth(node), height: nodeHeight(node),
              px: 1.5, py: .8, borderRadius: 1.5, boxSizing: "border-box",
              display: "flex", flexDirection: "column", justifyContent: "center",
              bgcolor: node.backgroundColor, color: node.textColor, cursor: editable ? "grab" : "pointer", touchAction: "none", userSelect: "none",
              "&:active": { cursor: editable ? "grabbing" : "pointer" },
              border: selectedId === node.id ? "2px solid #4F46E5" : "1px solid #94A3B8",
              boxShadow: selectedId === node.id ? "0 0 0 3px rgba(79,70,229,.12)" : "0 3px 9px rgba(15,23,42,.10)",
              transition: "border-color .15s, box-shadow .15s, transform .15s", "&:hover": { transform: "translateY(-1px)", borderColor: "#6366F1" },
            }}
          >
            {editable && <DragIndicatorOutlinedIcon sx={{ position: "absolute", top: 5, right: 5, fontSize: 15, opacity: .5 }} />}
            {node.photoUrl && <Avatar src={node.photoUrl} alt={node.name || node.position} sx={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, border: "2px solid rgba(255,255,255,.8)" }} />}
            {node.name && <Typography title={node.name} sx={{ pl: node.photoUrl ? 5.5 : 1.5, pr: 1.5, textAlign: "center", fontSize: 12, fontWeight: 900, lineHeight: 1.2, textTransform: "uppercase", overflowWrap: "anywhere" }}>{node.name}</Typography>}
            <Typography title={node.position} sx={{ mt: node.name ? .3 : 0, pl: node.photoUrl ? 5.5 : 1, pr: 1, textAlign: "center", fontSize: node.name ? 9.5 : 11, fontWeight: node.name ? 600 : 800, lineHeight: 1.2, overflowWrap: "anywhere" }}>{node.position}</Typography>
            {editable && connectionDrag && (() => { const draggedChild = nodes.find((item) => item.id === connectionDrag.childId); const expectedNodeId = connectionDrag.endpoint === "parent" ? draggedChild?.parentId : draggedChild?.id; if (node.id !== expectedNodeId) return null; return ORG_CHART_ANCHORS.map((anchor) => { const offset = anchorOffset(anchor, nodeWidth(node), nodeHeight(node)); const key = `${node.id}:${anchor}`; const isTarget = connectionDrag.targetKey === key; return <Box key={anchor} data-org-anchor data-node-id={node.id} data-anchor={anchor} title={anchor.replaceAll("_", " ").toLowerCase()} sx={{ position: "absolute", zIndex: 7, left: offset.x, top: offset.y, width: isTarget ? 12 : 9, height: isTarget ? 12 : 9, borderRadius: "50%", transform: "translate(-50%, -50%)", bgcolor: isTarget ? "#16A34A" : "#FFFFFF", border: `2px solid ${isTarget ? "#15803D" : "#4F46E5"}`, boxShadow: "0 1px 3px rgba(15,23,42,.25)", cursor: "crosshair", transition: "all .12s" }} />; }); })()}
            {editable && <Tooltip title="Add position below"><IconButton onClick={(event) => { event.stopPropagation(); onAdd(node.id); }} size="small" sx={{ position: "absolute", zIndex: 6, bottom: -11, right: -11, width: 23, height: 23, bgcolor: "#312E81", color: "#FFF", border: "2px solid #FFF", "&:hover": { bgcolor: "#1E1B4B" } }}><AddOutlinedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>}
          </Box>;
        })}
      </Box>
    </Box>
  );
}

export default function OrgChartBuilder({ projectId }: { projectId: string }) {
  const { canUpdate } = usePermissions();
  const canEdit = canUpdate("projects");
  const [editMode, setEditMode] = useState(false);
  const editable = canEdit && editMode;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportCanvasRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const chart = await orgChartBuilderService.get(projectId);
      const next = normalize(chart);
      setTitle(chart?.title ?? "Project Organization Chart");
      setNodes(next);
      setSelectedId(next[0]?.id ?? null);
      setDirty(false);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load the organization chart builder."));
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, EditorNode[]>();
    nodes.forEach((node) => map.set(node.parentId, [...(map.get(node.parentId) ?? []), node]));
    map.forEach((items) => items.sort((a, b) => a.sortOrder - b.sortOrder));
    return map;
  }, [nodes]);
  const root = (childrenByParent.get(null) ?? [])[0];

  const changeNode = (changes: Partial<EditorNode>) => {
    if (!selectedId) return;
    setNodes((current) => current.map((node) => node.id === selectedId ? { ...node, ...changes } : node));
    setDirty(true);
  };
  const addNode = (parentId: string | null) => {
    if (!canEdit) return;
    if (parentId === null && nodes.length > 0) return;
    const id = newId();
    const siblings = nodes.filter((node) => node.parentId === parentId);
    const parent = nodes.find((node) => node.id === parentId);
    const x = parent ? Math.max(0, parent.x + siblings.length * (MIN_NODE_WIDTH + 30) - ((siblings.length * (MIN_NODE_WIDTH + 30)) / 2)) : 460;
    const y = parent ? parent.y + nodeHeight(parent) + 80 : 35;
    setNodes((current) => [...current, { id, parentId, name: "", position: parentId ? "New Position" : "Project Head", sortOrder: siblings.length, x, y, photoUrl: "", parentAnchor: "BOTTOM_CENTER", childAnchor: "TOP_CENTER", backgroundColor: DEFAULT_BG, textColor: DEFAULT_TEXT }]);
    setSelectedId(id); setDirty(true);
  };
  const descendantsOf = (id: string) => {
    const result = new Set<string>(); const queue = [id];
    while (queue.length) { const parent = queue.shift()!; nodes.filter((node) => node.parentId === parent).forEach((node) => { result.add(node.id); queue.push(node.id); }); }
    return result;
  };
  const changeParent = (parentId: string) => {
    if (!selected || selected.parentId === null || parentId === selected.id || descendantsOf(selected.id).has(parentId)) return;
    if (parentId === selected.parentId) return;
    const siblingCount = nodes.filter((node) => node.parentId === parentId).length;
    setNodes((current) => current.map((node) => node.id === selected.id ? { ...node, parentId, sortOrder: siblingCount } : node));
    setDirty(true);
  };
  const changeConnectionAnchor = useCallback((childId: string, endpoint: "parent" | "child", anchor: OrgChartAnchor) => {
    setNodes((current) => current.map((node) => node.id === childId ? { ...node, ...(endpoint === "parent" ? { parentAnchor: anchor } : { childAnchor: anchor }) } : node));
    setSelectedId(childId); setDirty(true); setNotice("Connector attachment updated. Save the chart to keep it.");
  }, []);
  const moveNode = (id: string, x: number, y: number) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, x, y } : node));
    setDirty(true);
  };
  const autoLayout = () => {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: "TB", nodesep: 42, ranksep: 62, marginx: 35, marginy: 30 });
    graph.setDefaultEdgeLabel(() => ({}));
    [...nodes].sort((a, b) => a.sortOrder - b.sortOrder).forEach((node) => graph.setNode(node.id, { width: nodeWidth(node), height: nodeHeight(node) }));
    [...nodes].sort((a, b) => a.sortOrder - b.sortOrder).forEach((node) => { if (node.parentId) graph.setEdge(node.parentId, node.id); });
    dagre.layout(graph);
    setNodes((current) => current.map((node) => { const point = graph.node(node.id); return { ...node, x: Math.round(point.x - nodeWidth(node) / 2), y: Math.round(point.y - nodeHeight(node) / 2) }; }));
    setDirty(true);
  };
  const moveSibling = (direction: -1 | 1) => {
    if (!selected) return;
    const siblings = [...(childrenByParent.get(selected.parentId) ?? [])];
    const index = siblings.findIndex((node) => node.id === selected.id); const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
    const order = new Map(siblings.map((node, i) => [node.id, i]));
    setNodes((current) => current.map((node) => order.has(node.id) ? { ...node, sortOrder: order.get(node.id)! } : node)); setDirty(true);
  };
  const removeSelected = () => {
    if (!selected || selected.parentId === null) return;
    const removed = new Set([selected.id, ...descendantsOf(selected.id)]);
    setNodes((current) => current.filter((node) => !removed.has(node.id)));
    setSelectedId(selected.parentId); setDirty(true);
  };
  const save = async (exitAfterSave = false) => {
    if (!title.trim()) { setError("Chart title is required."); return; }
    if (!nodes.length) { setError("Add one root position before saving."); return; }
    if (nodes.some((node) => !node.position.trim())) { setError("Every chart box needs a position."); return; }
    setSaving(true);
    try {
      setError("");
      const chart = await orgChartBuilderService.save(projectId, { title: title.trim(), nodes: nodes.map((node) => ({ clientId: node.id, parentClientId: node.parentId, name: node.name.trim() || null, position: node.position.trim(), sortOrder: node.sortOrder, x: Math.round(node.x), y: Math.round(node.y), photoUrl: node.photoUrl || null, parentAnchor: node.parentAnchor, childAnchor: node.childAnchor, backgroundColor: node.backgroundColor || null, textColor: node.textColor || null })) });
      const next = normalize(chart); setNodes(next); setSelectedId(next[0]?.id ?? null); setDirty(false); if (exitAfterSave) setEditMode(false); setNotice("Organization chart saved.");
    } catch (requestError) { setError(messageFrom(requestError, "Unable to save the organization chart.")); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    setSaving(true);
    try { await orgChartBuilderService.remove(projectId); setNodes([]); setSelectedId(null); setTitle("Project Organization Chart"); setDirty(false); setConfirmReset(false); setNotice("Organization chart reset."); }
    catch (requestError) { setError(messageFrom(requestError, "Unable to reset the organization chart.")); }
    finally { setSaving(false); }
  };
  const uploadPhoto = async (file?: File) => {
    if (!file || !selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError("Use a JPG, PNG, or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be 5 MB or smaller."); return; }
    setUploadingPhoto(true);
    try { setError(""); const result = await orgChartBuilderService.uploadPhoto(projectId, file); changeNode({ photoUrl: result.photoUrl }); setNotice("Photo uploaded. Save the chart to keep it on this node."); }
    catch (requestError) { setError(messageFrom(requestError, "Unable to upload the photo.")); }
    finally { setUploadingPhoto(false); }
  };
  const exportChart = async () => {
    const source = exportCanvasRef.current;
    if (!nodes.length || !source) return;
    setExporting(true);
    setError("");
    let svgUrl = "";
    try {
    const clone = source.cloneNode(true) as HTMLDivElement;
    const inlineStyles = (original: Element, copy: Element) => {
      const computed = window.getComputedStyle(original);
      const targetStyle = (copy as HTMLElement | SVGElement).style;
      for (let index = 0; index < computed.length; index += 1) {
        const property = computed.item(index);
        targetStyle.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
      }
      Array.from(original.children).forEach((child, index) => {
        const childCopy = copy.children.item(index);
        if (childCopy) inlineStyles(child, childCopy);
      });
    };
    inlineStyles(source, clone);
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    clone.style.position = "relative";
    clone.style.inset = "auto";
    clone.style.transform = "none";
    clone.style.transition = "none";
    const canvasWidth = Math.ceil(source.offsetWidth);
    const canvasHeight = Math.ceil(source.offsetHeight);
    const padding = 40;
    const titleSpace = 58;
    const width = canvasWidth + padding * 2;
    const height = canvasHeight + padding * 2 + titleSpace;
    const serializedCanvas = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="${padding}" y="38" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#0F172A">${escapeXml(title)}</text><foreignObject x="${padding}" y="${titleSpace}" width="${canvasWidth}" height="${canvasHeight}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${canvasWidth}px;height:${canvasHeight}px;background-color:#F8FAFC;background-image:radial-gradient(#CBD5E1 1px,transparent 1px);background-size:20px 20px;position:relative;overflow:hidden">${serializedCanvas}</div></foreignObject></svg>`;
    svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The chart could not be rendered as an image."));
      image.src = svgUrl;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export is not supported by this browser.");
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    const png = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The PNG file could not be created.")), "image/png");
      } catch (canvasError) { reject(canvasError); }
    });
    const url = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "organization-chart"}.png`;
    anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      setError(messageFrom(exportError, "Unable to export the organization chart as PNG."));
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      setExporting(false);
    }
  };

  if (loading) return <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  return <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }} sx={{ px: 2, py: 1.25, bgcolor: "#FFFFFF", borderBottom: editable ? 0 : "1px solid #E2E8F0" }}>
      {editable ? <TextField value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true); }} size="small" label="Chart title" sx={{ width: { xs: "100%", md: 380 }, "& .MuiInputBase-input": { fontSize: 12.5, fontWeight: 800 } }} /> : <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>{title}</Typography><Typography sx={{ fontSize: 10.5, color: "#64748B" }}>Organization chart</Typography></Box>}
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" spacing={.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}>
        <Stack direction="row" spacing={.75} alignItems="center" sx={{ height: 36, px: 1, border: "1px solid #E2E8F0", borderRadius: 1.5, bgcolor: "#F8FAFC" }}>
          <Tooltip title="Reset zoom"><IconButton size="small" onClick={() => setZoom(1)}><FitScreenOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          <Slider size="small" value={zoom} min={.5} max={1.5} step={.1} onChange={(_, value) => setZoom(value as number)} sx={{ width: 72 }} />
          <Typography sx={{ width: 34, fontSize: 10.5, fontWeight: 800, color: "#475569" }}>{Math.round(zoom * 100)}%</Typography>
        </Stack>
        {!editable && <Button variant="outlined" startIcon={exporting ? <CircularProgress size={15} /> : <FileDownloadOutlinedIcon />} onClick={exportChart} disabled={!nodes.length || exporting} sx={{ textTransform: "none", fontWeight: 800 }}>{exporting ? "Preparing PNG..." : "Export PNG"}</Button>}
        {canEdit && nodes.length > 0 && <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={() => setCopyOpen(true)} disabled={dirty} sx={{ textTransform: "none", fontWeight: 800 }}>Copy chart</Button>}
        {canEdit && !editMode && <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setEditMode(true)} sx={{ bgcolor: "#24106F", textTransform: "none", fontWeight: 800 }}>Edit chart</Button>}
      </Stack>
    </Stack>
    {editable && <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ px: 2, py: 1, bgcolor: "#F8FAFC", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #E2E8F0" }}>
      <Stack direction="row" spacing={.75} alignItems="center"><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4F46E5" }} /><Typography sx={{ fontSize: 11.5, fontWeight: 900, color: "#312E81" }}>Editing chart</Typography><Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 10.5, color: "#64748B" }}>Select a card to update its details or drag it to reposition.</Typography></Stack>
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" spacing={.75} alignItems="center" flexWrap="wrap" useFlexGap>
        <Tooltip title="Arrange all cards into a clean hierarchy"><span><Button size="small" variant="outlined" onClick={autoLayout} disabled={saving || !nodes.length} sx={{ textTransform: "none", fontWeight: 800, color: "#4338CA", borderColor: "#C7D2FE", bgcolor: "#FFFFFF" }}>Auto layout</Button></span></Tooltip>
        <Tooltip title="Delete this project’s entire organization chart"><span><IconButton size="small" color="error" onClick={() => setConfirmReset(true)} disabled={saving || !nodes.length} sx={{ width: 34, height: 34, bgcolor: "#FFFFFF", border: "1px solid #FECACA", borderRadius: 1.5, "&:hover": { bgcolor: "#FEF2F2" } }}><RestartAltOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></span></Tooltip>
        <Button size="small" variant="contained" startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveOutlinedIcon />} onClick={() => dirty ? save(true) : setEditMode(false)} disabled={saving} sx={{ minWidth: 92, bgcolor: "#24106F", textTransform: "none", fontWeight: 900, boxShadow: "none" }}>Done</Button>
      </Stack>
    </Stack>}
    {error && <Alert severity="error" onClose={() => setError("")} sx={{ mx: 2, mt: 1 }}>{error}</Alert>}
    {!canEdit && <Alert severity="info" sx={{ mx: 2, mt: 1 }}>You can view this chart. Project update permission is required to edit it.</Alert>}
    <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: editable && selected ? { xs: "1fr", lg: "minmax(0, 1fr) 320px" } : "1fr" }}>
      <Box sx={{ minWidth: 0, minHeight: 0, overflow: "auto", bgcolor: "#F8FAFC", backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)", backgroundSize: "20px 20px", p: 4 }}>
        {root ? <ChartCanvas nodes={nodes} selectedId={selectedId} editable={editable} zoom={zoom} onSelect={setSelectedId} onAdd={(id) => addNode(id)} onMove={moveNode} onAnchorChange={changeConnectionAnchor} onCanvasReady={(element) => { exportCanvasRef.current = element; }} /> : <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><Stack alignItems="center" spacing={1.25}><Box sx={{ width: 58, height: 58, borderRadius: "50%", bgcolor: "#EEF2FF", display: "grid", placeItems: "center", color: "#4338CA" }}><AccountTreeIcon /></Box><Typography sx={{ fontWeight: 900, color: "#0F172A" }}>Build your project organization chart</Typography><Typography sx={{ fontSize: 12, color: "#64748B", textAlign: "center", maxWidth: 380 }}>Start from a blank chart or copy an existing chart from another accessible project.</Typography>{canEdit && <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => { setEditMode(true); addNode(null); }} sx={{ bgcolor: "#24106F", textTransform: "none", fontWeight: 800 }}>Create blank chart</Button><Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={() => setCopyOpen(true)} sx={{ textTransform: "none", fontWeight: 800 }}>Copy from another project</Button></Stack>}</Stack></Box>}
      </Box>
      {editable && selected && <Paper square elevation={0} sx={{ bgcolor: "#F8FAFC", borderLeft: "1px solid #E2E8F0", minHeight: 0, overflow: "auto" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 2, px: 2, py: 1.5, bgcolor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}><Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>Edit selected card</Typography><Typography sx={{ fontSize: 10.5, color: "#64748B" }}>Select another card on the canvas to edit it.</Typography></Box>
        <Stack spacing={1.25} sx={{ p: 1.5 }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}><Typography sx={{ mb: 1.25, fontSize: 10, fontWeight: 900, color: "#64748B", letterSpacing: .5, textTransform: "uppercase" }}>Person and position</Typography><Stack spacing={1.25}><Stack direction="row" spacing={1.25} alignItems="center"><Avatar src={selected.photoUrl || undefined} sx={{ width: 52, height: 52, bgcolor: "#E0E7FF", color: "#3730A3", fontWeight: 900 }}>{(selected.name || selected.position).charAt(0).toUpperCase()}</Avatar><Box sx={{ minWidth: 0, flex: 1 }}><Button component="label" size="small" variant="outlined" startIcon={uploadingPhoto ? <CircularProgress size={14} /> : <AddAPhotoOutlinedIcon />} disabled={uploadingPhoto} sx={{ textTransform: "none", fontWeight: 800 }}>{selected.photoUrl ? "Change photo" : "Add photo"}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { uploadPhoto(event.target.files?.[0]); event.target.value = ""; }} /></Button>{selected.photoUrl && <Button size="small" color="error" onClick={() => changeNode({ photoUrl: "" })} sx={{ ml: .25, minWidth: 0, textTransform: "none" }}>Remove</Button>}<Typography sx={{ mt: .5, fontSize: 9, color: "#94A3B8" }}>JPG, PNG or WebP · max 5 MB</Typography></Box></Stack><TextField fullWidth size="small" label="Name (optional)" value={selected.name} onChange={(event) => changeNode({ name: event.target.value })} /><TextField fullWidth required size="small" label="Position" value={selected.position} onChange={(event) => changeNode({ position: event.target.value })} multiline maxRows={3} /></Stack></Paper>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}><Typography sx={{ mb: 1.25, fontSize: 10, fontWeight: 900, color: "#64748B", letterSpacing: .5, textTransform: "uppercase" }}>Reporting and appearance</Typography><Stack spacing={1.25}>{selected.parentId !== null && <TextField fullWidth select size="small" label="Reports to" value={selected.parentId} onChange={(event) => changeParent(event.target.value)}>{nodes.filter((node) => node.id !== selected.id && !descendantsOf(selected.id).has(node.id)).map((node) => <MenuItem key={node.id} value={node.id}>{node.name || node.position}</MenuItem>)}</TextField>}<Stack direction="row" spacing={1}><TextField fullWidth size="small" type="color" label="Card" value={selected.backgroundColor} onChange={(event) => changeNode({ backgroundColor: event.target.value })} InputLabelProps={{ shrink: true }} /><TextField fullWidth size="small" type="color" label="Text" value={selected.textColor} onChange={(event) => changeNode({ textColor: event.target.value })} InputLabelProps={{ shrink: true }} /></Stack></Stack></Paper>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}><Typography sx={{ mb: 1.25, fontSize: 10, fontWeight: 900, color: "#64748B", letterSpacing: .5, textTransform: "uppercase" }}>Card actions</Typography><Stack spacing={1}><Button fullWidth variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => addNode(selected.id)} sx={{ bgcolor: "#24106F", boxShadow: "none", textTransform: "none", fontWeight: 800 }}>Add position below</Button><Stack direction="row" spacing={1}><Button fullWidth variant="outlined" startIcon={<KeyboardArrowUpOutlinedIcon />} onClick={() => moveSibling(-1)} sx={{ textTransform: "none" }}>Move left</Button><Button fullWidth variant="outlined" startIcon={<KeyboardArrowDownOutlinedIcon />} onClick={() => moveSibling(1)} sx={{ textTransform: "none" }}>Move right</Button></Stack>{selected.parentId !== null && <Button fullWidth variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={removeSelected} sx={{ textTransform: "none" }}>Delete this branch</Button>}</Stack></Paper>
          <Alert severity="info" icon={<DragIndicatorOutlinedIcon />} sx={{ borderRadius: 2, fontSize: 10.5 }}>Drag cards to position them. To adjust a connector, click its line and drag either endpoint handle to one of the 12 points on the same card.</Alert>
        </Stack>
      </Paper>}
    </Box>
    <Dialog open={confirmReset} onClose={() => !saving && setConfirmReset(false)} maxWidth="xs" fullWidth><DialogTitle sx={{ fontWeight: 900 }}>Reset organization chart?</DialogTitle><DialogContent><Typography sx={{ fontSize: 13, color: "#475569" }}>This permanently deletes the saved chart for this project. This action cannot be undone.</Typography></DialogContent><DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setConfirmReset(false)} disabled={saving}>Cancel</Button><Button color="error" variant="contained" onClick={reset} disabled={saving}>Reset chart</Button></DialogActions></Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice("")} message={notice} />
    <OrgChartCopyDialog open={copyOpen} projectId={projectId} destinationHasChart={nodes.length > 0} onClose={() => setCopyOpen(false)} onCloned={(chart) => { const next = normalize(chart); setTitle(chart.title); setNodes(next); setSelectedId(next[0]?.id ?? null); setDirty(false); setEditMode(true); setCopyOpen(false); setNotice("Organization chart copied. You can now edit this project’s independent copy."); }} />
  </Box>;
}

function AccountTreeIcon() { return <Box component="span" sx={{ fontSize: 28, fontWeight: 900 }}>⌘</Box>; }

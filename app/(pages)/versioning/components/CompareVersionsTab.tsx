"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/redux/store";
import {
  fetchVersionComparison,
  selectVersionsForComparison,
} from "@/app/redux/controllers/versioningController";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface CompareVersionsTabProps {
  projectId: string;
  pin: string;
}

//  Change status colors
const statusColor = (status: string) => {
  switch (status) {
    case "MODIFIED":  return { bg: "#fef9c3", border: "#facc15", text: "#854d0e" };
    case "ADDED":     return { bg: "#dcfce7", border: "#22c55e", text: "#14532d" };
    case "REMOVED":   return { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" };
    default:          return { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" };
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "MODIFIED":  return { label: "Modified",  color: "warning" as const };
    case "ADDED":     return { label: "Added",      color: "success" as const };
    case "REMOVED":   return { label: "Removed",    color: "error"   as const };
    default:          return { label: "Unchanged",  color: "default" as const };
  }
};

// Renders a single field diff inline — only colors the changed value
function FieldDiff({ fieldName, v1, v2 }: { fieldName: string; v1: any; v2: any }) {
  const fmt = (v: any) => {
    if (v == null) return "—";
    if (typeof v === "number" && fieldName.toLowerCase().includes("budget"))
      return `₱${Number(v).toLocaleString()}`;
    if (typeof v === "number" && fieldName.toLowerCase().includes("progress"))
      return `${Number(v).toFixed(1)}%`;
    return String(v);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, mr: 0.5 }}>
        {fieldName}:
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: "#9ca3af", textDecoration: "line-through" }}
      >
        {fmt(v1)}
      </Typography>
      <Typography variant="caption" sx={{ color: "#6b7280", mx: 0.25 }}>→</Typography>
      <Box
        component="span"
        sx={{
          bgcolor: "#fef9c3",
          border: "1px solid #facc15",
          borderRadius: "4px",
          px: 0.75,
          py: 0.1,
          fontSize: 11,
          fontWeight: 700,
          color: "#854d0e",
        }}
      >
        {fmt(v2)}
      </Box>
    </Box>
  );
}

//  Subtask row
function SubtaskRow({ subtask }: { subtask: any }) {
  const { label, color } = statusLabel(subtask.changeStatus);
  const isChanged = subtask.changeStatus !== "UNCHANGED";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        px: 2,
        py: 0.75,
        ml: 4,
        borderLeft: "2px solid #e2e8f0",
        bgcolor: "#fff",
        mb: 0.5,
        borderRadius: "0 4px 4px 0",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#94a3b8", flexShrink: 0 }} />
        <Typography variant="body2" sx={{ flex: 1, color: "#374151" }}>
          {subtask.title}
        </Typography>
        <Chip label={label} color={color} size="small" sx={{ fontSize: 10, height: 18 }} />
      </Box>
      {isChanged && subtask.changedFields?.length > 0 && subtask.v1 && subtask.v2 && (
        <Box sx={{ ml: 2.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {subtask.changedFields.map((f: string) => (
            <FieldDiff key={f} fieldName={f} v1={subtask.v1[f]} v2={subtask.v2[f]} />
          ))}
        </Box>
      )}
    </Box>
  );
}

//  Task row
function TaskRow({ task }: { task: any }) {
  const [expanded, setExpanded] = useState(task.changeStatus !== "UNCHANGED");
  const { label, color } = statusLabel(task.changeStatus);
  const isChanged = task.changeStatus !== "UNCHANGED";

  return (
    <Box sx={{ mb: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          px: 2,
          py: 0.75,
          ml: 2,
          bgcolor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 1,
          cursor: task.subtasks?.length ? "pointer" : "default",
        }}
        onClick={() => task.subtasks?.length && setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {task.subtasks?.length > 0 ? (
            expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : (
            <Box sx={{ width: 12 }} />
          )}
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: "#374151" }}>
            {task.title}
          </Typography>
          <Chip label={label} color={color} size="small" sx={{ fontSize: 10, height: 18 }} />
        </Box>
        {isChanged && task.changedFields?.length > 0 && task.v1 && task.v2 && (
          <Box sx={{ ml: 3, display: "flex", flexWrap: "wrap", gap: 1 }} onClick={(e) => e.stopPropagation()}>
            {task.changedFields.map((f: string) => (
              <FieldDiff key={f} fieldName={f} v1={task.v1[f]} v2={task.v2[f]} />
            ))}
          </Box>
        )}
      </Box>
      <Collapse in={expanded}>
        {task.subtasks?.map((sub: any) => (
          <SubtaskRow key={sub.id} subtask={sub} />
        ))}
      </Collapse>
    </Box>
  );
}

//  Scope card
function ScopeCard({ scope }: { scope: any }) {
  const [expanded, setExpanded] = useState(scope.changeStatus !== "UNCHANGED");
  const { label, color } = statusLabel(scope.changeStatus);
  const isChanged = scope.changeStatus !== "UNCHANGED";

  return (
    <Box sx={{ mb: 2 }}>
      <Paper sx={{ border: "1px solid #e5e7eb", bgcolor: "#fff", overflow: "hidden" }}>
        {/* Scope header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            px: 2,
            py: 1.5,
            cursor: scope.tasks?.length ? "pointer" : "default",
            borderBottom: expanded && scope.tasks?.length ? "1px solid #f0f0f0" : "none",
          }}
          onClick={() => scope.tasks?.length && setExpanded(!expanded)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton size="small" sx={{ p: 0 }}>
              {scope.tasks?.length > 0
                ? (expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
                : <Box sx={{ width: 16 }} />}
            </IconButton>
            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700, color: "#1f2937" }}>
              {scope.name}
            </Typography>
            <Chip label={label} color={color} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
          </Box>
          {/* Only the changed fields are highlighted */}
          {isChanged && scope.changedFields?.length > 0 && scope.v1 && scope.v2 && (
            <Box sx={{ ml: 4.5, display: "flex", flexWrap: "wrap", gap: 1 }} onClick={(e) => e.stopPropagation()}>
              {scope.changedFields.map((f: string) => (
                <FieldDiff key={f} fieldName={f} v1={scope.v1[f]} v2={scope.v2[f]} />
              ))}
            </Box>
          )}
        </Box>

        {/* Tasks */}
        <Collapse in={expanded}>
          {scope.tasks?.length > 0 && (
            <Box sx={{ px: 1, pb: 1.5, pt: 0.5 }}>
              {scope.tasks.map((task: any) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </Box>
          )}
        </Collapse>
      </Paper>
    </Box>
  );
}
//  Main component
export default function CompareVersionsTab({
  projectId,
  pin,
}: CompareVersionsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { allVersions, versionHistory, comparisonVersions, loading, error } =
    useSelector((state: RootState) => state.versioning);

  const [selectedV1, setSelectedV1] = useState<string>("");
  const [selectedV2, setSelectedV2] = useState<string>("");

  const versions = useMemo(() => {
    return allVersions.length > 0 ? allVersions : versionHistory;
  }, [allVersions, versionHistory]);

  // Auto-select version 1 (original/first version) when versions load
  useEffect(() => {
    if (versions.length > 0 && !selectedV1) {
      const v1 = versions.find((v) => v.versionNumber === 1);
      if (v1) setSelectedV1(v1.id);
    }
  }, [versions, selectedV1]);

  const handleCompare = async () => {
    if (selectedV1 && selectedV2 && selectedV1 !== selectedV2) {
      try {
        await dispatch(fetchVersionComparison(selectedV1, selectedV2));
      } catch (err) {
        console.error("Error comparing versions:", err);
      }
    }
  };

  const comparison = comparisonVersions.comparison;
  const summary = comparison?.summary;
  const cVersions = comparison?.versions;
  const scopes = comparison?.scopes ?? [];

  const formatBudget = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(v);

  return (
    <Box>
      {/*  Selector panel  */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
          Compare Two Versions
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Version 1 (Base)</InputLabel>
              <Select
                value={selectedV1}
                label="Version 1 (Base)"
                onChange={(e) => setSelectedV1(e.target.value)}
              >
                <MenuItem value="">Select version...</MenuItem>
                {versions.map((v) => (
                  <MenuItem
                    key={v.id}
                    value={v.id}
                    disabled={v.id === selectedV2}
                  >
                    {v.versionLabel} {v.status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            size={{ xs: 12, sm: 2 }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </Grid>

          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Version 2 (Comparison)</InputLabel>
              <Select
                value={selectedV2}
                label="Version 2 (Comparison)"
                onChange={(e) => setSelectedV2(e.target.value)}
              >
                <MenuItem value="">Select version...</MenuItem>
                {versions.map((v) => (
                  <MenuItem
                    key={v.id}
                    value={v.id}
                    disabled={v.id === selectedV1}
                  >
                    {v.versionLabel} {v.status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompare}
              disabled={
                !selectedV1 ||
                !selectedV2 ||
                selectedV1 === selectedV2 ||
                loading
              }
              fullWidth
            >
              {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {loading ? "Comparing..." : "Compare Versions"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/*  Results  */}
      {comparison && !loading && (
        <Box>
          {/* Header stats */}
          {cVersions && (
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              {[
                {
                  label: "Budget Change",
                  value: formatBudget(summary?.headerChanges?.budgetDiff ?? 0),
                  diff: summary?.headerChanges?.budgetDiff ?? 0,
                  unit: "",
                },
                {
                  label: "Timeline Change",
                  value: `${summary?.headerChanges?.endDateDiff ?? 0} days`,
                  diff: summary?.headerChanges?.endDateDiff ?? 0,
                  unit: "days",
                },
                {
                  label: "Progress Change",
                  value: `${(summary?.headerChanges?.progressDiff ?? 0).toFixed(1)}%`,
                  diff: summary?.headerChanges?.progressDiff ?? 0,
                  unit: "%",
                },
                {
                  label: "Scopes Changed",
                  value: summary?.scopesChanged ?? 0,
                  diff: null,
                  unit: "",
                },
                {
                  label: "Tasks Changed",
                  value: summary?.tasksChanged ?? 0,
                  diff: null,
                  unit: "",
                },
                {
                  label: "Subtasks Changed",
                  value: summary?.subtasksChanged ?? 0,
                  diff: null,
                  unit: "",
                },
              ].map((item) => (
                <Card
                  key={item.label}
                  sx={{ flex: "1 1 140px", minWidth: 130 }}
                >
                  <CardContent sx={{ p: "12px !important" }}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      display="block"
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, lineHeight: 1.2 }}
                    >
                      {item.diff !== null && item.diff > 0 ? "+" : ""}
                      {item.value}
                    </Typography>
                    {item.diff !== null && (
                      <Chip
                        size="small"
                        icon={
                          item.diff > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : item.diff < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )
                        }
                        label={
                          item.diff > 0
                            ? "Increased"
                            : item.diff < 0
                              ? "Decreased"
                              : "No change"
                        }
                        color={
                          item.label === "Budget Change"
                            ? item.diff > 0
                              ? "error"
                              : "success"
                            : item.label === "Progress Change"
                              ? item.diff > 0
                                ? "success"
                                : "error"
                              : item.diff > 0
                                ? "warning"
                                : "success"
                        }
                        sx={{ mt: 0.5, fontSize: 10, height: 18 }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Version header compare */}
          {cVersions && (
            <Paper sx={{ mb: 3, p: 2, border: "1px solid #e5e7eb" }}>
              <Grid container spacing={0}>
                <Grid size={{ xs: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#6b7280" }}
                  >
                    FIELD
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#6b7280" }}
                  >
                    {cVersions.v1?.versionLabel ?? "v1"} (Base)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#6b7280" }}
                  >
                    {cVersions.v2?.versionLabel ?? "v2"} (New)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#6b7280" }}
                  >
                    DIFF
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              {[
                {
                  field: "Total Budget",
                  v1: formatBudget(cVersions.v1?.totalBudget ?? 0),
                  v2: formatBudget(cVersions.v2?.totalBudget ?? 0),
                  diff: `${summary?.headerChanges?.budgetDiff > 0 ? "+" : ""}${formatBudget(summary?.headerChanges?.budgetDiff ?? 0)}`,
                  changed: (summary?.headerChanges?.budgetDiff ?? 0) !== 0,
                },
                {
                  field: "Expected End Date",
                  v1: new Date(
                    cVersions.v1?.expectedEndDate ?? "",
                  ).toLocaleDateString(),
                  v2: new Date(
                    cVersions.v2?.expectedEndDate ?? "",
                  ).toLocaleDateString(),
                  diff: `${summary?.headerChanges?.endDateDiff > 0 ? "+" : ""}${summary?.headerChanges?.endDateDiff ?? 0} days`,
                  changed: (summary?.headerChanges?.endDateDiff ?? 0) !== 0,
                },
                {
                  field: "Progress",
                  v1: `${cVersions.v1?.progress?.toFixed(1) ?? 0}%`,
                  v2: `${cVersions.v2?.progress?.toFixed(1) ?? 0}%`,
                  diff: `${summary?.headerChanges?.progressDiff > 0 ? "+" : ""}${(summary?.headerChanges?.progressDiff ?? 0).toFixed(1)}%`,
                  changed: (summary?.headerChanges?.progressDiff ?? 0) !== 0,
                },
                {
                  field: "Status",
                  v1: cVersions.v1?.status ?? "",
                  v2: cVersions.v2?.status ?? "",
                  diff:
                    cVersions.v1?.status !== cVersions.v2?.status
                      ? "Changed"
                      : "Same",
                  changed: cVersions.v1?.status !== cVersions.v2?.status,
                },
              ].map((row) => (
                <Grid
                  container
                  spacing={0}
                  key={row.field}
                  sx={{
                    py: 0.75,
                    bgcolor: row.changed ? "#fef9c3" : "transparent",
                    borderRadius: 0.5,
                    px: 0.5,
                  }}
                >
                  <Grid size={{ xs: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#374151" }}
                    >
                      {row.field}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      {row.v1}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      {row.v2}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: row.changed ? "#b45309" : "#6b7280",
                      }}
                    >
                      {row.diff}
                    </Typography>
                  </Grid>
                </Grid>
              ))}
            </Paper>
          )}

          {/* Scope tree */}
          {scopes.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}
              >
                Scope Changes
              </Typography>
              <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                {[
                  { label: "Unchanged", bg: "#f8fafc", border: "#e2e8f0" },
                  { label: "Modified", bg: "#fef9c3", border: "#facc15" },
                  { label: "Added", bg: "#dcfce7", border: "#22c55e" },
                  { label: "Removed", bg: "#fee2e2", border: "#ef4444" },
                ].map((l) => (
                  <Box
                    key={l.label}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: l.border,
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {l.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {scopes.map((scope: any) => (
                <ScopeCard key={scope.id} scope={scope} />
              ))}
            </Box>
          )}
        </Box>
      )}

      {!comparison && !loading && (
        <Paper sx={{ p: 4, textAlign: "center", bgcolor: "grey.50" }}>
          <Typography color="textSecondary">
            Select two versions above and click{" "}
            <strong>Compare Versions</strong> to see the breakdown
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

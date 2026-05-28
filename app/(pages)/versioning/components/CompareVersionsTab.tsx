"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/redux/store";
import { fetchVersionComparison } from "@/app/redux/controllers/versioningController";
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
  ButtonGroup,
} from "@mui/material";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import StructuredViewComponent from "@/app/(pages)/approvals/[projectId]/components/StructuredView";
import GanttGridView from "@/app/(pages)/sprintManagement/Components/GridTableView";

type ViewMode = "structured" | "gantt";

interface CompareVersionsTabProps {
  projectId: string;
  pin: string;
}

const CHANGE_COLORS = {
  ADDED: { bg: "#dcfce7", text: "#166534" },
  REMOVED: { bg: "#fee2e2", text: "#991b1b" },
  MODIFIED: { bg: "#dbeafe", text: "#1e40af" },
};

const getChangeCounts = (items: any[] = []) => {
  return items.reduce(
    (acc, item) => {
      const status = item?.changeStatus;
      if (status === "ADDED") acc.ADDED += 1;
      if (status === "REMOVED") acc.REMOVED += 1;
      if (status === "MODIFIED") acc.MODIFIED += 1;
      return acc;
    },
    { ADDED: 0, REMOVED: 0, MODIFIED: 0 },
  );
};

const filterBySide = (items: any[] = [], side: "v1" | "v2") => {
  return items.filter((item) =>
    side === "v1"
      ? item?.changeStatus !== "ADDED"
      : item?.changeStatus !== "REMOVED",
  );
};

const toProgress = (value: any) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num));
};

const createSubtaskMap = (scopes: any[] = []) => {
  const map = new Map();

  scopes.forEach((scope: any) => {
    scope.tasks?.forEach((task: any) => {
      task.subtasks?.forEach((subtask: any) => {
        map.set(subtask.id, subtask);
      });
    });
  });

  return map;
};

const mapScopesForSide = (
  scopes: any[] = [],
  side: "v1" | "v2",
  subtaskMap: Map<string, any>,
) => {
  return filterBySide(scopes, side).map((scope: any, sIdx: number) => {
    const scopeData = scope?.[side] || {};

    return {
      id: scope?.id ?? `scope-${sIdx}`,
      name: scope?.name ?? "Untitled Scope",

      description: scopeData?.description ?? "",
      budgetAllocated: scopeData?.budgetAllocated ?? 0,

      progress: toProgress(scopeData?.progress),
      overallProgress: toProgress(scopeData?.progress),

      changeStatus: scope?.changeStatus,
      changedFields: scope?.changedFields || [],

      tasks: filterBySide(scope?.tasks || [], side).map(
        (task: any, tIdx: number) => {
          const taskData = task?.[side] || {};

          return {
            id: task?.id ?? `task-${sIdx}-${tIdx}`,
            title: task?.title ?? "Untitled Task",

            budgetAllocated: taskData?.budgetAllocated ?? 0,

            progress: toProgress(taskData?.progress),
            overallProgress: toProgress(taskData?.progress),

            changeStatus: task?.changeStatus,
            changedFields: task?.changedFields || [],

            subtasks: filterBySide(task?.subtasks || [], side).map(
              (subtask: any, stIdx: number) => {
                // 🔥 MERGE FULL DETAIL DATA
                let fullSubtask = subtaskMap.get(subtask.id);

                // 🔥 FALLBACK USING TITLE
                if (!fullSubtask) {
                  fullSubtask = Array.from(subtaskMap.values()).find(
                    (s: any) =>
                      s.title?.trim()?.toLowerCase() ===
                      (subtask?.[side]?.title ?? subtask?.title ?? "")
                        .trim()
                        .toLowerCase(),
                  );
                }

                const subtaskData = {
                  ...(subtask?.[side] || {}),
                  ...(fullSubtask || {}),
                };

                return {
                  id: subtask?.id ?? `subtask-${sIdx}-${tIdx}-${stIdx}`,

                  title: subtaskData?.title ?? "Untitled Subtask",

                  progress: toProgress(subtaskData?.progress),
                  overallProgress: toProgress(subtaskData?.progress),

                  projectedStartDate: subtaskData?.projectedStartDate ?? null,

                  projectedEndDate: subtaskData?.projectedEndDate ?? null,

                  budgetAllocated: subtaskData?.budgetAllocated ?? 0,

                  budgetPercent: subtaskData?.budgetPercent ?? 0,

                  changeStatus: subtask?.changeStatus,
                  changedFields: subtask?.changedFields || [],
                };
              },
            ),
          };
        },
      ),
    };
  });
};
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
  const [v1Details, setV1Details] = useState<any>(null);
  const [v2Details, setV2Details] = useState<any>(null);
  const [v1ViewMode, setV1ViewMode] = useState<ViewMode>("structured");
  const [v2ViewMode, setV2ViewMode] = useState<ViewMode>("structured");
  const [detailsLoading, setDetailsLoading] = useState(false);

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
        setDetailsLoading(true);
        setV1Details(null);
        setV2Details(null);

        // Backend now returns both full details + comparison in one response.
        const compareData = await dispatch(
          fetchVersionComparison(selectedV1, selectedV2) as any,
        );

        setV1Details(compareData?.v1Detail || null);
        setV2Details(compareData?.v2Detail || null);

        setV1ViewMode("structured");
        setV2ViewMode("structured");
      } catch (err) {
        console.error("Error comparing versions:", err);
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const comparePayload = comparisonVersions.comparison;
  const comparison = comparePayload?.comparison || comparePayload;
  const summary = comparison?.summary;
  const cVersions = comparison?.versions;
  const v1SubtaskMap = useMemo(
    () => createSubtaskMap(v1Details?.scopes || []),
    [v1Details],
  );

  const v2SubtaskMap = useMemo(
    () => createSubtaskMap(v2Details?.scopes || []),
    [v2Details],
  );
  const scopes = comparison?.scopes ?? [];

  const scopedV1 = useMemo(
    () => scopes.length > 0 ? mapScopesForSide(scopes, "v1", v1SubtaskMap) : v1Details?.scopes || [],
    [scopes, v1SubtaskMap, v1Details],
  );

  const scopedV2 = useMemo(
    () => scopes.length > 0 ? mapScopesForSide(scopes, "v2", v2SubtaskMap) : v2Details?.scopes || [],
    [scopes, v2SubtaskMap, v2Details],
  );

  const changeCounts = useMemo(() => getChangeCounts(scopes), [scopes]);
  const compareMode = scopes.length > 0;

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

          {/* VERSION DETAILS - SIDE BY SIDE WITH TOGGLES */}
          <Box sx={{ mt: 4, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              📊 Version Details Comparison
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip
                size="small"
                label={`Added: ${changeCounts.ADDED}`}
                sx={{
                  bgcolor: CHANGE_COLORS.ADDED.bg,
                  color: CHANGE_COLORS.ADDED.text,
                  fontWeight: 700,
                }}
              />
              <Chip
                size="small"
                label={`Removed: ${changeCounts.REMOVED}`}
                sx={{
                  bgcolor: CHANGE_COLORS.REMOVED.bg,
                  color: CHANGE_COLORS.REMOVED.text,
                  fontWeight: 700,
                }}
              />
              <Chip
                size="small"
                label={`Modified: ${changeCounts.MODIFIED}`}
                sx={{
                  bgcolor: CHANGE_COLORS.MODIFIED.bg,
                  color: CHANGE_COLORS.MODIFIED.text,
                  fontWeight: 700,
                }}
              />
            </Box>

            {detailsLoading ? (
              <Card sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Loading version details...
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {/* VERSION 1 - LEFT COLUMN */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    sx={{
                      p: 2,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1.5,
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        pb: 1.5,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          📌 Version 1 (Base)
                        </Typography>
                        <Chip
                          size="small"
                          label="Removed + Modified"
                          sx={{
                            bgcolor: "#fff7ed",
                            color: "#9a3412",
                            fontWeight: 700,
                            height: 20,
                            fontSize: 10,
                          }}
                        />
                      </Box>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          onClick={() => setV1ViewMode("structured")}
                          variant={
                            v1ViewMode === "structured"
                              ? "contained"
                              : "outlined"
                          }
                          startIcon={<ViewWeekIcon sx={{ fontSize: 16 }} />}
                        >
                          Structured
                        </Button>
                        <Button
                          onClick={() => setV1ViewMode("gantt")}
                          variant={
                            v1ViewMode === "gantt" ? "contained" : "outlined"
                          }
                          startIcon={<ViewAgendaIcon sx={{ fontSize: 16 }} />}
                        >
                          Gantt
                        </Button>
                      </ButtonGroup>
                    </Box>

                    <Box sx={{ overflowX: "auto", minHeight: 400 }}>
                      {v1ViewMode === "structured" ? (
                        <StructuredViewComponent
                          project={{
                            id: v1Details?.id,
                            name: v1Details?.name,
                            scopes: scopedV1,
                          }}
                          compareMode={compareMode}
                        />
                      ) : (
                        <GanttGridView
                          projectId={v1Details?.id}
                          project={v1Details}
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* VERSION 2 - RIGHT COLUMN */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    sx={{
                      p: 2,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1.5,
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        pb: 1.5,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          📌 Version 2 (Comparison)
                        </Typography>
                        <Chip
                          size="small"
                          label="Added + Modified"
                          sx={{
                            bgcolor: "#ecfdf5",
                            color: "#065f46",
                            fontWeight: 700,
                            height: 20,
                            fontSize: 10,
                          }}
                        />
                      </Box>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          onClick={() => setV2ViewMode("structured")}
                          variant={
                            v2ViewMode === "structured"
                              ? "contained"
                              : "outlined"
                          }
                          startIcon={<ViewWeekIcon sx={{ fontSize: 16 }} />}
                        >
                          Structured
                        </Button>
                        <Button
                          onClick={() => setV2ViewMode("gantt")}
                          variant={
                            v2ViewMode === "gantt" ? "contained" : "outlined"
                          }
                          startIcon={<ViewAgendaIcon sx={{ fontSize: 16 }} />}
                        >
                          Gantt
                        </Button>
                      </ButtonGroup>
                    </Box>

                    <Box sx={{ overflowX: "auto", minHeight: 400 }}>
                      {v2ViewMode === "structured" ? (
                        <StructuredViewComponent
                          project={{
                            id: v2Details?.id,
                            name: v2Details?.name,
                            scopes: scopedV2,
                          }}
                          compareMode={compareMode}
                        />
                      ) : (
                        <GanttGridView
                          projectId={v2Details?.id}
                          project={v2Details}
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
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

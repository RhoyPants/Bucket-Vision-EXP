"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import Layout from "@/app/components/shared/Layout";
import KPIModal from "@/app/components/shared/modals/KPIModal";
import DashboardNotes from "./components/DashboardNotes";
import DashboardCharts from "./components/DashboardCharts";
import DashboardModal from "./components/modals/DashboardModal";
import ChartConfigDialog from "./components/ChartConfigDialog";
import SummaryTile from "./components/SummaryTile";
import KpiStatusPieCard from "./components/KpiStatusPieCard";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjects } from "@/app/redux/controllers/projectController";
import { Projects } from "@/app/redux/slices/projectSlice";
import {
  DashboardSummary,
  PersonalDashboard,
  PersonalDashboardKpi,
} from "@/app/api-service/personalDashboardService";
import {
  fetchDashboardChartData,
  fetchPersonalDashboardDetail,
  fetchPersonalDashboards,
  removeDashboard,
  removeKpi,
} from "@/app/redux/controllers/personalDashboardController";
import {
  fetchNotes,
  createNote,
  editNote,
  deleteNote,
  addChecklistItemToNote,
  editChecklistItem,
  removeChecklistItemFromNote,
} from "@/app/redux/controllers/notesController";

const statusColors: Record<string, { bg: string; color: string; accent: string }> = {
  CRITICAL: { bg: "#fef2f2", color: "#b91c1c", accent: "#ef4444" },
  ONFLOW: { bg: "#fffbeb", color: "#b45309", accent: "#f59e0b" },
  HEALTHY: { bg: "#ecfdf5", color: "#047857", accent: "#10b981" },
  UNCLASSIFIED: { bg: "#f3f4f6", color: "#4b5563", accent: "#9ca3af" },
};

const defaultSummary: DashboardSummary = {
  totalKpis: 0,
  criticalKpis: 0,
  onflowKpis: 0,
  healthyKpis: 0,
  unclassifiedKpis: 0,
};

const flatCardSx = {
  borderRadius: 2,
  border: "1px solid #dbeafe",
  boxShadow: "none",
  backgroundColor: "#fff",
};

type ProjectOption = Pick<Projects, "id" | "name">;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getSummary = (dashboard?: PersonalDashboard | null) => dashboard?.summary ?? defaultSummary;

const getProjectName = (dashboard: PersonalDashboard, projects: ProjectOption[]) => {
  if (dashboard.project?.name) return dashboard.project.name;
  const project = projects.find((item) => item.id === dashboard.projectId);
  return project?.name ?? "Project not loaded";
};

export default function PersonalDashboardPage() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.project.projects);
  const {
    dashboards,
    selectedDashboard,
    chartData,
    loading,
    detailLoading,
    error,
  } = useAppSelector((state) => state.personalDashboard);
  const { notes, loading: notesLoading, error: notesError } = useAppSelector((state) => state.notes);
  const authToken = useAppSelector((state) => state.auth.token);
  const [selectedId, setSelectedId] = useState("");
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<PersonalDashboard | null>(null);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<PersonalDashboardKpi | null>(null);
  const [chartConfigOpen, setChartConfigOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"view" | "edit">("view");
  const [localTokenAvailable] = useState(
    () => typeof window !== "undefined" && Boolean(window.localStorage.getItem("token"))
  );
  const hasAccessToken = Boolean(authToken) || localTokenAvailable;
  const isEditMode = interactionMode === "edit";

  const selectedDashboardId = useMemo(() => {
    if (selectedId && dashboards.some((dashboard) => dashboard.id === selectedId)) {
      return selectedId;
    }
    return dashboards[0]?.id ?? "";
  }, [dashboards, selectedId]);

  const loadDashboards = useCallback(async () => {
    try {
      await dispatch(fetchPersonalDashboards());
    } catch {
      // Controller stores the error in Redux.
    }
  }, [dispatch]);

  const loadDetail = useCallback(async () => {
    if (!selectedDashboardId) return;
    try {
      await Promise.all([
        dispatch(fetchPersonalDashboardDetail(selectedDashboardId)),
        dispatch(fetchDashboardChartData(selectedDashboardId)),
      ]);
    } catch {
      // Controller stores the error in Redux.
    }
  }, [dispatch, selectedDashboardId]);

  useEffect(() => {
    if (!hasAccessToken) return;
    if (!projects?.length) dispatch(getProjects());
    loadDashboards();
  }, [dispatch, hasAccessToken, loadDashboards, projects?.length]);

  useEffect(() => {
    if (!hasAccessToken || !selectedDashboardId) return;
    dispatch(fetchNotes(selectedDashboardId) as any);
  }, [dispatch, hasAccessToken, selectedDashboardId]);

  useEffect(() => {
    if (!hasAccessToken) return;
    loadDetail();
  }, [hasAccessToken, loadDetail]);

  useEffect(() => {
    if (isEditMode) return;
    setDashboardModalOpen(false);
    setKpiModalOpen(false);
    setChartConfigOpen(false);
    setEditingDashboard(null);
    setEditingKpi(null);
  }, [isEditMode]);

  const selectedSummary = getSummary(selectedDashboard);
  const canCreateDashboard = dashboards.length < 5;

  const refreshSelected = async () => {
    await loadDashboards();
    await loadDetail();
  };

  const handleDeleteDashboard = async (dashboard: PersonalDashboard) => {
    if (!window.confirm(`Delete "${dashboard.name}"?`)) return;
    await dispatch(removeDashboard(dashboard.id));
    if (selectedId === dashboard.id) setSelectedId("");
    await loadDashboards();
  };

  const handleDeleteKpi = async (kpi: PersonalDashboardKpi) => {
    if (!selectedDashboard?.id || !window.confirm(`Delete KPI "${kpi.name}"?`)) return;
    await dispatch(removeKpi(selectedDashboard.id, kpi.id));
    await refreshSelected();
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1680, mx: "auto" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              border: "1px solid #bfdbfe",
              borderRadius: 2,
              background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
              px: 1,
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 1.25 }}>
                <CircularProgress size={18} />
                <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 600 }}>
                  Loading dashboards
                </Typography>
              </Box>
            ) : dashboards.length === 0 ? (
              <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 600, px: 1, py: 1.5 }}>
                No saved dashboards yet
              </Typography>
            ) : (
              <Tabs
                value={selectedDashboardId || false}
                onChange={(_, value) => setSelectedId(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 48,
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: "#2563EB",
                  },
                  "& .MuiTab-root": {
                    minHeight: 48,
                    textTransform: "none",
                    color: "#64748B",
                    fontWeight: 700,
                    px: 1.5,
                  },
                  "& .Mui-selected": {
                    color: "#1D4ED8",
                  },
                }}
              >
                {dashboards.map((dashboard) => {
                  const summary = getSummary(dashboard);
                  return (
                    <Tab
                      key={dashboard.id}
                      value={dashboard.id}
                      label={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: 260 }}>
                          <Typography
                            component="span"
                            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 800 }}
                          >
                            {dashboard.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={summary.totalKpis}
                            sx={{
                              height: 20,
                              bgcolor: "#E0F2FE",
                              color: "#0369A1",
                              border: "1px solid #7DD3FC",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          />
                        </Stack>
                      }
                    />
                  );
                })}
              </Tabs>
            )}
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ alignSelf: { xs: "stretch", md: "center" } }}
          >
            <ToggleButtonGroup
              value={interactionMode}
              exclusive
              onChange={(_, value) => value && setInteractionMode(value)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  border: "1px solid #dbeafe",
                  color: "#64748B",
                  px: 1.5,
                },
                "& .Mui-selected": {
                  color: "#1E40AF",
                  backgroundColor: "#EFF6FF",
                },
              }}
            >
              <ToggleButton value="view">View Mode</ToggleButton>
              <ToggleButton value="edit">Edit Mode</ToggleButton>
            </ToggleButtonGroup>

            {isEditMode && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!canCreateDashboard}
                onClick={() => {
                  setEditingDashboard(null);
                  setDashboardModalOpen(true);
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  backgroundColor: "#4B2E83",
                  px: 2,
                }}
              >
                Create Dashboard
              </Button>
            )}
          </Stack>
        </Stack>

        <Typography sx={{ color: "#6b7280", fontSize: 13, fontWeight: 600, mb: 2 }}>
          {dashboards.length}/5 dashboards configured
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {dashboards.length === 0 && !loading ? (
          <Card sx={{ ...flatCardSx, border: "2px dashed #93c5fd" }}>
            <CardContent>
              <Alert severity="info">Create your first personal dashboard to start monitoring project KPIs.</Alert>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {!selectedDashboard && !detailLoading ? (
              <Card sx={flatCardSx}>
                <CardContent>
                  <Alert severity="info">Select a dashboard or create a new one.</Alert>
                </CardContent>
              </Card>
            ) : detailLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                <Card sx={flatCardSx}>
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="h5" fontWeight={900}>
                          {selectedDashboard?.name}
                        </Typography>
                        <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                          {selectedDashboard?.description || "No description"}
                        </Typography>
                        <Chip
                          size="small"
                          sx={{ mt: 1, bgcolor: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE", fontWeight: 700 }}
                          label={selectedDashboard?.project?.name ?? getProjectName(selectedDashboard!, projects)}
                        />
                      </Box>
                      {isEditMode && (
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit dashboard">
                            <IconButton
                              onClick={() => {
                                setEditingDashboard(selectedDashboard);
                                setDashboardModalOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chart settings">
                            <IconButton onClick={() => setChartConfigOpen(true)}>
                              <SettingsIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete dashboard">
                            <IconButton color="error" onClick={() => selectedDashboard && handleDeleteDashboard(selectedDashboard)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setEditingKpi(null);
                              setKpiModalOpen(true);
                            }}
                            sx={{ textTransform: "none", fontWeight: 800, backgroundColor: "#4B2E83" }}
                          >
                            Create KPI
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 1.5 }}>
                      <SummaryTile label="Total KPIs" value={selectedSummary.totalKpis} tone="UNCLASSIFIED" />
                      <SummaryTile label="Critical" value={selectedSummary.criticalKpis} tone="CRITICAL" />
                      <SummaryTile label="Onflow" value={selectedSummary.onflowKpis} tone="ONFLOW" />
                      <SummaryTile label="Healthy" value={selectedSummary.healthyKpis} tone="HEALTHY" />
                      <SummaryTile label="Unclassified" value={selectedSummary.unclassifiedKpis} tone="UNCLASSIFIED" />
                    </Box>
                  </CardContent>
                </Card>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
                    gap: 2,
                    alignItems: "stretch",
                    "& > *": { minWidth: 0 },
                  }}
                >
                  <DashboardNotes
                    notes={notes}
                    loading={notesLoading}
                    error={notesError}
                    isEditMode={isEditMode}
                    onCreateNote={async (payload) => {
                      if (!selectedDashboardId) return;
                      await dispatch(createNote(selectedDashboardId, payload) as any);
                    }}
                    onEditNote={async (noteId, payload) => {
                      if (!selectedDashboardId) return;
                      await dispatch(editNote(selectedDashboardId, noteId, payload) as any);
                    }}
                    onDeleteNote={async (noteId) => {
                      if (!selectedDashboardId) return;
                      await dispatch(deleteNote(selectedDashboardId, noteId) as any);
                    }}
                    onAddChecklistItem={async (noteId, payload) => {
                      if (!selectedDashboardId) return;
                      await dispatch(addChecklistItemToNote(selectedDashboardId, noteId, payload) as any);
                    }}
                    onEditChecklistItem={async (noteId, itemId, payload) => {
                      if (!selectedDashboardId) return;
                      await dispatch(editChecklistItem(selectedDashboardId, noteId, itemId, payload) as any);
                    }}
                    onDeleteChecklistItem={async (noteId, itemId) => {
                      if (!selectedDashboardId) return;
                      await dispatch(removeChecklistItemFromNote(selectedDashboardId, noteId, itemId) as any);
                    }}
                  />
                  <KpiStatusPieCard summary={selectedSummary} />
                </Box>

                <Card sx={flatCardSx}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InsightsIcon sx={{ color: "#4B2E83" }} />
                        <Typography fontWeight={900}>Configured KPIs</Typography>
                      </Stack>
                    </Stack>
                    {!selectedDashboard?.kpis?.length ? (
                      <Alert severity="info">
                        {isEditMode
                          ? "No KPIs configured yet. Create one to classify project health."
                          : "No KPIs configured yet."}
                      </Alert>
                    ) : (
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 1.5 }}>
                        {selectedDashboard.kpis.map((kpi) => {
                          const colors = statusColors[kpi.status ?? "UNCLASSIFIED"];
                          const kpiStatus = kpi.status ?? "UNCLASSIFIED";
                          const kpiTone = {
                            CRITICAL: {
                              border: "#fecaca",
                              bg: "linear-gradient(135deg, #fff7f7 0%, #ffffff 78%)",
                            },
                            ONFLOW: {
                              border: "#fde68a",
                              bg: "linear-gradient(135deg, #fffbeb 0%, #ffffff 78%)",
                            },
                            HEALTHY: {
                              border: "#bbf7d0",
                              bg: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 78%)",
                            },
                            UNCLASSIFIED: {
                              border: "#cbd5e1",
                              bg: "linear-gradient(135deg, #f8fafc 0%, #ffffff 78%)",
                            },
                          }[kpiStatus];
                          return (
                            <Box
                              key={kpi.id}
                              sx={{
                                border: `1px solid ${kpiTone.border}`,
                                borderRadius: 2,
                                p: 1.25,
                                background: kpiTone.bg,
                                maxWidth: 250,
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>{kpi.name}</Typography>
                                  <Typography variant="caption" sx={{ color: "#6b7280", fontSize: 11 }}>
                                    {kpi.sourceType ?? "PROJECT"} / {kpi.field ?? "PROGRESS"}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={kpi.status ?? "UNCLASSIFIED"}
                                  sx={{ height: 20, fontSize: 10, bgcolor: "#fff", color: colors.color, border: "1px solid rgba(148, 163, 184, 0.35)", fontWeight: 800 }}
                                />
                              </Stack>
                              <Stack direction="row" spacing={0.5} alignItems="baseline" sx={{ mt: 1 }}>
                                <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: colors.color }}>
                                  {kpi.currentValue ?? "--"}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{kpi.unit ?? "%"}</Typography>
                              </Stack>
                              <Stack spacing={0.25} sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Source</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>
                                    {kpi.sourceDetails?.title ?? kpi.sourceType ?? "PROJECT"}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Start</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>
                                    {kpi.sourceDetails?.expectedStartDate
                                      ? new Date(kpi.sourceDetails.expectedStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                      : "—"}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>End</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>
                                    {kpi.sourceDetails?.expectedEndDate
                                      ? new Date(kpi.sourceDetails.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                      : "—"}
                                  </Typography>
                                </Stack>
                              </Stack>
                              {isEditMode && (
                                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                                  <Button
                                    size="small"
                                    startIcon={<EditIcon sx={{ fontSize: "14px !important" }} />}
                                    sx={{ fontSize: 11, py: 0.25, px: 0.75, minWidth: 0 }}
                                    onClick={() => {
                                      setEditingKpi(kpi);
                                      setKpiModalOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: "14px !important" }} />} sx={{ fontSize: 11, py: 0.25, px: 0.75, minWidth: 0 }} onClick={() => handleDeleteKpi(kpi)}>
                                    Delete
                                  </Button>
                                </Stack>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoGraphIcon sx={{ color: "#4B2E83" }} />
                  <Typography fontWeight={900}>Dashboard Charts</Typography>
                  {chartData?.scurve?.status && <Chip size="small" icon={<WarningAmberIcon />} label={chartData.scurve.status} />}
                </Stack>
                <DashboardCharts dashboard={selectedDashboard} chartData={chartData} />
              </Stack>
            )}
          </Box>
        )}

        <DashboardModal
          open={dashboardModalOpen}
          onClose={() => setDashboardModalOpen(false)}
          onSaved={refreshSelected}
          projects={projects}
          dashboard={editingDashboard}
          dashboardCount={dashboards.length}
        />
        <KPIModal
          open={kpiModalOpen}
          onClose={() => setKpiModalOpen(false)}
          onSaved={refreshSelected}
          dashboard={selectedDashboard}
          editingKpi={editingKpi}
        />
        <ChartConfigDialog
          open={chartConfigOpen}
          onClose={() => setChartConfigOpen(false)}
          dashboard={selectedDashboard}
          onSaved={refreshSelected}
        />
      </Box>
    </Layout>
  );
}

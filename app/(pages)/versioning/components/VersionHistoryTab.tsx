"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/app/redux/hook";
import { RootState } from "@/app/redux/store";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
  GitCompareArrows,
} from "lucide-react";
import { fetchVersionDetail } from "@/app/redux/controllers/versioningController";
import GanttGridView from "@/app/(pages)/sprintManagement/Components/GridTableView";
import StructuredViewComponent from "@/app/(pages)/approvals/[projectId]/components/StructuredView";

type ViewMode = "structured" | "gantt";

interface VersionHistoryTabProps {
  projectId: string;
  pin: string;
  onSelectForComparison: (v1: any, v2: any) => void;
}

export default function VersionHistoryTab({
  projectId,
  pin,
  onSelectForComparison,
}: VersionHistoryTabProps) {
  const dispatch = useAppDispatch();
  const { allVersions, versionHistory } = useSelector(
    (state: RootState) => state.versioning
  );
  const { fullProject } = useSelector(
    (state: RootState) => state.project
  );

  const [selectedVersionForDetail, setSelectedVersionForDetail] = useState<any>(null);
  const [detailViewMode, setDetailViewMode] = useState<ViewMode>("structured");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const versions = useMemo(() => {
    return allVersions.length > 0 ? allVersions : versionHistory;
  }, [allVersions, versionHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "DRAFT":
        return "warning";
      case "ARCHIVED":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "DRAFT":
        return <Clock className="w-4 h-4" />;
      case "ARCHIVED":
        return <Archive className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(budget);
  };

  const handleViewDetails = async (version: any) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedVersionForDetail(version);
      
      // Dispatch to Redux to fetch full version detail with scopes, tasks, subtasks
      await dispatch(fetchVersionDetail(version.id) as any);
      setDetailViewMode("structured");
    } catch (err: any) {
      console.error("Error fetching version details:", err);
      setDetailError(err.response?.data?.message || "Failed to load version details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedVersionForDetail(null);
  };

  if (!versions || versions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="textSecondary">
          No versions found. Create a new version to get started!
        </Typography>
      </Box>
    );
  }

  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  // The active version — or if none, the highest versionNumber
  const latestVersion = sortedVersions.find((v) => v.status === "ACTIVE") || sortedVersions[0];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
          Version Timeline
        </Typography>

        {/* Custom Timeline */}
        <Box>
          {sortedVersions.map((version, index) => {
            const isLatest = version.id === latestVersion?.id;
            const dotColor =
              version.status === "ACTIVE" ? "#22c55e"
              : version.status === "DRAFT" ? "#f59e0b"
              : "#94a3b8";
            const lineColor =
              version.status === "ACTIVE" ? "#22c55e"
              : version.status === "DRAFT" ? "#f59e0b"
              : "#e2e8f0";
            return (
            <Box
              key={version.id}
              sx={{
                display: "flex",
                mb: 3,
                position: "relative",
                "&:not(:last-child)::before": {
                  content: '""',
                  position: "absolute",
                  left: "15px",
                  top: "50px",
                  width: "2px",
                  height: "60px",
                  backgroundColor: lineColor,
                },
              }}
            >
              {/* Timeline Dot */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: dotColor,
                  color: "white",
                  mr: 2,
                  mt: 0.5,
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: isLatest ? `0 0 0 4px ${dotColor}40` : "none",
                }}
              >
                {getStatusIcon(version.status)}
              </Box>

              {/* Timeline Content */}
              <Box sx={{ flex: 1 }}>
                <Card sx={{
                  mb: 2,
                  border: isLatest ? "2px solid #22c55e" : "1px solid #e2e8f0",
                  boxShadow: isLatest ? "0 4px 16px rgba(34,197,94,0.15)" : 1,
                  bgcolor: isLatest ? "#f0fdf4" : "#fff",
                }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            {version.versionLabel}
                          </Typography>
                          {isLatest && (
                            <Chip
                              label="Current Version"
                              size="small"
                              sx={{ bgcolor: "#22c55e", color: "#fff", fontWeight: 700, fontSize: 10, height: 20 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          Version {version.versionNumber} •{" "}
                          {formatDate(version.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label={version.status}
                        color={getStatusColor(version.status) as any}
                        size="small"
                        icon={getStatusIcon(version.status) as any}
                      />
                    </Box>

                    {version.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {version.description}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          Total Budget
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {formatBudget(version.totalBudget)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          Expected End Date
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {new Date(version.expectedEndDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          Progress
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {version.progress.toFixed(1)}%
                        </Typography>
                      </Grid>
                      {("_count" in version) && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" display="block" color="textSecondary">
                            Scopes
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                            {(version as any)._count?.scopes || 0} scopes
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<GitCompareArrows className="w-4 h-4" />}
                        onClick={() => {
                          if (sortedVersions.length > 1 && index < sortedVersions.length - 1) {
                            onSelectForComparison(version, sortedVersions[index + 1]);
                          }
                        }}
                        disabled={index >= sortedVersions.length - 1}
                      >
                        Compare
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        sx={{ ml: "auto" }}
                        onClick={() => handleViewDetails(version)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
        <Typography variant="body2" color="info.darker">
          💡 <strong>Tip:</strong> Select two versions to compare their changes, budgets,
          and timelines.
        </Typography>
      </Box>

      {/* VERSION DETAIL MODAL */}
      <Dialog
        open={!!selectedVersionForDetail}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: "90vh" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              📋 {selectedVersionForDetail?.versionLabel}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Version {selectedVersionForDetail?.versionNumber} • {formatDate(selectedVersionForDetail?.createdAt)}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetail} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {selectedVersionForDetail ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* VERSION SUMMARY */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedVersionForDetail?.status}
                  size="small"
                  color={
                    selectedVersionForDetail?.status === "ACTIVE"
                      ? "success"
                      : selectedVersionForDetail?.status === "DRAFT"
                      ? "warning"
                      : "default"
                  }
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
                  Budget
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {formatBudget(fullProject?.totalBudget || selectedVersionForDetail?.totalBudget || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
                  Expected End Date
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {new Date(selectedVersionForDetail?.expectedEndDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
                  Progress
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {selectedVersionForDetail?.progress?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* SHOW VIEW TOGGLE AND CONTENT ONLY WHEN DATA IS LOADED */}
            {detailLoading ? (
              <Card sx={{ border: "1px solid #e5e7eb", p: 4, bgcolor: "#fafbff", textAlign: "center" }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Loading project details...
                </Typography>
              </Card>
            ) : detailError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {detailError}
              </Alert>
            ) : (
              <>
                {/* VIEW TOGGLE */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#7D8693" }}>
                    View:
                  </Typography>
                  <ButtonGroup variant="outlined" size="small">
                    <Button
                      onClick={() => setDetailViewMode("structured")}
                      variant={detailViewMode === "structured" ? "contained" : "outlined"}
                      startIcon={<ViewWeekIcon />}
                    >
                      Structured
                    </Button>
                    <Button
                      onClick={() => setDetailViewMode("gantt")}
                      variant={detailViewMode === "gantt" ? "contained" : "outlined"}
                      startIcon={<ViewAgendaIcon />}
                    >
                      Gantt
                    </Button>
                  </ButtonGroup>
                </Box>

                {/* PROJECT DETAIL VIEW */}
                <Card sx={{ border: "1px solid #e5e7eb", p: 2, bgcolor: "#fafbff" }}>
                  {detailViewMode === "structured" ? (
                    <StructuredViewComponent
                      project={{
                        id: fullProject?.id,
                        name: fullProject?.name,
                        scopes: fullProject?.scopes || [],
                      }}
                    />
                  ) : (
                    <Box sx={{ overflowX: "auto" }}>
                      <GanttGridView projectId={fullProject?.id} project={fullProject} />
                    </Box>
                  )}
                </Card>
              </>
            )}
          </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="textSecondary">
                Select a version to view details
              </Typography>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetail} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

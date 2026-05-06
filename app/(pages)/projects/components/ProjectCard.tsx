"use client";

import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { ProjectApprovalStatusCard } from "@/app/components/shared/modals/ApprovalModals";
import { ProjectCardActions, ViewType } from "./types";

interface ProjectCardProps {
  project: any;
  actions: ProjectCardActions;
  viewType: ViewType;
  gridTemplate?: string;
}

export const formatLocation = (location: any): string => {
  if (!location) return "No location";
  const { street, barangayName, cityName, provinceName } = location;
  return (
    [street, barangayName, cityName, provinceName].filter(Boolean).join(", ") ||
    "No location"
  );
};

const priorityColor = (priority: string) => {
  if (priority === "High") return "#ef4444";
  if (priority === "Medium") return "#f59e0b";
  return "#22c55e";
};

const statusChipColor = (status: string) => {
  if (status === "ACTIVE") return { bg: "#ecfdf5", color: "#10b981" };
  if (status === "FOR_REVIEW" || status === "FOR_APPROVAL")
    return { bg: "#fffbeb", color: "#f59e0b" };
  if (status === "ARCHIVED") return { bg: "#f3f4f6", color: "#6b7280" };
  if (status === "NEEDS_REVISION") return { bg: "#fef2f2", color: "#ef4444" };
  return { bg: "#f3f4f6", color: "#6b7280" };
};

export default function ProjectCard({
  project,
  actions,
  viewType,
  gridTemplate = "1fr 110px 170px 110px 80px 160px",
}: ProjectCardProps) {
  const isActive = project.status === "ACTIVE";
  const isArchived = project.status === "ARCHIVED";
  const isForApproval =
    project.status === "FOR_APPROVAL" || project.status === "FOR_REVIEW";
  const needsSetup =
    !project.status ||
    project.status === "DRAFT" ||
    project.status === "FOR_REVIEW" ||
    project.status === "NEEDS_REVISION";

  const chipStyle = statusChipColor(project.status);

  if (viewType === "list") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.5,
          border: isForApproval ? "1px solid #ff9800" : "1px solid #e5e7eb",
          borderRadius: 2,
          backgroundColor: isForApproval ? "#fffbf0" : isArchived ? "#fafafa" : "#fff",
          transition: "all 0.2s",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(75,46,131,0.12)",
            borderColor: isArchived ? "#9ca3af" : "#4B2E83",
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {project.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {project.description || "No description"}
          </Typography>
        </Box>

        <Box>
          <Chip
            size="small"
            label={project.status || "DRAFT"}
            sx={{ fontSize: 10, fontWeight: 600, bgcolor: chipStyle.bg, color: chipStyle.color }}
          />
        </Box>

        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            📅 {project.startDate?.slice(0, 10) || "Not set"}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            → {project.expectedEndDate?.slice(0, 10) || "Not set"}
          </Typography>
        </Box>

        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            🏢 {project.businessUnit || "—"}
          </Typography>
        </Box>

        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
          {project.priority && (
            <Chip
              size="small"
              label={project.priority}
              sx={{
                bgcolor: priorityColor(project.priority),
                color: "#fff",
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
          {isActive && (
            <>
              <Tooltip title="Team Management">
                <Button
                  size="small"
                  variant="contained"
                  sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 12, backgroundColor: "#10b981", "&:hover": { backgroundColor: "#059669" } }}
                  onClick={(e) => { e.stopPropagation(); actions.onTeamManage(project); }}
                >👥</Button>
              </Tooltip>
              <Tooltip title="Project Versioning">
                <Button
                  size="small"
                  variant="contained"
                  sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 12, backgroundColor: "#8b5cf6", "&:hover": { backgroundColor: "#7c3aed" } }}
                  onClick={(e) => { e.stopPropagation(); actions.onVersion(project); }}
                >🔄</Button>
              </Tooltip>
            </>
          )}
          {needsSetup && (
            <Tooltip title="Setup Project">
              <Button
                size="small"
                variant="outlined"
                sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 12, borderColor: "#f59e0b", color: "#f59e0b", "&:hover": { borderColor: "#d97706", backgroundColor: "#fef3c7" } }}
                onClick={(e) => { e.stopPropagation(); actions.onSetup(project.id); }}
              >⚙️</Button>
            </Tooltip>
          )}
          {isForApproval && (
            <Tooltip title="View Approval">
              <Button
                size="small"
                variant="outlined"
                sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 12, borderColor: "#f59e0b", color: "#f59e0b", "&:hover": { borderColor: "#d97706", backgroundColor: "#fef3c7" } }}
                onClick={(e) => { e.stopPropagation(); actions.onViewApproval(project); }}
              >👁️</Button>
            </Tooltip>
          )}
          {!isArchived && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); actions.onEdit(project); }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Sprint Management">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); actions.onSprint(project.id); }}>
              <AssignmentIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); actions.onDelete(project.id); }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    );
  }

  // ─── CARD VIEW ─────────────────────────────────────────────────────────────
  return (
    <Card
      sx={{
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.25s ease",
        border: isForApproval
          ? "2px solid #ff9800"
          : isArchived
          ? "1px solid #d1d5db"
          : "1px solid #e5e7eb",
        backgroundColor: isForApproval ? "#fffbf0" : isArchived ? "#fafafa" : "#fff",
        opacity: isArchived ? 0.85 : 1,
        "&:hover": {
          boxShadow: "0 8px 16px rgba(75, 46, 131, 0.12)",
          borderColor: isArchived ? "#9ca3af" : "#4B2E83",
        },
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" gap={2} mb={1.5}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              {project.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: 40,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {project.description || "No description"}
            </Typography>
          </Box>
          <Stack spacing={0.5} alignItems="flex-end">
            {project.priority && (
              <Chip
                size="small"
                label={project.priority}
                sx={{ bgcolor: priorityColor(project.priority), color: "#fff", fontWeight: 600 }}
              />
            )}
            <Chip
              size="small"
              label={project.status || "DRAFT"}
              sx={{ fontSize: 10, fontWeight: 600, bgcolor: chipStyle.bg, color: chipStyle.color }}
            />
          </Stack>
        </Box>

        <Stack spacing={0.75} sx={{ mb: 2, fontSize: 12, color: "#6b7280" }}>
          <Typography variant="caption" display="block">
            📍 {formatLocation(project.location)}
          </Typography>
          <Typography variant="caption" display="block">
            📅 {project.startDate?.slice(0, 10) || "Not set"} → {project.expectedEndDate?.slice(0, 10) || "Not set"}
          </Typography>
          <Typography variant="caption" display="block">
            🏢 {project.businessUnit || "No BU"}
          </Typography>
        </Stack>
      </CardContent>

      <Box sx={{ px: 2, py: 1.5 }}>
        <ProjectApprovalStatusCard
          project={project}
          onViewApproval={() => actions.onViewApproval(project)}
          onResubmit={() => actions.onSubmitForApproval(project)}
          compact={false}
        />
      </Box>

      <Box sx={{ px: 2, py: 2, borderTop: "1px solid #e5e7eb", mt: "auto" }}>
        <Stack direction="column" spacing={1.5}>
          {isActive && (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Manage team members">
                <Button
                  size="small"
                  fullWidth
                  variant="contained"
                  onClick={(e) => { e.stopPropagation(); actions.onTeamManage(project); }}
                  sx={{ textTransform: "none", backgroundColor: "#10b981", "&:hover": { backgroundColor: "#059669" } }}
                >
                  👥 Team
                </Button>
              </Tooltip>
              <Tooltip title="Create or manage project versions">
                <Button
                  size="small"
                  fullWidth
                  variant="contained"
                  onClick={(e) => { e.stopPropagation(); actions.onVersion(project); }}
                  sx={{ textTransform: "none", backgroundColor: "#8b5cf6", "&:hover": { backgroundColor: "#7c3aed" } }}
                >
                  🔄 Version
                </Button>
              </Tooltip>
            </Stack>
          )}

          {needsSetup && (
            <Tooltip title="Configure team, scopes, and tasks">
              <Button
                size="small"
                fullWidth
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={(e) => { e.stopPropagation(); actions.onSetup(project.id); }}
                sx={{ textTransform: "none", borderColor: "#f59e0b", color: "#f59e0b", "&:hover": { borderColor: "#d97706", backgroundColor: "#fef3c7" } }}
              >
                ⚙️ Setup
              </Button>
            </Tooltip>
          )}

          <Stack direction="row" spacing={1}>
            {!isArchived && (
              <Tooltip title="Edit Project">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); actions.onEdit(project); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Sprint Management">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); actions.onSprint(project.id); }}>
                <AssignmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); actions.onDelete(project.id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}

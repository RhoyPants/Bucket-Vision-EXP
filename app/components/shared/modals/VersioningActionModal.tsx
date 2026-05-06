"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/redux/store";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import {
  fetchVersionHistory,
  createVersion,
  removeDraftVersion,
} from "@/app/redux/controllers/versioningController";
import { CheckCircle, Copy, AlertCircle } from "lucide-react";

interface VersioningActionModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  activeVersion?: any;
}

export default function VersioningActionModal({
  open,
  onClose,
  projectId,
  projectName = "Project",
  activeVersion,
}: VersioningActionModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { versionHistory, loading, error } = useSelector(
    (state: RootState) => state.versioning
  );

  const [draftVersion, setDraftVersion] = useState<any>(null);
  const [action, setAction] = useState<"choose" | "proceed" | "create">("choose");
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  // Load versions when modal opens
  useEffect(() => {
    if (open && projectId) {
      dispatch(fetchVersionHistory(projectId));
    }
  }, [open, projectId, dispatch]);

  // Check for draft version
  useEffect(() => {
    if (versionHistory && versionHistory.length > 0) {
      const draft = versionHistory.find((v: any) => v.status === "DRAFT");
      setDraftVersion(draft);
    }
  }, [versionHistory]);

  const handleProceedToDraft = async () => {
    if (!draftVersion) return;

    try {
      setLoadingAction(true);
      setActionError("");

      // Redirect to setup page with draft project
      onClose();
      router.push(`/projects/${draftVersion.id}/setup`);
    } catch (err: any) {
      setActionError(
        err?.message || "Failed to proceed to draft version"
      );
      console.error("Error proceeding to draft:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteAndCreateNew = async () => {
    if (!draftVersion || !projectId) return;

    try {
      setLoadingAction(true);
      setActionError("");

      // Delete the draft version
      await dispatch(removeDraftVersion(draftVersion.id) as any);

      // Create new version (clone from active)
      const payload = {
        projectedEndDate: activeVersion?.expectedEndDate
          ? new Date(activeVersion.expectedEndDate).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        totalBudget: activeVersion?.totalBudget || 0,
        remarks: `New version cloned from ${activeVersion?.versionLabel || "v1"}`,
      };

      const result = await dispatch(createVersion(projectId, payload) as any);

      if (result?.newProject) {
        const newProjectId = result.newProject.id;
        onClose();
        router.push(`/projects/${newProjectId}/setup`);
      } else {
        setActionError("Version created but could not get the new project ID.");
      }
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to create new version"
      );
      console.error("Error creating new version:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateNew = async () => {
    if (!projectId) return;

    try {
      setLoadingAction(true);
      setActionError("");

      // Create new version (clone from active)
      const payload = {
        projectedEndDate: activeVersion?.expectedEndDate
          ? new Date(activeVersion.expectedEndDate).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        totalBudget: activeVersion?.totalBudget || 0,
        remarks: `New version cloned from ${activeVersion?.versionLabel || "v1"}`,
      };

      const result = await dispatch(createVersion(projectId, payload) as any);

      if (result?.newProject) {
        const newProjectId = result.newProject.id;
        onClose();
        router.push(`/projects/${newProjectId}/setup`);
      } else {
        setActionError("Version created but could not get the new project ID.");
      }
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to create new version"
      );
      console.error("Error creating new version:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const isLoading = loading || loadingAction;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>
        🔄 Project Versioning
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}

        {loading && !draftVersion && action === "choose" ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* INITIAL CHOICE */}
            {action === "choose" && (
              <Stack spacing={2}>
                <Typography variant="body2" color="textSecondary">
                  {draftVersion
                    ? "We detected an existing draft version. What would you like to do?"
                    : "Ready to create a new version of this project."}
                </Typography>

                {draftVersion && (
                  <Card sx={{ bgcolor: "info.light" }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <AlertCircle className="w-5 h-5" color="#1976d2" />
                          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                            Existing Draft Version
                          </Typography>
                        </Box>
                        <Typography variant="caption" display="block">
                          <strong>Version:</strong> {draftVersion.versionLabel}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Status:</strong> Draft
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Created:</strong>{" "}
                          {new Date(draftVersion.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {draftVersion && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => setAction("proceed")}
                      fullWidth
                    >
                      Continue with Draft Version
                    </Button>
                  )}

                  <Button
                    variant={draftVersion ? "outlined" : "contained"}
                    color="primary"
                    size="small"
                    startIcon={<Copy className="w-4 h-4" />}
                    onClick={() => setAction("create")}
                    fullWidth
                  >
                    {draftVersion
                      ? "Delete Draft & Create New Version"
                      : "Create New Version"}
                  </Button>
                </Box>
              </Stack>
            )}

            {/* PROCEED TO DRAFT */}
            {action === "proceed" && (
              <Stack spacing={2}>
                <Alert severity="info">
                  You'll continue editing and customizing the draft version in the
                  Project Setup page.
                </Alert>

                <Card sx={{ bgcolor: "success.light" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <CheckCircle className="w-5 h-5" color="#4caf50" />
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        Draft Version Ready
                      </Typography>
                    </Box>
                    <Typography variant="caption" display="block">
                      {draftVersion?.versionLabel} - Redirecting to setup...
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {/* CREATE NEW VERSION */}
            {action === "create" && (
              <Stack spacing={2}>
                <Alert severity="info">
                  Your draft version will be deleted and a new version will be created
                  by cloning the current active version.
                </Alert>

                <Card sx={{ bgcolor: "warning.light" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Copy className="w-5 h-5" color="#f59e0b" />
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        Creating New Version
                      </Typography>
                    </Box>
                    <Typography variant="caption" display="block">
                      Cloning from: {activeVersion?.versionLabel || "v1"} (Active)
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
        >
          Cancel
        </Button>

        {action === "choose" && (
          <Button
            onClick={onClose}
            variant="contained"
            disabled={isLoading}
          >
            Close
          </Button>
        )}

        {action === "proceed" && (
          <Button
            onClick={handleProceedToDraft}
            variant="contained"
            color="success"
            disabled={isLoading}
            startIcon={loadingAction && <CircularProgress size={16} />}
          >
            {loadingAction ? "Loading..." : "Continue to Draft"}
          </Button>
        )}

        {action === "create" && (
          <Button
            onClick={draftVersion ? handleDeleteAndCreateNew : handleCreateNew}
            variant="contained"
            color="warning"
            disabled={isLoading}
            startIcon={loadingAction && <CircularProgress size={16} />}
          >
            {loadingAction ? "Creating..." : "Create New Version"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

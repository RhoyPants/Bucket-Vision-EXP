"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import {
  getApprovalFlows,
  deleteFlow,
  setFlowAsDefault,
} from "@/app/redux/controllers/approvalFlowController";
import dynamic from "next/dynamic";
import { usePermissions } from "@/app/lib/usePermissions";

const ApprovalFlowForm = dynamic(() => import("./ApprovalFlowForm"), {
  ssr: false,
});

export default function ApprovalFlowsList() {
  const dispatch = useDispatch<AppDispatch>();
  const { flows, loading, error } = useSelector(
    (state: RootState) => state.approvalFlow
  );
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const canCreateApprovalFlow = canCreate("settings_approval_flows");
  const canUpdateApprovalFlow = canUpdate("settings_approval_flows");
  const canDeleteApprovalFlow = canDelete("settings_approval_flows");

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editFlowId, setEditFlowId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [defaultDialog, setDefaultDialog] = useState(false);
  const [selectedDefaultFlow, setSelectedDefaultFlow] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    dispatch(getApprovalFlows());
  }, [dispatch]);

  const handleDeleteClick = (flowId: string) => {
    if (!canDeleteApprovalFlow) return;
    setSelectedFlowId(flowId);
    setDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFlowId || !canDeleteApprovalFlow) return;
    try {
      setDeleting(true);
      await dispatch(deleteFlow(selectedFlowId));
      setDeleteDialog(false);
      setSelectedFlowId(null);
    } catch (err) {
      console.error("Error deleting flow:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefaultClick = (flow: { id: string; name: string }) => {
    if (!canUpdateApprovalFlow) return;
    setSelectedDefaultFlow(flow);
    setDefaultDialog(true);
  };

  const handleConfirmSetDefault = async () => {
    if (!selectedDefaultFlow || !canUpdateApprovalFlow) return;
    try {
      setSettingDefault(true);
      await dispatch(setFlowAsDefault(selectedDefaultFlow.id));
      setDefaultDialog(false);
      setSelectedDefaultFlow(null);
    } catch (err) {
      console.error("Error setting default flow:", err);
    } finally {
      setSettingDefault(false);
    }
  };

  const handleEditClick = (flowId: string) => {
    if (!canUpdateApprovalFlow) return;
    setEditFlowId(flowId);
    setShowForm(true);
  };

  const handleCreateClick = () => {
    if (!canCreateApprovalFlow) return;
    setEditFlowId(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <ApprovalFlowForm
        flowId={editFlowId}
        onClose={() => {
          setShowForm(false);
          setEditFlowId(null);
          dispatch(getApprovalFlows());
        }}
      />
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Approval Flows
        </Typography>
        {canCreateApprovalFlow && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            sx={{ textTransform: "none" }}
          >
            Create Flow
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : flows.length === 0 ? (
        <Alert severity="info">No approval flows yet. Create your first flow to get started.</Alert>
      ) : !isMobile ? (
        // Desktop Table View
        <TableContainer component={Paper} sx={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Steps
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flows.map((flow) => (
                <TableRow key={flow.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{flow.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {flow.description || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={flow.steps.length} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {flow.isDefault && (
                        <Chip label="Default" size="small" color="primary" variant="outlined" />
                      )}
                      <Chip
                        label={flow.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={flow.isActive ? "success" : "default"}
                        variant="outlined"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {!flow.isDefault && canUpdateApprovalFlow && (
                        <Tooltip title="Set as default">
                          <IconButton
                            size="small"
                            onClick={() => handleSetDefaultClick(flow)}
                          >
                            <StarBorderIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {flow.isDefault && (
                        <Tooltip title="Currently default">
                          <IconButton size="small" disabled>
                            <StarIcon fontSize="small" sx={{ color: "#FBC02D" }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canUpdateApprovalFlow && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(flow.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDeleteApprovalFlow && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(flow.id)}
                            disabled={flow.isDefault}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Mobile Card View
        <Stack spacing={2}>
          {flows.map((flow) => (
            <Card key={flow.id} sx={{ boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" fontWeight={700}>
                    {flow.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {flow.isDefault && (
                      <Chip label="Default" size="small" color="primary" variant="outlined" />
                    )}
                    <Chip
                      label={flow.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={flow.isActive ? "success" : "default"}
                      variant="outlined"
                    />
                  </Stack>
                </Box>
                {flow.description && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {flow.description}
                  </Typography>
                )}
                <Typography variant="caption" color="textSecondary">
                  Steps: {flow.steps.length}
                </Typography>
              </CardContent>
              <CardActions>
                <Stack direction="row" spacing={1}>
                  {!flow.isDefault && canUpdateApprovalFlow && (
                    <Button
                      size="small"
                      startIcon={<StarBorderIcon />}
                      onClick={() => handleSetDefaultClick(flow)}
                      sx={{ textTransform: "none" }}
                    >
                      Default
                    </Button>
                  )}
                  {canUpdateApprovalFlow && (
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditClick(flow.id)}
                      sx={{ textTransform: "none" }}
                    >
                      Edit
                    </Button>
                  )}
                  {canDeleteApprovalFlow && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(flow.id)}
                      disabled={flow.isDefault}
                      sx={{ textTransform: "none" }}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Approval Flow?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this approval flow? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={defaultDialog} onClose={() => setDefaultDialog(false)}>
        <DialogTitle>Set Default Approval Flow?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to set &quot;{selectedDefaultFlow?.name}&quot; as the default
            approval flow? New projects without a custom approval setup will use this flow.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDefaultDialog(false)} disabled={settingDefault}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSetDefault}
            variant="contained"
            disabled={settingDefault}
          >
            {settingDefault ? <CircularProgress size={20} /> : "Set Default"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

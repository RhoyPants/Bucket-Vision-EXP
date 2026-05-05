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

const ApprovalFlowForm = dynamic(() => import("./ApprovalFlowForm"), {
  ssr: false,
});

export default function ApprovalFlowsList() {
  const dispatch = useDispatch<AppDispatch>();
  const { flows, loading, error } = useSelector(
    (state: RootState) => state.approvalFlow
  );

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editFlowId, setEditFlowId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(getApprovalFlows());
  }, [dispatch]);

  const handleDeleteClick = (flowId: string) => {
    setSelectedFlowId(flowId);
    setDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFlowId) return;
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

  const handleSetDefault = async (flowId: string) => {
    try {
      await dispatch(setFlowAsDefault(flowId));
    } catch (err) {
      console.error("Error setting default flow:", err);
    }
  };

  const handleEditClick = (flowId: string) => {
    setEditFlowId(flowId);
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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        ⚙️ Approval Flow Configuration
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditFlowId(null);
            setShowForm(true);
          }}
        >
          Create New Flow
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Steps
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No approval flows yet. Create your first flow.
                    </TableCell>
                  </TableRow>
                ) : (
                  flows.map((flow) => (
                    <TableRow key={flow.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{flow.name}</TableCell>
                      <TableCell>{flow.description || "-"}</TableCell>
                      <TableCell align="center">{flow.steps.length}</TableCell>
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
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {!flow.isDefault && (
                            <Tooltip title="Set as default">
                              <IconButton
                                size="small"
                                onClick={() => handleSetDefault(flow.id)}
                              >
                                <StarBorderIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {flow.isDefault && (
                            <Tooltip title="Currently default">
                              <IconButton size="small" disabled>
                                <StarIcon fontSize="small" color="warning" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(flow.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(flow.id)}
                              disabled={flow.isDefault}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
            <DialogTitle>Delete Approval Flow?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure? This action cannot be undone.
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
        </>
      )}
    </Box>
  );
}

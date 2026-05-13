"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  getAllBusinessUnits,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
  assignBUHead,
  assignAssistantBUHead,
} from "@/app/redux/controllers/businessUnitController";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const ENTITIES = ["GVI", "GVE", "HULMA"];

interface FormData {
  code: string;
  name: string;
  entity: string;
  buHead: string;
  assistantHead: string;
}

interface HeadFormData {
  buHead?: string;
  assistantHead?: string;
}

export default function BusinessUnits() {
  const dispatch = useAppDispatch();
  const { businessUnits, loading, error } = useAppSelector((state) => state.businessUnit);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    entity: "GVI",
    buHead: "",
    assistantHead: "",
  });

  const [openHeadDialog, setOpenHeadDialog] = useState(false);
  const [headEditingId, setHeadEditingId] = useState<string | null>(null);
  const [headFormData, setHeadFormData] = useState<HeadFormData>({});

  // Load business units on mount
  useEffect(() => {
    dispatch(getAllBusinessUnits() as any);
  }, [dispatch]);

  // Handle dialog open for create
  const handleOpenDialog = () => {
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      entity: "GVI",
      buHead: "",
      assistantHead: "",
    });
    setOpenDialog(true);
  };

  // Handle dialog open for edit
  const handleEditClick = (bu: any) => {
    setEditingId(bu.id);
    setFormData({
      code: bu.code,
      name: bu.name,
      entity: bu.entity,
      buHead: bu.buHead || "",
      assistantHead: bu.assistantHead || "",
    });
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert("Code and Name are required");
      return;
    }

    try {
      if (editingId) {
        // Update
        await dispatch(
          updateBusinessUnit(editingId, {
            name: formData.name,
            entity: formData.entity,
            buHead: formData.buHead || null,
            assistantHead: formData.assistantHead || null,
          }) as any
        );
      } else {
        // Create
        await dispatch(
          createBusinessUnit({
            code: formData.code,
            name: formData.name,
            entity: formData.entity,
            buHead: formData.buHead || null,
            assistantHead: formData.assistantHead || null,
          }) as any
        );
      }
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving business unit:", err);
    }
  };

  // Handle head assignment dialog
  const handleOpenHeadDialog = (bu: any, type: "buHead" | "assistantHead") => {
    setHeadEditingId(bu.id);
    setHeadFormData({
      [type]: type === "buHead" ? bu.buHead : bu.assistantHead,
    });
    setOpenHeadDialog(true);
  };

  const handleCloseHeadDialog = () => {
    setOpenHeadDialog(false);
    setHeadEditingId(null);
    setHeadFormData({});
  };

  // Handle head submission
  const handleHeadSubmit = async () => {
    if (!headEditingId) return;

    try {
      if (headFormData.buHead !== undefined) {
        await dispatch(
          assignBUHead(headEditingId, headFormData.buHead || null) as any
        );
      } else if (headFormData.assistantHead !== undefined) {
        await dispatch(
          assignAssistantBUHead(headEditingId, headFormData.assistantHead || null) as any
        );
      }
      handleCloseHeadDialog();
    } catch (err) {
      console.error("Error assigning head:", err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Business Unit?")) {
      try {
        await dispatch(deleteBusinessUnit(id) as any);
      } catch (err) {
        console.error("Error deleting business unit:", err);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Business Unit Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={loading}
        >
          New Business Unit
        </Button>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!loading && businessUnits.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>BU Head</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assistant Head</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {businessUnits.map((bu) => (
                <TableRow key={bu.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{bu.code}</Typography>
                  </TableCell>
                  <TableCell>{bu.name}</TableCell>
                  <TableCell>
                    <Chip label={bu.entity} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bu.buHead || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bu.assistantHead || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bu.isActive ? "Active" : "Inactive"}
                      color={bu.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(bu)}
                      color="primary"
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(bu.id)}
                      color="error"
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Empty State */}
      {!loading && businessUnits.length === 0 && (
        <Alert severity="info">No business units found. Create one to get started.</Alert>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Business Unit" : "Create Business Unit"}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            disabled={!!editingId}
            fullWidth
            size="small"
            placeholder="e.g., EMO"
            inputProps={{ maxLength: 10 }}
          />
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            placeholder="e.g., EXECUTIVE MANAGEMENT OFFICE"
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            select
            label="Entity"
            value={formData.entity}
            onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
            fullWidth
            size="small"
          >
            {ENTITIES.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="BU Head"
            value={formData.buHead}
            onChange={(e) => setFormData({ ...formData, buHead: e.target.value })}
            fullWidth
            size="small"
            placeholder="Optional"
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Assistant BU Head"
            value={formData.assistantHead}
            onChange={(e) => setFormData({ ...formData, assistantHead: e.target.value })}
            fullWidth
            size="small"
            placeholder="Optional"
            inputProps={{ maxLength: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

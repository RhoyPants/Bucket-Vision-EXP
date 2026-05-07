"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import axiosApi from "@/app/lib/axios";

interface Module {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
}

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [path, setPath] = useState("");

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosApi.get("/modules");
      if (res.status === 200) {
        setModules(res.data);
      } else {
        setError("Failed to load modules.");
      }
    } catch {
      setError("Network error while loading modules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !path.trim()) {
      setError("Both name and path are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axiosApi.post("/modules", {
        name: name.trim().toUpperCase(),
        path: path.trim(),
      });

      if (res.status === 200 || res.status === 201) {
        setSuccess(`Module "${res.data.name}" created successfully.`);
        setName("");
        setPath("");
        fetchModules();
      } else {
        setError(res.data?.message || "Failed to create module.");
      }
    } catch {
      setError("Network error while creating module.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Module Management
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Modules define what areas of the system exist. Each module maps to a backend route
        and can have permissions assigned per role.
      </Typography>

      {/* ── Create Form ───────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography fontWeight={600} mb={2}>
          Add New Module
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <TextField
            label="Module Name"
            placeholder="e.g. PROJECTS"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            size="small"
            sx={{ minWidth: 200 }}
            helperText="Uppercase — must match authorize() middleware"
          />
          <TextField
            label="API Path"
            placeholder="e.g. /api/projects"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={submitting || !name.trim() || !path.trim()}
            sx={{
              backgroundColor: "#4B2E83",
              "&:hover": { backgroundColor: "#3d2363" },
              alignSelf: "flex-start",
              mt: "4px !important",
            }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : "Add Module"}
          </Button>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* ── Module List ───────────────────────────────────────── */}
      <Typography fontWeight={600} mb={2}>
        Existing Modules
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : modules.length === 0 ? (
        <Alert severity="info">No modules found. Add the first one above.</Alert>
      ) : (
        <Table size="small" component={Paper} variant="outlined">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Path</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((mod) => (
              <TableRow key={mod.id} hover>
                <TableCell>
                  <Typography fontFamily="monospace" fontSize={13} fontWeight={600}>
                    {mod.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize={13} color="textSecondary">
                    {mod.path}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mod.isActive ? "Active" : "Inactive"}
                    color={mod.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

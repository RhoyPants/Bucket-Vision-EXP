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
  TableContainer,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import axiosApi from "@/app/lib/axios";
import AddIcon from "@mui/icons-material/Add";

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      <Typography variant="h5" fontWeight={700} mb={1}>
        Module Management
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Modules define what areas of the system exist. Each module maps to a backend route
        and can have permissions assigned per role.
      </Typography>

      {/* ── Create Form ───────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
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
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? "auto" : 200 }}
            helperText="Uppercase — must match authorize() middleware"
          />
          <TextField
            label="API Path"
            placeholder="e.g. /api/projects"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            size="small"
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? "auto" : 220 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={submitting || !name.trim() || !path.trim()}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              mt: { xs: 0, sm: "4px !important" },
              textTransform: "none",
            }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : "Add Module"}
          </Button>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
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
      ) : !isMobile ? (
        // Desktop Table View
        <TableContainer component={Paper} sx={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, width: "25%" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, width: "50%" }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 700, width: "25%" }}>Status</TableCell>
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
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Mobile Card View
        <Stack spacing={2}>
          {modules.map((mod) => (
            <Card key={mod.id} sx={{ boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {mod.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {mod.path}
                </Typography>
              </CardContent>
              <CardActions>
                <Chip
                  label={mod.isActive ? "Active" : "Inactive"}
                  color={mod.isActive ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

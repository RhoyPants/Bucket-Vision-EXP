"use client";

import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getRoles } from "@/app/lib/role.api";
import RoleModal from "../../../components/shared/modals/RoleModal";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Roles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRoles();
      setRoles(res || []);
    } catch (err) {
      setError("Failed to load roles. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setOpen(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (roles.length === 0) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Roles
          </Typography>
          <Button variant="contained" color="success" onClick={handleAddRole}>
            Add Role
          </Button>
        </Box>
        <Alert severity="info">No roles found. Create your first role to get started.</Alert>
        <RoleModal
          open={open}
          onClose={() => setOpen(false)}
          role={selectedRole}
          refresh={fetchRoles}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Roles
        </Typography>
        <Button variant="contained" color="success" onClick={handleAddRole}>
          Add Role
        </Button>
      </Box>

      {/* DESKTOP TABLE VIEW */}
      {!isMobile && (
        <TableContainer component={Paper} sx={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, width: "40%" }}>
                  Role Name
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "40%" }}>
                  Permissions
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "20%", textAlign: "right" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Typography fontWeight={600}>{role.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      View & manage permissions
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(role)}
                        sx={{ textTransform: "none" }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{ textTransform: "none" }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* MOBILE CARD VIEW */}
      {isMobile && (
        <Stack spacing={2}>
          {roles.map((role) => (
            <Card key={role.id} sx={{ boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {role.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View & manage permissions
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(role)}
                  sx={{ textTransform: "none" }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* MODAL */}
      <RoleModal
        open={open}
        onClose={() => setOpen(false)}
        role={selectedRole}
        refresh={fetchRoles}
      />
    </Box>
  );
}
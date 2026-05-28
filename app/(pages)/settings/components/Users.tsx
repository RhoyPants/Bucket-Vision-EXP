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
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getUsers } from "@/app/lib/user.api";
import UserModal from "@/app/components/shared/modals/UserModal";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUsers();
      setUsers(res || []);
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelected(user);
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

  if (users.length === 0) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Users
          </Typography>
          <Button variant="contained" onClick={handleAddUser}>
            Add User
          </Button>
        </Box>
        <Alert severity="info">No users found. Create your first user to get started.</Alert>
        <UserModal
          open={open}
          onClose={() => setOpen(false)}
          user={selected}
          refresh={fetchUsers}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Users
        </Typography>
        <Button variant="contained" onClick={handleAddUser}>
          Add User
        </Button>
      </Box>

      {/* DESKTOP TABLE VIEW */}
      {!isMobile && (
        <TableContainer component={Paper} sx={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, width: "30%" }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "35%" }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "20%" }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "15%", textAlign: "right" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Typography fontWeight={600}>{user.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    {user.role?.name ? (
                      <Chip
                        label={user.role.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditUser(user)}
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
          {users.map((user) => (
            <Card key={user.id} sx={{ boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                {user.role?.name && (
                  <Chip
                    label={user.role.name}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, fontWeight: 600 }}
                  />
                )}
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditUser(user)}
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
      <UserModal
        open={open}
        onClose={() => setOpen(false)}
        user={selected}
        refresh={fetchUsers}
      />
    </Box>
  );
}
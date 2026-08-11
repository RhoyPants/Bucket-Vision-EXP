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
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  InputAdornment,
  Avatar,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { deleteUser, getUserById, getUsers, updateUserStatus } from "@/app/lib/user.api";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";
import { usePermissions } from "@/app/lib/usePermissions";
import UserModal from "@/app/components/shared/modals/UserModal";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { brandColors } from "@/app/lib/theme";

const PAGE_SIZE = 8;

type SettingsUser = {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  isActive?: boolean;
  role?: {
    id?: string;
    name?: string;
  } | null;
  roleId?: string;
  businessUnitId?: string;
  businessUnitName?: string;
  businessUnit?: {
    id?: string;
    name?: string;
    code?: string;
  } | null;
};

type BusinessUnitOption = { id: string; name: string; code?: string };

const getErrorMessage = (err: unknown, fallback: string) => {
  const error = err as { response?: { data?: { message?: string } }; message?: string };
  return error?.response?.data?.message || error?.message || fallback;
};

export default function Users() {
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const canCreateUser = canCreate("settings_users");
  const canUpdateUser = canUpdate("settings_users");
  const canDeleteUser = canDelete("settings_users");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchUsers();
    getBusinessUnitsDropdown().then((rows) => setBusinessUnits(rows || [])).catch(() => setBusinessUnits([]));
  }, []);

  const roleOptions = useMemo(() => Array.from(new Map(users
    .filter((user) => user.role?.name)
    .map((user) => [user.role?.id || user.role?.name, { id: user.role?.id || user.role?.name || "", name: user.role?.name || "" }])).values())
    .sort((a, b) => a.name.localeCompare(b.name)), [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const roleId = user.role?.id || user.roleId;
      const unitId = user.businessUnit?.id || user.businessUnitId;
      const matchesSearch = !query || [user.name, user.fullName, user.email, user.businessUnit?.name, user.businessUnitName, user.role?.name]
        .some((value) => value?.toLowerCase().includes(query));
      const matchesRole = roleFilter === "ALL" || roleId === roleFilter || user.role?.name === roleFilter;
      const matchesUnit = businessUnitFilter === "ALL" || unitId === businessUnitFilter;
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? user.isActive !== false : user.isActive === false);
      return matchesSearch && matchesRole && matchesUnit && matchesStatus;
    });
  }, [businessUnitFilter, roleFilter, searchQuery, statusFilter, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredUsers, page]);

  useEffect(() => { setPage(1); }, [searchQuery, roleFilter, businessUnitFilter, statusFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const hasFilters = Boolean(searchQuery || roleFilter !== "ALL" || businessUnitFilter !== "ALL" || statusFilter !== "ALL");
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setBusinessUnitFilter("ALL");
    setStatusFilter("ALL");
  };

  const getBusinessUnitName = (user: SettingsUser) => user.businessUnit?.name || user.businessUnitName || businessUnits.find((unit) => unit.id === user.businessUnitId)?.name || "—";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
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

  const handleEditUser = async (user: SettingsUser) => {
    try {
      setEditingId(user.id);
      setError(null);

      const details = await getUserById(user.id);
      setSelected({ ...user, ...(details || {}) });
      setOpen(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load user details."));
      console.error(err);
    } finally {
      setEditingId(null);
    }
  };

  const handleDeleteUser = async (user: SettingsUser) => {
    const displayName = user?.name || user?.fullName || "this user";
    const confirmed = window.confirm(`Delete ${displayName}? This action cannot be undone.`);

    if (!confirmed) return;

    try {
      setDeletingId(user.id);
      setError(null);
      setSuccess(null);

      const result = await deleteUser(user.id);

      if (!result?.success) {
        const associationDetails = Array.isArray(result?.data?.associations)
          ? `\n${result.data.associations.join(", ")}`
          : "";

        setError(
          (result?.message || "Failed to delete user.") + associationDetails
        );
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSuccess(result?.message || `${displayName} deleted successfully.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete user. Please try again."));
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleUserStatus = async (user: SettingsUser) => {
    try {
      setStatusUpdatingId(user.id);
      setError(null);
      setSuccess(null);

      const nextStatus = !Boolean(user?.isActive);
      const result = await updateUserStatus(user.id, nextStatus);

      if (!result?.success) {
        setError(result?.message || "Failed to update user status.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
      );
      setSuccess(result?.message || `User ${nextStatus ? "activated" : "deactivated"} successfully.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update user status."));
      console.error(err);
    } finally {
      setStatusUpdatingId(null);
    }
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
          {canCreateUser ? (
            <Button variant="contained" onClick={handleAddUser}>
              Add User
            </Button>
          ) : null}
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
        {canCreateUser ? (
          <Button variant="contained" onClick={handleAddUser}>
            Add User
          </Button>
        ) : null}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #E3E0EA", borderRadius: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField size="small" placeholder="Search name or email" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} sx={{ flex: 1, minWidth: { md: 260 } }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#89859A", fontSize: 20 }} /></InputAdornment> } }} />
          <TextField select size="small" label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} sx={{ minWidth: { md: 180 } }}>
            <MenuItem value="ALL">All Roles</MenuItem>
            {roleOptions.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Business Unit" value={businessUnitFilter} onChange={(event) => setBusinessUnitFilter(event.target.value)} sx={{ minWidth: { md: 220 } }}>
            <MenuItem value="ALL">All Business Units</MenuItem>
            {businessUnits.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unit.name}{unit.code ? ` (${unit.code})` : ""}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: { md: 145 } }}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
          {hasFilters && <Button onClick={clearFilters} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>Clear filters</Button>}
        </Stack>
        <Typography sx={{ color: "#777386", fontSize: 12.5, mt: 1.25 }}>Showing {filteredUsers.length} of {users.length} users</Typography>
      </Paper>

      {/* DESKTOP TABLE VIEW */}
      {!isMobile && (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #DFDCE7", borderRadius: 2.5, overflow: "hidden" }}>
          <Table size="small" sx={{ tableLayout: "fixed", "& th:not(:last-child), & td:not(:last-child)": { borderRight: "1px solid #E8E5EE" } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F3F6FB" }}>
                <TableCell sx={{ fontSize: 11.5, color: brandColors.deepTwilight, fontWeight: 700, width: "24%", py: 1.5 }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontSize: 11.5, color: brandColors.deepTwilight, fontWeight: 700, width: "24%" }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontSize: 11.5, color: brandColors.deepTwilight, fontWeight: 700, width: "14%" }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontSize: 11.5, color: brandColors.deepTwilight, fontWeight: 700, width: "20%" }}>
                  Business Unit
                </TableCell>
                <TableCell sx={{ fontSize: 11.5, color: brandColors.deepTwilight, fontWeight: 700, width: 150, textAlign: "center" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontSize: 11.5, color: brandColors.deepTwilight, fontWeight: 700, width: 96, textAlign: "center" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} hover sx={{ "& td": { py: 1.15, borderBottom: "1px solid #ECE9F1" }, "&:hover": { bgcolor: "#FBFAFE" } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: brandColors.lavenderMist, color: brandColors.vividRoyal, fontSize: 11.5, fontWeight: 700 }}>{(user.name || user.fullName || "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Avatar>
                      <Typography noWrap title={user.name || user.fullName} sx={{ color: brandColors.deepTwilight, fontSize: 13.5, fontWeight: 600 }}>{user.name || user.fullName || "Unnamed user"}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap title={user.email} sx={{ color: "#4F4B5E", fontSize: 13 }}>{user.email || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    {user.role?.name ? (
                      <Chip
                        label={user.role.name}
                        size="small"
                        sx={{ height: 25, bgcolor: brandColors.lavenderMist, color: brandColors.vividRoyal, fontSize: 11.5, fontWeight: 650 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: "#4F4B5E", fontSize: 13 }} noWrap title={getBusinessUnitName(user)}>{getBusinessUnitName(user)}</Typography>
                  </TableCell>
                  <TableCell sx={{ px: 1.25 }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ width: "100%" }}
                    >
                      <Chip
                        label={user?.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{ minWidth: 54, height: 25, bgcolor: user?.isActive ? "#E5F8F1" : "#F1EFF3", color: user?.isActive ? "#087A57" : "#6F6A78", fontSize: 11.5, fontWeight: 650 }}
                      />
                      {canUpdateUser ? (
                        <Switch
                          size="small"
                          checked={Boolean(user?.isActive)}
                          disabled={statusUpdatingId === user.id}
                          onChange={() => handleToggleUserStatus(user)}
                          inputProps={{ "aria-label": `${user.name || user.fullName || "User"} status` }}
                          sx={{ flexShrink: 0, m: 0 }}
                        />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Stack direction="row" spacing={0.25} justifyContent="center">
                      {canUpdateUser ? (
                        <Tooltip title="Edit user"><span><IconButton size="small" onClick={() => handleEditUser(user)} disabled={editingId === user.id} sx={{ color: brandColors.vividRoyal }}><EditIcon fontSize="small" /></IconButton></span></Tooltip>
                      ) : null}
                      {canDeleteUser ? (
                        <Tooltip title="Delete user"><span><IconButton size="small" color="error" onClick={() => handleDeleteUser(user)} disabled={deletingId === user.id}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>No users match the selected filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filteredUsers.length > 0 && (
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={1} sx={{ px: 2, py: 1.25, bgcolor: "#F5F8FC", borderTop: "1px solid #DFDCE7" }}>
              <Typography sx={{ color: "#666276", fontSize: 12.5 }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</Typography>
              <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} size="small" shape="rounded" color="primary" />
            </Stack>
          )}
        </TableContainer>
      )}

      {/* MOBILE CARD VIEW */}
      {isMobile && (
        <Stack spacing={2}>
          {paginatedUsers.map((user) => (
            <Card key={user.id} sx={{ boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">{getBusinessUnitName(user)}</Typography>
                {user.role?.name && (
                  <Chip
                    label={user.role.name}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, fontWeight: 600 }}
                  />
                )}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Chip
                    label={user?.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={user?.isActive ? "success" : "default"}
                    variant={user?.isActive ? "filled" : "outlined"}
                  />
                  {canUpdateUser ? (
                    <FormControlLabel
                      sx={{ ml: 0 }}
                      control={
                        <Switch
                          size="small"
                          checked={Boolean(user?.isActive)}
                          disabled={statusUpdatingId === user.id}
                          onChange={() => handleToggleUserStatus(user)}
                        />
                      }
                      label=""
                    />
                  ) : null}
                </Stack>
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                {canUpdateUser ? (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditUser(user)}
                    disabled={editingId === user.id}
                    sx={{ textTransform: "none" }}
                  >
                    {editingId === user.id ? "Loading..." : "Edit"}
                  </Button>
                ) : null}
                {canDeleteUser ? (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteUser(user)}
                    disabled={deletingId === user.id}
                    sx={{ textTransform: "none" }}
                  >
                    {deletingId === user.id ? "Deleting..." : "Delete"}
                  </Button>
                ) : null}
              </CardActions>
            </Card>
          ))}
          {filteredUsers.length === 0 && <Alert severity="info">No users match the selected filters.</Alert>}
          {filteredUsers.length > 0 && <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} size="small" shape="rounded" color="primary" sx={{ alignSelf: "center", pt: 1 }} />}
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

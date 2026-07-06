"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Checkbox,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import axiosApi from "@/app/lib/axios";
import { createRole } from "@/app/lib/role.api";

type RoleModalProps = {
  open: boolean;
  onClose: () => void;
  role?: { id: string; name: string } | null;
  refresh: () => void;
};

type ModuleRecord = {
  id?: string;
  key: string;
  name: string;
  path: string;
};

type ActionKey = "canView" | "canCreate" | "canUpdate" | "canDelete";
type PermissionKey = ActionKey | "canApprove";
type PermissionState = Record<string, Record<PermissionKey, boolean>>;

const actions: Array<{ key: ActionKey; label: string }> = [
  { key: "canView", label: "View" },
  { key: "canCreate", label: "Create" },
  { key: "canUpdate", label: "Update" },
  { key: "canDelete", label: "Delete" },
];

const emptyPermissionState = (canApprove = false): Record<PermissionKey, boolean> => ({
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canApprove,
});

const permissionStateForAction = (
  action: ActionKey,
  checked: boolean,
  canApprove = false
): Record<PermissionKey, boolean> => {
  if (!checked) {
    if (action === "canView") return emptyPermissionState(canApprove);
    if (action === "canCreate") {
      return { ...emptyPermissionState(canApprove), canView: true };
    }
    if (action === "canUpdate") {
      return { ...emptyPermissionState(canApprove), canView: true, canCreate: true };
    }
    return {
      ...emptyPermissionState(canApprove),
      canView: true,
      canCreate: true,
      canUpdate: true,
    };
  }

  if (action === "canView") {
    return { ...emptyPermissionState(canApprove), canView: true };
  }

  if (action === "canCreate") {
    return { ...emptyPermissionState(canApprove), canView: true, canCreate: true };
  }

  if (action === "canUpdate") {
    return {
      ...emptyPermissionState(canApprove),
      canView: true,
      canCreate: true,
      canUpdate: true,
    };
  }

  return {
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canApprove,
  };
};

const normalizePermissionLevel = (
  permission: Record<PermissionKey, boolean>
): Record<PermissionKey, boolean> => {
  if (permission.canDelete) return permissionStateForAction("canDelete", true, permission.canApprove);
  if (permission.canUpdate) return permissionStateForAction("canUpdate", true, permission.canApprove);
  if (permission.canCreate) return permissionStateForAction("canCreate", true, permission.canApprove);
  if (permission.canView) return permissionStateForAction("canView", true, permission.canApprove);
  return emptyPermissionState(permission.canApprove);
};

const frontendPermissionModules: ModuleRecord[] = [
  {
    id: "team_management",
    key: "team_management",
    name: "Team Management",
    path: "/projects/:id/team-management",
  },
  {
    id: "progress",
    key: "progress",
    name: "Progress",
    path: "/progress",
  },
];

const isEnabled = (value: unknown) => value === 1 || value === true || value === "1";

const formatPermissionLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const extractArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const wrapped = payload as {
    data?: unknown;
    modules?: unknown;
    pages?: unknown;
    permissions?: unknown;
  } | null;

  if (Array.isArray(wrapped?.data)) return wrapped.data;
  if (Array.isArray(wrapped?.modules)) return wrapped.modules;
  if (Array.isArray(wrapped?.pages)) return wrapped.pages;
  if (Array.isArray(wrapped?.permissions)) return wrapped.permissions;

  const nested = wrapped?.data as {
    modules?: unknown;
    pages?: unknown;
    permissions?: unknown;
  } | null;

  if (Array.isArray(nested?.modules)) return nested.modules;
  if (Array.isArray(nested?.pages)) return nested.pages;
  if (Array.isArray(nested?.permissions)) return nested.permissions;

  return [];
};

const normalizeModules = (payload: unknown): ModuleRecord[] =>
  extractArray(payload)
    .reduce<ModuleRecord[]>((acc, item) => {
      const mod = item as Partial<ModuleRecord> & { pageKey?: string; module?: string };
      const key = mod.key || mod.pageKey || mod.module || mod.name;

      if (!key) return acc;

      acc.push({
        id: mod.id || key,
        key,
        name: mod.name || key,
        path: mod.path || "",
      });

      return acc;
    }, []);

const mergeFrontendPermissionModules = (modules: ModuleRecord[]) => {
  const existingKeys = new Set(modules.map((module) => module.key));
  const missingModules = frontendPermissionModules.filter(
    (module) => !existingKeys.has(module.key)
  );

  return [...modules, ...missingModules];
};

const normalizeRolePermissionItems = (payload: unknown): unknown[] => {
  const wrapped = payload as { data?: unknown } | null;
  return extractArray(wrapped?.data || payload);
};

export default function RoleModal({ open, onClose, role, refresh }: RoleModalProps) {
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPermissions = modules.length * actions.length;
  const enabledPermissions = useMemo(
    () =>
      modules.reduce(
        (count, module) =>
          count +
          actions.filter((action) => permissions[module.key]?.[action.key]).length,
        0
      ),
    [modules, permissions]
  );
  const fullyEnabledPages = useMemo(
    () =>
      modules.filter((module) =>
        actions.every((action) => permissions[module.key]?.[action.key])
      ).length,
    [modules, permissions]
  );
  const actionStates = useMemo(
    () =>
      actions.map((action) => {
        const checkedCount = modules.filter(
          (module) => permissions[module.key]?.[action.key]
        ).length;

        return {
          ...action,
          checked: modules.length > 0 && checkedCount === modules.length,
          indeterminate: checkedCount > 0 && checkedCount < modules.length,
        };
      }),
    [modules, permissions]
  );

  useEffect(() => {
    if (!open) return;

    const initialize = async () => {
      setLoading(true);
      setError(null);

      try {
        let modulesData: ModuleRecord[] = [];
        let permissionItems: unknown[] = [];

        if (role) {
          setRoleName(role.name);
          const permRes = await axiosApi.get(`/roles/${role.id}/page-permissions`);
          permissionItems = normalizeRolePermissionItems(permRes.data);
          modulesData = normalizeModules(permissionItems);
        } else {
          setRoleName("");
          const res = await axiosApi.get("/modules");
          modulesData = normalizeModules(res.data);
        }

        modulesData = mergeFrontendPermissionModules(modulesData);
        setModules(modulesData);

        const map = modulesData.reduce<PermissionState>((acc, module) => {
          acc[module.key] = {
            canView: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canApprove: false,
          };
          return acc;
        }, {});

        permissionItems.forEach((item) => {
          const permission = item as {
            key?: string;
            pageKey?: string;
            module?: string;
            canView?: unknown;
            canCreate?: unknown;
            canUpdate?: unknown;
            canDelete?: unknown;
            canApprove?: unknown;
            actions?: string[];
          };
          const key = permission.key || permission.pageKey || permission.module;

          if (!key || !map[key]) return;

          if (Array.isArray(permission.actions)) {
            map[key].canView = permission.actions.includes("READ");
            map[key].canCreate = permission.actions.includes("CREATE");
            map[key].canUpdate = permission.actions.includes("UPDATE");
            map[key].canDelete = permission.actions.includes("DELETE");
            map[key].canApprove = permission.actions.includes("APPROVE");
            return;
          }

          map[key].canView = isEnabled(permission.canView);
          map[key].canCreate = isEnabled(permission.canCreate);
          map[key].canUpdate = isEnabled(permission.canUpdate);
          map[key].canDelete = isEnabled(permission.canDelete);
          map[key].canApprove = isEnabled(permission.canApprove);
        });

        Object.keys(map).forEach((key) => {
          map[key] = normalizePermissionLevel(map[key]);
        });

        setPermissions(map);
      } catch (err) {
        console.error("Failed to initialize role permissions:", err);
        setError("Failed to load role permissions.");
        setModules([]);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [open, role]);

  const toggle = (moduleKey: string, action: ActionKey) => {
    setPermissions((prev) => {
      const current = prev[moduleKey] || emptyPermissionState();

      return {
        ...prev,
        [moduleKey]: permissionStateForAction(
          action,
          !current[action],
          current.canApprove
        ),
      };
    });
  };

  const setActionForAll = (action: ActionKey, checked: boolean) => {
    setPermissions((prev) =>
      modules.reduce<PermissionState>((next, module) => {
        const current = prev[module.key] || emptyPermissionState();
        next[module.key] = permissionStateForAction(action, checked, current.canApprove);
        return next;
      }, {})
    );
  };

  const setPageAccess = (moduleKey: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: checked
        ? permissionStateForAction("canDelete", true, prev[moduleKey]?.canApprove || false)
        : emptyPermissionState(prev[moduleKey]?.canApprove || false),
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      setError("Role name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const pages = modules.map((module) => ({
        key: module.key,
        canView: permissions[module.key]?.canView ? 1 : 0,
        canCreate: permissions[module.key]?.canCreate ? 1 : 0,
        canUpdate: permissions[module.key]?.canUpdate ? 1 : 0,
        canDelete: permissions[module.key]?.canDelete ? 1 : 0,
        canApprove: permissions[module.key]?.canApprove ? 1 : 0,
      }));

      if (role) {
        await axiosApi.put(`/roles/${role.id}/page-permissions`, { pages });
      } else {
        const created = await createRole({ name: roleName.trim(), permissions: [] });
        const createdRoleId = created?.data?.id || created?.id;

        if (createdRoleId) {
          await axiosApi.put(`/roles/${createdRoleId}/page-permissions`, { pages });
        }
      }

      refresh();
      onClose();
    } catch (err) {
      console.error("Failed to save role permissions:", err);
      setError("Failed to save role permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          maxHeight: "88vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {role ? "Edit Role" : "Create Role"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {roleName || "New role"}
            </Typography>
          </Box>
          <Chip
            label={`${enabledPermissions}/${totalPermissions || 0} enabled`}
            color={enabledPermissions > 0 ? "primary" : "default"}
            variant="outlined"
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: "#f8fafc" }}>
        <Box sx={{ p: 3 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                label="Role Name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                fullWidth
                size="small"
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${modules.length} pages`} />
                <Chip label={`${fullyEnabledPages} full access`} color="success" variant="outlined" />
                <Chip
                  label={`${Math.max(totalPermissions - enabledPermissions, 0)} disabled`}
                  color="default"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Paper>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={800}>Page Permissions</Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage access by page and action
                </Typography>
              </Box>
              <Chip size="small" label={role ? "Existing role" : "New role"} color="primary" variant="outlined" />
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={7}>
                <CircularProgress />
              </Box>
            ) : modules.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info">No pages/modules found.</Alert>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: "48vh" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, minWidth: 280 }}>
                        Page
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, minWidth: 110 }}>
                        Full Access
                      </TableCell>
                      {actionStates.map((action) => (
                        <TableCell
                          key={action.key}
                          align="center"
                          sx={{ fontWeight: 800, minWidth: 110 }}
                        >
                          <Stack alignItems="center" spacing={0.25}>
                            <Typography variant="caption" fontWeight={800}>
                              {action.label}
                            </Typography>
                            <Tooltip title={`Toggle ${action.label.toLowerCase()} for all pages`}>
                              <Checkbox
                                size="small"
                                checked={action.checked}
                                indeterminate={action.indeterminate}
                                onChange={(event) =>
                                  setActionForAll(action.key, event.target.checked)
                                }
                                sx={{ p: 0.25 }}
                              />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modules.map((module) => {
                      const pageCheckedCount = actions.filter(
                        (action) => permissions[module.key]?.[action.key]
                      ).length;
                      const pageHasFullAccess = pageCheckedCount === actions.length;
                      const pageHasPartialAccess =
                        pageCheckedCount > 0 && pageCheckedCount < actions.length;

                      return (
                        <TableRow key={module.key} hover>
                          <TableCell>
                            <Typography fontWeight={700} fontSize={14}>
                              {formatPermissionLabel(module.name)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {module.path || module.key}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={pageHasFullAccess}
                              indeterminate={pageHasPartialAccess}
                              onChange={(event) =>
                                setPageAccess(module.key, event.target.checked)
                              }
                            />
                          </TableCell>

                          {actions.map((action) => (
                            <TableCell align="center" key={action.key}>
                              <Checkbox
                                checked={permissions[module.key]?.[action.key] || false}
                                onChange={() => toggle(module.key, action.key)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "#ffffff",
        }}
      >
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || saving}
          sx={{ textTransform: "none", minWidth: 120 }}
        >
          {saving ? "Saving..." : "Save Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

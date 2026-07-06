"use client";

import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useCallback } from "react";
import axiosApi from "@/app/lib/axios";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";
import { createUser, updateUser } from "@/app/lib/user.api";
import { usePermissions } from "@/app/lib/usePermissions";

type UserModalUser = {
  id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  roleId?: string;
  role?: {
    id?: string;
  } | null;
  businessUnitId?: string;
  businessUnit?: {
    id?: string;
    buHead?: string;
  } | null;
  buHead?: string;
  position?: string;
  isActive?: boolean;
};

type RoleOption = {
  id: string;
  name: string;
};

type BusinessUnitOption = {
  id: string;
  name: string;
  code?: string;
  buHead?: string;
};

type UserModalProps = {
  open: boolean;
  onClose: () => void;
  user?: UserModalUser | null;
  refresh: () => void;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const error = err as { response?: { data?: { message?: string } }; message?: string };
  return error?.response?.data?.message || error?.message || fallback;
};

const getInitialForm = (user?: UserModalUser | null) => {
  if (!user) {
    return {
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      password: "",
      roleId: "",
      businessUnitId: "",
      buHead: "",
      position: "",
      isActive: true,
    };
  }

  const fallbackName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  return {
    name: user?.name || user?.fullName || fallbackName || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    company: user?.company || "",
    password: "",
    roleId: user?.roleId || user?.role?.id || "",
    businessUnitId: user?.businessUnitId || user?.businessUnit?.id || "",
    buHead: user?.buHead || user?.businessUnit?.buHead || "",
    position: user?.position || "",
    isActive: user?.isActive ?? true,
  };
};

export default function UserModal({ open, onClose, user, refresh }: UserModalProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { canCreate, canUpdate } = usePermissions();
  const canSaveUser = user ? canUpdate("settings_users") : canCreate("settings_users");
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    roleId: "",
    businessUnitId: "",
    buHead: "",
    position: "",
    isActive: true,
  });

  const fetchLookups = useCallback(async () => {
    try {
      const [rolesRes, businessUnitsRes] = await Promise.all([
        axiosApi.get("/roles"),
        getBusinessUnitsDropdown(),
      ]);

      const roleRows = Array.isArray(rolesRes?.data)
        ? rolesRes.data
        : Array.isArray(rolesRes?.data?.data)
          ? rolesRes.data.data
          : [];

      setRoles(roleRows);
      setBusinessUnits(Array.isArray(businessUnitsRes) ? businessUnitsRes : []);
    } catch (err) {
      console.error("Failed to load user modal lookups", err);
      setError("Failed to load roles/business units.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        fetchLookups();
        setForm(getInitialForm(user));
        setError(null);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [fetchLookups, open, user]);

  const handleSave = async () => {
    if (!canSaveUser) return;

    if (!form.name || !form.email || (!user && !form.password)) {
      alert("Required fields missing");
      return;
    }

    try {
      setError(null);

      if (user) {
        await updateUser(user.id, {
          name: form.name,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          company: form.company,
          roleId: form.roleId,
          businessUnitId: form.businessUnitId || null,
          buHead: form.buHead || null,
          position: form.position,
          isActive: form.isActive,
        });
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: form.roleId,
        });
      }

      refresh();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save user details."));
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </Stack>

        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <TextField
          label="Company"
          fullWidth
          margin="normal"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />

        {!user && (
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        )}

        <TextField
          select
          label="Role"
          fullWidth
          margin="normal"
          value={form.roleId}
          onChange={(e) => setForm({ ...form, roleId: e.target.value })}
        >
          {roles.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Business Unit"
          fullWidth
          margin="normal"
          value={form.businessUnitId}
          onChange={(e) => {
            const nextBuId = e.target.value;
            const matched = businessUnits.find((bu) => bu.id === nextBuId);
            setForm({
              ...form,
              businessUnitId: nextBuId,
              buHead: matched?.buHead || form.buHead || "",
            });
          }}
        >
          <MenuItem value="">None</MenuItem>
          {businessUnits.map((bu) => (
            <MenuItem key={bu.id} value={bu.id}>
              {bu.name} ({bu.code})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="BU Head"
          fullWidth
          margin="normal"
          value={form.buHead}
          onChange={(e) => setForm({ ...form, buHead: e.target.value })}
        />

        <TextField
          label="Position"
          fullWidth
          margin="normal"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        />

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Switch
              checked={Boolean(form.isActive)}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
          }
          label={form.isActive ? "Active" : "Inactive"}
        />

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSaveUser}>
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

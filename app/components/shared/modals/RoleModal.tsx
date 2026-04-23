"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Checkbox,
  Divider,
  TextField,
  Grid,
} from "@mui/material";

import { useEffect, useState } from "react";
import axiosApi from "@/app/lib/axios";
import {
  getRolePermissions,
  updateRolePermissions,
  createRole,
} from "@/app/lib/role.api";

const actions = ["READ", "CREATE", "UPDATE", "DELETE"];

export default function RoleModal({ open, onClose, role, refresh }: any) {
  const [modules, setModules] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    if (open) {
      initialize();
    }
  }, [open]);

  const initialize = async () => {
    const res = await axiosApi.get("/modules");
    const modulesData = res.data;

    setModules(modulesData);

    // INIT EMPTY PERMISSIONS
    const map: any = {};
    modulesData.forEach((m: any) => {
      map[m.name] = {};
      actions.forEach((a) => (map[m.name][a] = false));
    });

    // IF EDIT MODE → LOAD EXISTING
    if (role) {
      setRoleName(role.name);

      const permRes = await getRolePermissions(role.id);

      permRes.permissions.forEach((item: any) => {
        item.actions.forEach((a: string) => {
          if (map[item.module]) {
            map[item.module][a] = true;
          }
        });
      });
    } else {
      setRoleName("");
    }

    setPermissions(map);
  };

  const toggle = (module: string, action: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const handleSave = async () => {
    if (!roleName) {
      alert("Role name is required");
      return;
    }

    const formatted = Object.keys(permissions).map((module) => ({
      module,
      actions: Object.keys(permissions[module]).filter(
        (a) => permissions[module][a]
      ),
    }));

    if (role) {
      // UPDATE
      await updateRolePermissions(role.id, formatted);
    } else {
      // CREATE
      await createRole({
        name: roleName,
        permissions: formatted,
      });
    }

    refresh();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>

      <DialogContent>
        {/* 🔥 ROLE NAME */}
        <TextField
          label="Role Name"
          fullWidth
          margin="normal"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
        />

        <Typography mt={2} mb={1}>
          Permissions
        </Typography>

        {/* HEADER */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <Typography fontWeight="bold">Module</Typography>
          </Grid>

          {actions.map((a) => (
            <Grid size={{ xs: 2 }} key={a}>
              <Typography fontWeight="bold">{a}</Typography>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 1 }} />

        {/* ROWS */}
        {modules.map((m) => (
          <Grid container spacing={2} alignItems="center" key={m.id}>
            <Grid size={{ xs: 4 }}>
              <Typography>{m.name}</Typography>
            </Grid>

            {actions.map((a) => (
              <Grid size={{ xs: 2 }} key={a}>
                <Checkbox
                  checked={permissions[m.name]?.[a] || false}
                  onChange={() => toggle(m.name, a)}
                />
              </Grid>
            ))}
          </Grid>
        ))}

        {/* ACTIONS */}
        <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import axiosApi from "@/app/lib/axios";
import { createUser, updateUser } from "@/app/lib/user.api";

export default function UserModal({ open, onClose, user, refresh }: any) {
  const [roles, setRoles] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    if (open) {
      fetchRoles();

      if (user) {
        setForm({
          name: user.name,
          email: user.email,
          password: "",
          roleId: user.roleId,
        });
      } else {
        setForm({
          name: "",
          email: "",
          password: "",
          roleId: "",
        });
      }
    }
  }, [open]);

  const fetchRoles = async () => {
    const res = await axiosApi.get("/roles");
    setRoles(res.data);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!user && !form.password)) {
      alert("Required fields missing");
      return;
    }

    if (user) {
      await updateUser(user.id, form);
    } else {
      await createUser(form);
    }

    refresh();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>

      <DialogContent>
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

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
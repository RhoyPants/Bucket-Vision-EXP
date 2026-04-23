"use client";

import { Box, Typography, Button, Paper } from "@mui/material";
import { useEffect, useState } from "react";
import { getRoles } from "@/app/lib/role.api";
import RoleModal from "../../../components/shared/modals/RoleModal";

export default function Roles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const res = await getRoles();
    setRoles(res);
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setOpen(true);
  };

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Roles
        </Typography>

        <Button
          variant="contained"
          color="success"
          onClick={() => {
            setSelectedRole(null);
            setOpen(true);
          }}
        >
          Add Role
        </Button>
      </Box>

      {/* TABLE */}
      <Paper >
        <Box display="flex" px={2} py={1} borderBottom="1px solid #eee">
          <Box width="30%">
            <Typography fontWeight="bold">Access</Typography>
          </Box>
          <Box width="50%">
            <Typography fontWeight="bold">Permissions</Typography>
          </Box>
          <Box width="20%">
            <Typography fontWeight="bold">Actions</Typography>
          </Box>
        </Box>

        {roles.map((role) => (
          <Box
            key={role.id}
            display="flex"
            px={2}
            py={2}
            borderBottom="1px solid #eee"
          >
            <Box width="30%">
              <Typography>{role.name}</Typography>
            </Box>

            <Box width="50%">
              <Typography variant="body2" color="text.secondary">
                View & manage permissions
              </Typography>
            </Box>

            <Box width="20%">
              <Button size="small" onClick={() => handleEdit(role)}>
                Edit
              </Button>
              <Button size="small" color="error">
                Delete
              </Button>
            </Box>
          </Box>
        ))}
      </Paper>

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
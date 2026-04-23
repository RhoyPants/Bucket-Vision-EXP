"use client";

import { Box, Typography, Button, Paper } from "@mui/material";
import { useEffect, useState } from "react";
import { getUsers } from "@/app/lib/user.api";
import UserModal from "@/app/components/shared/modals/UserModal";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await getUsers();
    setUsers(res);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Users</Typography>

        <Button
          variant="contained"
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
        >
          Add User
        </Button>
      </Box>

      <Paper>
        <Box display="flex" px={2} py={1} borderBottom="1px solid #eee">
          <Box width="30%">Name</Box>
          <Box width="30%">Email</Box>
          <Box width="20%">Role</Box>
          <Box width="20%">Actions</Box>
        </Box>

        {users.map((u) => (
          <Box key={u.id} display="flex" px={2} py={2}>
            <Box width="30%">{u.name}</Box>
            <Box width="30%">{u.email}</Box>
            <Box width="20%">{u.role?.name}</Box>

            <Box width="20%">
              <Button size="small" onClick={() => {
                setSelected(u);
                setOpen(true);
              }}>
                Edit
              </Button>
            </Box>
          </Box>
        ))}
      </Paper>

      <UserModal
        open={open}
        onClose={() => setOpen(false)}
        user={selected}
        refresh={fetchUsers}
      />
    </Box>
  );
}
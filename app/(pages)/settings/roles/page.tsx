"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Checkbox,
  Grid,
  Divider,
} from "@mui/material";

const modules = [
  "PROJECTS",
  "TASKS",
  "SUBTASKS",
  "USERS",
  "USER_RELATIONS",
];

const actions = ["CREATE", "READ", "UPDATE", "DELETE"];

const rolesMock = [
  { id: "1", name: "Admin" },
  { id: "2", name: "Manager" },
  { id: "3", name: "Engineer" },
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState(rolesMock[0]);

  const [permissions, setPermissions] = useState<any>({});

  const handleToggle = (module: string, action: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  return (
    <Box display="flex" height="100%">
      {/* LEFT PANEL */}
      <Box width="250px" borderRight="1px solid #eee" p={2}>
        <Typography variant="h6" mb={2}>
          Roles
        </Typography>

        <List>
          {rolesMock.map((role) => (
            <ListItemButton
              key={role.id}
              selected={selectedRole.id === role.id}
              onClick={() => setSelectedRole(role)}
            >
              <ListItemText primary={role.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* RIGHT PANEL */}
      <Box flex={1} p={3}>
        <Typography variant="h5" mb={2}>
          Permissions — {selectedRole.name}
        </Typography>

        <Paper sx={{ p: 2 }}>
          {/* HEADER */}
          <Grid container spacing={2} mb={2}>
           <Grid size={{ xs: 6, md: 4 }}>
              <Typography fontWeight="bold">Module</Typography>
            </Grid>
            {actions.map((action) => (
              <Grid size={{ xs: 2, md: 2 }} key={action}>
                <Typography fontWeight="bold">{action}</Typography>
              </Grid>
            ))}
          </Grid>

          <Divider />

          {/* ROWS */}
          {modules.map((module) => (
            <Grid container spacing={2} alignItems="center" key={module} py={1}>
              <Grid size={{ xs: 6, md: 4 }}>
                <Typography>{module}</Typography>
              </Grid>

              {actions.map((action) => (
                <Grid size={{ xs: 2, md: 2 }} key={action}>
                  <Checkbox
                    checked={permissions[module]?.[action] || false}
                    onChange={() => handleToggle(module, action)}
                  />
                </Grid>
              ))}
            </Grid>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}
"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

export interface ProjectVersion {
  version_id: string;
  version_name: string;
  created_at: string;
}

interface ProjectVersionDrawerProps {
  open: boolean;
  projectName?: string;
  versions: ProjectVersion[];
  onClose: () => void;
  onAddVersion: () => void;
  onSelectVersion?: (version: ProjectVersion) => void;
}

export default function ProjectVersionDrawer({
  open,
  projectName,
  versions,
  onClose,
  onAddVersion,
  onSelectVersion,
}: ProjectVersionDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Box>
          <Typography fontWeight={700}>Project Versions</Typography>
          {projectName && (
            <Typography fontSize={12} color="text.secondary">
              {projectName}
            </Typography>
          )}
        </Box>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* VERSION LIST */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1 }}>
        <List>
          {versions.length === 0 && (
            <Typography
              sx={{
                px: 2,
                py: 3,
                fontSize: 13,
                color: "text.secondary",
                textAlign: "center",
              }}
            >
              No versions created yet.
            </Typography>
          )}

          {versions.map((version) => (
            <ListItemButton
              key={version.version_id}
              sx={{
                borderRadius: 1,
                mb: 0.5,
              }}
              onClick={() => onSelectVersion?.(version)}
            >
              <ListItemText
                primary={version.version_name}
                secondary={new Date(
                  version.created_at
                ).toLocaleDateString()}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{
                  fontSize: 12,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Divider />

      {/* ADD VERSION BUTTON */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none" }}
          onClick={onAddVersion}
        >
          Add Version
        </Button>
      </Box>
    </Drawer>
  );
}

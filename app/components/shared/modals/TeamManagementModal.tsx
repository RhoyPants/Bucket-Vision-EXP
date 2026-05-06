"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ProjectTeamPanel from "@/app/(pages)/projects/[id]/setup/components/ProjectTeamPanel";

interface TeamManagementModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function TeamManagementModal({
  open,
  onClose,
  projectId,
}: TeamManagementModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: 2,
          maxHeight: "90vh",
        } 
      }}
    >
      <DialogTitle 
        sx={{ 
          fontWeight: "bold", 
          pb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        👥 Team Management
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, minHeight: 400 }}>
        <ProjectTeamPanel projectId={projectId} />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: "1px solid #e5e7eb" }}>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<ArrowBackIcon />}
          sx={{
            backgroundColor: "#6b7280",
            "&:hover": {
              backgroundColor: "#4b5563"
            }
          }}
        >
          Back to Projects
        </Button>
      </DialogActions>
    </Dialog>
  );
}

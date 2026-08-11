"use client";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

export type StructureItemKind = "scope" | "task" | "subtask";

interface DeleteStructureItemDialogProps {
  open: boolean;
  kind: StructureItemKind;
  name: string;
  impactMessage: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteStructureItemDialog({
  open,
  kind,
  name,
  impactMessage,
  loading = false,
  onClose,
  onConfirm,
}: DeleteStructureItemDialogProps) {
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="xs"
      fullWidth
      aria-labelledby="delete-structure-item-title"
      PaperProps={{ sx: { borderRadius: 2.5 } }}
    >
      <DialogTitle id="delete-structure-item-title" sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 42, height: 42, borderRadius: "50%", bgcolor: "#fef2f2", color: "#dc2626", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <WarningAmberRoundedIcon />
          </Box>
          <Box>
            <Typography sx={{ color: "#1e293b", fontSize: 18, fontWeight: 700 }}>Delete {kind}?</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12, fontWeight: 400 }}>This action cannot be undone.</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Typography sx={{ color: "#475569", fontSize: 13.5, lineHeight: 1.6 }}>
          You are about to permanently delete <strong>{name}</strong>.
        </Typography>
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 1.5 }}>
          <Typography sx={{ color: "#9a3412", fontSize: 12.5, fontWeight: 600 }}>{impactMessage}</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e2e8f0" }}>
        <Button variant="text" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading} sx={{ minWidth: 120 }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : `Delete ${label}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

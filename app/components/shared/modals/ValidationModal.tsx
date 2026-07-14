"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";

interface ValidationModalProps {
  open: boolean;
  title: string;
  details: string[];
  targets?: string[];
  onClose: () => void;
  actionLabel?: string;
}

export default function ValidationModal({
  open,
  title,
  details,
  targets = [],
  onClose,
  actionLabel = "Got it",
}: ValidationModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.25} sx={{ mt: 0.5 }}>
          {targets.length > 0 && (
            <Stack spacing={0.5} sx={{ p: 1.25, borderRadius: 1, bgcolor: "#FEF2F2", border: "1px solid #FECACA" }}>
              <Typography sx={{ fontWeight: 700, color: "#B91C1C", fontSize: 13 }}>
                Needs Changes
              </Typography>
              {targets.map((target, index) => (
                <Typography key={`${target}-${index}`} sx={{ color: "#B91C1C", fontSize: 13, fontWeight: 600 }}>
                  * {target}
                </Typography>
              ))}
            </Stack>
          )}

          {details.map((item, index) => (
            <Typography key={`${item}-${index}`} sx={{ color: "#334155", fontSize: 14 }}>
              {index + 1}. {item}
            </Typography>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

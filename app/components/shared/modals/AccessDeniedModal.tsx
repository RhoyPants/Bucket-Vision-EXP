"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  accessDeniedEventName,
  AccessDeniedDetail,
} from "@/app/lib/accessDeniedEvent";

const formatAction = (value: string) => value.toLowerCase();

const formatResource = (value: string) =>
  value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function AccessDeniedModal() {
  const [detail, setDetail] = useState<AccessDeniedDetail | null>(null);

  useEffect(() => {
    const handleAccessDenied = (event: Event) => {
      const customEvent = event as CustomEvent<AccessDeniedDetail>;
      setDetail(customEvent.detail);
    };

    window.addEventListener(accessDeniedEventName, handleAccessDenied);

    return () => {
      window.removeEventListener(accessDeniedEventName, handleAccessDenied);
    };
  }, []);

  const handleClose = () => setDetail(null);
  const action = detail ? formatAction(detail.action) : "";
  const resource = detail ? formatResource(detail.resource) : "";

  return (
    <Dialog
      open={Boolean(detail)}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: "hidden",
          boxShadow: "0 22px 70px rgba(15, 23, 42, 0.30)",
          bgcolor: "#FFFFFF",
        },
      }}
    >
      <Box sx={{ px: { xs: 2.25, sm: 3 }, pt: { xs: 2.25, sm: 3 }, pb: 0 }}>
        <Box
          component="img"
          src="/images/access-denied-simple.svg"
          alt=""
          sx={{
            display: "block",
            width: "100%",
            maxWidth: 420,
            height: { xs: 122, sm: 150 },
            mx: "auto",
            objectFit: "contain",
          }}
        />
      </Box>

      <DialogTitle
        sx={{ px: { xs: 3, sm: 4 }, pt: 1.5, pb: 0.5, textAlign: "center" }}
      >
        <Typography
          sx={{
            color: "#e00000",
            fontSize: { xs: 24, sm: 28 },
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          Access Blocked
        </Typography>
        <Typography
          sx={{ color: "#64748B", mt: 1, fontSize: 14.5, fontWeight: 650 }}
        >
          You don&apos;t have access to {action} {resource}.
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{ px: { xs: 3, sm: 4 }, pt: 0.75, pb: 0, textAlign: "center" }}
      >
        <Typography
          sx={{
            color: "#64748B",
            mt: 1,
            fontSize: 13.5,
            lineHeight: 1.6,
            maxWidth: 390,
            mx: "auto",
          }}
        >
          This action needs an additional permission. Ask an administrator to
          enable this permission for your role, then try again.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{ px: { xs: 3, sm: 4 }, pt: 2.25, pb: 3, justifyContent: "center" }}
      >
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            minWidth: 118,
            height: 40,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            bgcolor: "#210e64",
            boxShadow: "none",
            "&:hover": { bgcolor: "#160847", boxShadow: "none" },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}

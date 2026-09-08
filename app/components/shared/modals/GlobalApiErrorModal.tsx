"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { ApiErrorDetail, apiErrorEventName } from "@/app/lib/apiErrorEvent";

export default function GlobalApiErrorModal() {
  const [detail, setDetail] = useState<ApiErrorDetail | null>(null);

  const close = () => {
    const redirectTo = detail?.redirectTo;
    setDetail(null);
    if (redirectTo) window.location.href = redirectTo;
  };

  useEffect(() => {
    const handleApiError = (event: Event) => {
      setDetail((event as CustomEvent<ApiErrorDetail>).detail);
    };
    window.addEventListener(apiErrorEventName, handleApiError);
    return () => window.removeEventListener(apiErrorEventName, handleApiError);
  }, []);

  return (
    <Dialog open={Boolean(detail)} onClose={close} maxWidth="xs" fullWidth aria-labelledby="global-api-error-title">
      <DialogTitle id="global-api-error-title" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 900, color: "#B42318" }}>
        <ErrorOutlineRoundedIcon />
        {detail?.title || "Something went wrong"}
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="error" sx={{ mb: detail?.status || detail?.path ? 2 : 0 }}>
          {detail?.message || "The request could not be completed. Please try again."}
        </Alert>
        <Typography sx={{ mt: 1.5, fontSize: 13, color: "#667085" }}>
          If the issue continues, please contact the administrator for support.
        </Typography>
        {(detail?.status || detail?.path) && (
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            {detail.status && <Typography sx={{ fontSize: 12, color: "#475467" }}><strong>HTTP status:</strong> {detail.status}</Typography>}
            {detail.path && <Typography sx={{ mt: 0.4, fontSize: 11, color: "#667085", overflowWrap: "anywhere" }}><strong>Request:</strong> {[detail.method, detail.path].filter(Boolean).join(" ")}</Typography>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={close} autoFocus>{detail?.redirectTo ? "Return to login" : "Close"}</Button>
      </DialogActions>
    </Dialog>
  );
}

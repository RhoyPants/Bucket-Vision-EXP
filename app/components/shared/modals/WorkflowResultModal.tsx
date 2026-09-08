"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";

export type WorkflowResultTone = "success" | "error" | "warning" | "neutral";
interface Props { open: boolean; title: string; message: string; helperText: string; buttonLabel: string; tone?: WorkflowResultTone; onClose: () => void }

export default function WorkflowResultModal({ open, title, message, helperText, buttonLabel, tone = "success", onClose }: Props) {
  const colors = tone === "error" ? { dark: "#991b1b", main: "#ef4444" } : tone === "warning" ? { dark: "#9a3412", main: "#f59e0b" } : tone === "neutral" ? { dark: "#374151", main: "#6b7280" } : { dark: "#065f46", main: "#10b981" };
  const icon = tone === "error" ? <BlockIcon sx={{ fontSize: 56, color: colors.main }} /> : tone === "warning" ? <HourglassTopIcon sx={{ fontSize: 56, color: colors.main }} /> : tone === "neutral" ? <CancelOutlinedIcon sx={{ fontSize: 56, color: colors.main }} /> : <CheckCircleIcon sx={{ fontSize: 56, color: colors.main }} />;
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontWeight: 800, color: colors.dark }}>{title}</DialogTitle>
    <DialogContent><Stack spacing={1.5} alignItems="center" sx={{ py: 1 }}>{icon}<Typography sx={{ textAlign: "center", fontWeight: 700 }}>{message}</Typography><Typography sx={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>{helperText}</Typography></Stack></DialogContent>
    <DialogActions sx={{ justifyContent: "center", pb: 2.5 }}><Button variant="contained" onClick={onClose} sx={{ bgcolor: colors.dark, "&:hover": { bgcolor: colors.dark } }}>{buttonLabel}</Button></DialogActions>
  </Dialog>;
}

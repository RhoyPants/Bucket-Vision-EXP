"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { sendEmail } from "@/app/api-service/emailService";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailLayoutSection {
  /** Label shown above the section in the preview */
  label: string;
  /** Static content rendered inside the email body */
  content: string;
}

export interface EmailNotificationModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-filled recipient address (can still be edited unless readOnlyTo is true) */
  defaultTo?: string;
  readOnlyTo?: boolean;
  /** Pre-filled subject */
  defaultSubject?: string;
  /** Structured layout sections that build the email body */
  layout?: EmailLayoutSection[];
  /** Fallback free-text message when no layout is provided */
  defaultMessage?: string;
  /** Custom React node rendered as the email preview (overrides layout & defaultMessage display) */
  previewNode?: React.ReactNode;
  /** HTML string sent as the message body (used when previewNode is provided) */
  htmlMessage?: string;
  /** Modal title */
  title?: string;
  /** Called after a successful send */
  onSuccess?: () => void;
}

// ─── Helper: build plain-text message from layout sections ───────────────────

function buildMessageFromLayout(sections: EmailLayoutSection[]): string {
  return sections
    .map((s) => `${s.label}:\n${s.content}`)
    .join("\n\n");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmailNotificationModal({
  open,
  onClose,
  defaultTo = "",
  readOnlyTo = false,
  defaultSubject = "",
  layout,
  defaultMessage = "",
  previewNode,
  htmlMessage,
  title = "Send Email Notification",
  onSuccess,
}: EmailNotificationModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(
    layout ? buildMessageFromLayout(layout) : defaultMessage
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state when modal re-opens with new props
  const handleEnter = () => {
    setTo(defaultTo);
    setSubject(defaultSubject);
    setMessage(layout ? buildMessageFromLayout(layout) : defaultMessage);
    setError(null);
    setSuccess(false);
  };

  // Resolve what to actually send: htmlMessage > plain message > layout-built message
  const resolvePayload = () => {
    if (htmlMessage) return htmlMessage;
    if (layout) return buildMessageFromLayout(layout);
    return message;
  };

  const handleSend = async () => {
    setError(null);

    if (!to.trim()) {
      setError("Recipient email is required.");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }

    const payload = resolvePayload();
    if (!payload.trim()) {
      setError("Message body cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await sendEmail({ to: to.trim(), subject: subject.trim(), message: payload });
      setSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send email. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleEnter }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <EmailIcon fontSize="small" color="primary" />
        {title}
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* Feedback banners */}
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Email sent successfully!</Alert>}

          {/* Recipient */}
          <TextField
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={readOnlyTo || loading || success}
            fullWidth
            size="small"
            placeholder="recipient@example.com"
          />

          {/* Subject */}
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading || success}
            fullWidth
            size="small"
          />

          {/* Layout preview (read-only per section) */}
          {!previewNode && layout && layout.length > 0 && (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                EMAIL BODY PREVIEW
              </Typography>
              <Stack spacing={1.5}>
                {layout.map((section, idx) => (
                  <Box key={idx}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {section.label}
                    </Typography>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {section.content}
                    </Typography>
                    {idx < layout.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Rich email preview node */}
          {previewNode && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                EMAIL PREVIEW
              </Typography>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                {previewNode}
              </Box>
            </Box>
          )}

          {/* Free-text message (shown when no layout or previewNode) */}
          {!layout && !previewNode && (
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || success}
              fullWidth
              multiline
              minRows={5}
              size="small"
            />
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
        >
          {loading ? "Sending…" : "Send Email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

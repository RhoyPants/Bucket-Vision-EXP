"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { notificationService, type NotificationAcknowledgement } from "@/app/api-service/notificationService";
import { workflowError } from "@/app/api-service/incidentManagementService";

const incidentDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) : "—";

const statusLabel: Record<NotificationAcknowledgement["status"], string> = {
  AWAITING_ACKNOWLEDGEMENT: "Awaiting acknowledgement",
  READ: "Read, awaiting acknowledgement",
  ACKNOWLEDGED: "Acknowledged",
};

export default function IncidentAcknowledgements({ incidentId, resourceType, actionId, title = "Assignment acknowledgements" }: {
  incidentId: string;
  resourceType: "INCIDENT" | "INCIDENT_ACTION" | "INCIDENT_INVESTIGATION";
  actionId?: string;
  title?: string;
}) {
  const [items, setItems] = useState<NotificationAcknowledgement[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const data = await notificationService.acknowledgements({ resourceType, incidentId, ...(actionId ? { actionId } : {}) });
        if (alive) { setItems(data); setError(""); timer = setTimeout(load, 15000); }
      } catch (value) {
        if (alive) setError(workflowError(value).message);
      }
    };
    void load();
    return () => { alive = false; clearTimeout(timer); };
  }, [incidentId, resourceType, actionId]);

  if (error) return <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert>;
  if (!items) return <Box sx={{ mt: 1 }}><CircularProgress size={18} /></Box>;
  if (!items.length) return <Box sx={{ mt: 1.25, p: 1.25, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 1 }}><Typography sx={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>{title}</Typography><Typography sx={{ fontSize: 11, color: "#64748B", mt: 0.35 }}>No acknowledgement-required assignment has been sent yet.</Typography></Box>;
  return <Box sx={{ mt: 1.25, p: 1.25, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 1 }}>
    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#334155", mb: 0.75 }}>{title}</Typography>
    <Stack spacing={0.75}>
      {items.map((item) => {
        const acknowledged = item.status === "ACKNOWLEDGED";
        return <Box key={item.notificationId} sx={{ pl: 1, borderLeft: "3px solid", borderColor: acknowledged ? "#16A34A" : item.status === "READ" ? "#F59E0B" : "#94A3B8" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.25}>
            <Typography sx={{ fontSize: 12, fontWeight: 750 }}>{item.recipient.name}</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: acknowledged ? "#15803D" : "#92400E" }}>{statusLabel[item.status]}</Typography>
          </Stack>
          <Typography sx={{ fontSize: 10.5, color: "#64748B" }}>{acknowledged ? incidentDate(item.acknowledgedAt) : item.readAt ? `Read ${incidentDate(item.readAt)}` : `Notified ${incidentDate(item.sentAt)}`}</Typography>
          {item.acknowledgementRemarks && <Typography sx={{ fontSize: 11, color: "#475569", mt: 0.25 }}>“{item.acknowledgementRemarks}”</Typography>}
        </Box>;
      })}
    </Stack>
  </Box>;
}

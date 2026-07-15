"use client";

import { Box, Typography } from "@mui/material";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApprovalEmailData {
  recipientName: string;
  projectName: string;
  pin: string;
  priorityType: string;
  projectedStart: string;
  projectedEnd: string;
  requestedBy: string;
  date: string;
  approvalUrl: string;
}

// ─── HTML builder (sent via API) ─────────────────────────────────────────────

export function buildApprovalEmailHTML(data: ApprovalEmailData): string {
  const rows: { label: string; value: string; colored?: boolean }[] = [
    { label: "Project Name",     value: data.projectName },
    { label: "PIN",              value: data.pin },
    { label: "Priority Type",    value: data.priorityType, colored: true },
    { label: "Projected Start",  value: data.projectedStart },
    { label: "Projected End",    value: data.projectedEnd },
    { label: "Requested By",     value: data.requestedBy },
    { label: "Date Submitted",   value: data.date },
    { label: "Status",           value: "Pending Approval", colored: true },
  ];

  const tableRows = rows
    .map(
      (row, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9f6ff" : "#ffffff"}">
      <td style="padding:11px 16px;border:1px solid #e0e0e0;font-weight:700;color:#0A0A0A;width:38%;font-size:13px">${row.label}</td>
      <td style="padding:11px 16px;border:1px solid #e0e0e0;font-size:13px">
        ${
          row.colored
            ? `<span style="background:#fff3e0;color:#e65100;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700">${row.value}</span>`
            : `<span style="color:#1a1a1a">${row.value}</span>`
        }
      </td>
    </tr>`
    )
    .join("");

  return `
<div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;min-height:100%">
  <div style="max-width:600px;margin:0 auto">

    <div style="background:#4B2E83;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px">V.I.S.I.O.N</h1>
      <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Project Management System</p>
    </div>

    <div style="background:#ffffff;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none">
      <h2 style="color:#1a1a1a;margin-top:0;font-size:20px">Hey ${data.recipientName},</h2>
      <p style="color:#555;font-size:15px;line-height:1.6">
        You have a new <strong style="color:#4B2E83">Approval Request</strong> waiting for your review.
        Please check the details below and take action at your earliest convenience.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        ${tableRows}
      </table>

      <div style="text-align:center;margin:28px 0 8px">
        <a href="${data.approvalUrl}"
           style="display:inline-block;background:#4B2E83;color:#fff;padding:13px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">
          View Approval Request →
        </a>
      </div>

      <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">
        If the button doesn't work, copy this link:<br/>
        <a href="${data.approvalUrl}" style="color:#4B2E83">${data.approvalUrl}</a>
      </p>
    </div>

    <p style="text-align:center;color:#bbb;font-size:11px;margin-top:16px">
      © ${new Date().getFullYear()} V.I.S.I.O.N · Global Visions Inc.
    </p>
  </div>
</div>`.trim();
}

// ─── React preview component (rendered inside EmailNotificationModal) ─────────

export function ApprovalEmailPreview({ data }: { data: ApprovalEmailData }) {
  const rows: { label: string; value: string; badge?: boolean }[] = [
    { label: "Project Name",    value: data.projectName },
    { label: "PIN",             value: data.pin },
    { label: "Priority Type",   value: data.priorityType, badge: true },
    { label: "Projected Start", value: data.projectedStart },
    { label: "Projected End",   value: data.projectedEnd },
    { label: "Requested By",    value: data.requestedBy },
    { label: "Date Submitted",  value: data.date },
    { label: "Status",          value: " Pending Approval", badge: true },
  ];

  return (
    <Box sx={{ fontFamily: "Arial, sans-serif", bgcolor: "#f5f5f5", p: 2 }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ bgcolor: "#4B2E83", px: 4, py: 3, borderRadius: "8px 8px 0 0", textAlign: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
            V.I.S.I.O.N
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, mt: 0.5 }}>
            Project Management System
          </Typography>
        </Box>

        {/* Body */}
        <Box sx={{ bgcolor: "#fff", px: 4, py: 3.5, border: "1px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", mb: 1 }}>
            Hey {data.recipientName},
          </Typography>
          <Typography sx={{ color: "#555", fontSize: 14, lineHeight: 1.7, mb: 2 }}>
            You have a new{" "}
            <Box component="span" sx={{ color: "#4B2E83", fontWeight: 700 }}>
              Approval Request
            </Box>{" "}
            waiting for your review. Please check the details below and take action at your earliest convenience.
          </Typography>

          {/* Details table */}
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2.5, fontSize: 13 }}>
            <tbody>
              {rows.map((row, i) => (
                <Box component="tr" key={row.label} sx={{ bgcolor: i % 2 === 0 ? "#f9f6ff" : "#fff" }}>
                  <Box
                    component="td"
                    sx={{ p: "10px 14px", border: "1px solid #e0e0e0", fontWeight: 700, color: "#4B2E83", width: "38%", fontSize: 13 }}
                  >
                    {row.label}
                  </Box>
                  <Box component="td" sx={{ p: "10px 14px", border: "1px solid #e0e0e0" }}>
                    {row.badge ? (
                      <Box
                        component="span"
                        sx={{ bgcolor: "#fff3e0", color: "#e65100", px: 1.5, py: 0.4, borderRadius: "20px", fontSize: 12, fontWeight: 700 }}
                      >
                        {row.value}
                      </Box>
                    ) : (
                      <Typography component="span" sx={{ color: "#1a1a1a", fontSize: 13 }}>
                        {row.value}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </tbody>
          </Box>

          {/* CTA button */}
          <Box sx={{ textAlign: "center", my: 3 }}>
            <Box
              component="a"
              href={data.approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                bgcolor: "#4B2E83",
                color: "#fff",
                px: 4,
                py: 1.5,
                borderRadius: 1.5,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                "&:hover": { bgcolor: "#3d2363" },
              }}
            >
              View Approval Request →
            </Box>
          </Box>

          <Typography sx={{ color: "#bbb", fontSize: 11, textAlign: "center" }}>
            Link:{" "}
            <Box component="a" href={data.approvalUrl} sx={{ color: "#4B2E83", fontSize: 11 }}>
              {data.approvalUrl}
            </Box>
          </Typography>
        </Box>

        {/* Footer */}
        <Typography sx={{ textAlign: "center", color: "#bbb", fontSize: 11, mt: 1.5 }}>
          © {new Date().getFullYear()} V.I.S.I.O.N · Global Visions Inc.
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Rejection email ──────────────────────────────────────────────────────────

export interface RejectionEmailData {
  recipientName: string;
  projectName: string;
  pin: string;
  priorityType: string;
  projectedStart: string;
  projectedEnd: string;
  rejectedBy: string;
  rejectionReason: string;
  date: string;
  revisionUrl: string;
}

export function buildRejectionEmailHTML(data: RejectionEmailData): string {
  const infoRows: { label: string; value: string }[] = [
    { label: "Project Name",    value: data.projectName },
    { label: "PIN",             value: data.pin },
    { label: "Priority Type",   value: data.priorityType },
    { label: "Projected Start", value: data.projectedStart },
    { label: "Projected End",   value: data.projectedEnd },
    { label: "Rejected By",     value: data.rejectedBy },
    { label: "Date",            value: data.date },
  ];

  const tableRows = infoRows
    .map(
      (row, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff5f5" : "#ffffff"}">
      <td style="padding:11px 16px;border:1px solid #e0e0e0;font-weight:700;color:#0A0A0A;width:38%;font-size:13px">${row.label}</td>
      <td style="padding:11px 16px;border:1px solid #e0e0e0;color:#1a1a1a;font-size:13px">${row.value}</td>
    </tr>`
    )
    .join("");

  return `
<div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;min-height:100%">
  <div style="max-width:600px;margin:0 auto">

    <div style="background:#4B2E83;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px">V.I.S.I.O.N</h1>
      <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Project Management System</p>
    </div>

    <div style="background:#ffffff;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none">
      <h2 style="color:#1a1a1a;margin-top:0;font-size:20px">Hey ${data.recipientName},</h2>
      <p style="color:#555;font-size:15px;line-height:1.6">
        Your project has been <strong style="color:#c62828">rejected</strong>. 
        Please review the feedback below and make the necessary revisions.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        ${tableRows}
      </table>

      <div style="background:#fff5f5;border-left:4px solid #c62828;padding:14px 18px;border-radius:4px;margin:20px 0">
        <p style="margin:0 0 6px;font-weight:700;color:#c62828;font-size:13px">Reason for Rejection</p>
        <p style="margin:0;color:#333;font-size:14px;line-height:1.6">${data.rejectionReason}</p>
      </div>

      <div style="text-align:center;margin:28px 0 8px">
        <a href="${data.revisionUrl}"
           style="display:inline-block;background:#c62828;color:#fff;padding:13px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">
          Revise Project →
        </a>
      </div>

      <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">
        If the button doesn't work, copy this link:<br/>
        <a href="${data.revisionUrl}" style="color:#c62828">${data.revisionUrl}</a>
      </p>
    </div>

    <p style="text-align:center;color:#bbb;font-size:11px;margin-top:16px">
      © ${new Date().getFullYear()} V.I.S.I.O.N · Global Visions Inc.
    </p>
  </div>
</div>`.trim();
}

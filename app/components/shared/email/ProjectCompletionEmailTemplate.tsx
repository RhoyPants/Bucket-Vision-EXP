"use client";

import { Box, Typography } from "@mui/material";

export interface ProjectCompletionEmailData {
  recipientName: string;
  projectName: string;
  pin: string;
  completionDate: string;
  completedBy: string;
  remarks: string;
  projectUrl: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function buildProjectCompletionEmailHTML(
  data: ProjectCompletionEmailData,
): string {
  const safe = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, escapeHtml(value)]),
  ) as unknown as ProjectCompletionEmailData;
  const rows = [
    { label: "Project Name", value: safe.projectName },
    { label: "PIN", value: safe.pin },
    { label: "Completion Date", value: safe.completionDate },
    { label: "Completed By", value: safe.completedBy },
    { label: "Status", value: "Completed", badge: true },
  ];
  const tableRows = rows
    .map(
      (row, index) => `
    <tr style="background:${index % 2 === 0 ? "#f9f6ff" : "#ffffff"}">
      <td style="padding:11px 16px;border:1px solid #e0e0e0;font-weight:700;color:#0A0A0A;width:38%;font-size:13px">${row.label}</td>
      <td style="padding:11px 16px;border:1px solid #e0e0e0;font-size:13px">
        ${
          row.badge
            ? `<span style="background:#e8f5e9;color:#2e7d32;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700">${row.value}</span>`
            : `<span style="color:#1a1a1a">${row.value}</span>`
        }
      </td>
    </tr>`,
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
      <h2 style="color:#1a1a1a;margin-top:0;font-size:20px">Hey ${safe.recipientName},</h2>
      <p style="color:#555;font-size:15px;line-height:1.6">
        The project below has been <strong style="color:#2e7d32">tagged as completed</strong>.
        You are receiving this notification as a project member or approver.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        ${tableRows}
      </table>

      <div style="background:#f9f6ff;border-left:4px solid #4B2E83;padding:14px 18px;border-radius:4px;margin:20px 0">
        <p style="margin:0 0 6px;font-weight:700;color:#4B2E83;font-size:13px">Completion Remarks</p>
        <p style="margin:0;color:#333;font-size:14px;line-height:1.6">${safe.remarks}</p>
      </div>

      <div style="text-align:center;margin:28px 0 8px">
        <a href="${safe.projectUrl}"
           style="display:inline-block;background:#4B2E83;color:#fff;padding:13px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">
          View Project Information &rarr;
        </a>
      </div>

      <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">
        If the button doesn't work, copy this link:<br/>
        <a href="${safe.projectUrl}" style="color:#4B2E83">${safe.projectUrl}</a>
      </p>
    </div>

    <p style="text-align:center;color:#bbb;font-size:11px;margin-top:16px">
      &copy; ${new Date().getFullYear()} V.I.S.I.O.N &middot; Global Visions Holdings Inc.
    </p>
  </div>
</div>`.trim();
}

export function ProjectCompletionEmailPreview({
  data,
}: {
  data: ProjectCompletionEmailData;
}) {
  const rows = [
    { label: "Project Name", value: data.projectName },
    { label: "PIN", value: data.pin },
    { label: "Completion Date", value: data.completionDate },
    { label: "Completed By", value: data.completedBy },
    { label: "Status", value: "Completed", badge: true },
  ];

  return (
    <Box sx={{ fontFamily: "Arial, sans-serif", bgcolor: "#f5f5f5", p: 2 }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Box sx={{ bgcolor: "#4B2E83", px: 4, py: 3, borderRadius: "8px 8px 0 0", textAlign: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
            V.I.S.I.O.N
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, mt: 0.5 }}>
            Project Management System
          </Typography>
        </Box>

        <Box sx={{ bgcolor: "#fff", px: 4, py: 3.5, border: "1px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", mb: 1 }}>
            Hey {data.recipientName},
          </Typography>
          <Typography sx={{ color: "#555", fontSize: 14, lineHeight: 1.7, mb: 2 }}>
            The project below has been tagged as completed. You are receiving this
            notification as a project member or approver.
          </Typography>

          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2.5, fontSize: 13 }}>
            <tbody>
              {rows.map((row, index) => (
                <Box component="tr" key={row.label} sx={{ bgcolor: index % 2 === 0 ? "#f9f6ff" : "#fff" }}>
                  <Box component="td" sx={{ p: "10px 14px", border: "1px solid #e0e0e0", fontWeight: 700, color: "#4B2E83", width: "38%", fontSize: 13 }}>
                    {row.label}
                  </Box>
                  <Box component="td" sx={{ p: "10px 14px", border: "1px solid #e0e0e0" }}>
                    {row.badge ? (
                      <Box component="span" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", px: 1.5, py: 0.4, borderRadius: "20px", fontSize: 12, fontWeight: 700 }}>
                        {row.value}
                      </Box>
                    ) : (
                      row.value
                    )}
                  </Box>
                </Box>
              ))}
            </tbody>
          </Box>

          <Box sx={{ bgcolor: "#f9f6ff", borderLeft: "4px solid #4B2E83", p: 2, mb: 3 }}>
            <Typography sx={{ color: "#4B2E83", fontSize: 13, fontWeight: 700 }}>
              Completion Remarks
            </Typography>
            <Typography sx={{ mt: 0.5, color: "#333", fontSize: 13 }}>
              {data.remarks}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box component="a" href={data.projectUrl} sx={{ display: "inline-block", bgcolor: "#4B2E83", color: "#fff", px: 4, py: 1.5, borderRadius: 1.5, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              View Project Information &rarr;
            </Box>
          </Box>
        </Box>

        <Typography sx={{ textAlign: "center", color: "#bbb", fontSize: 11, mt: 1.5 }}>
          &copy; {new Date().getFullYear()} V.I.S.I.O.N &middot; Global Visions Holdings Inc.
        </Typography>
      </Box>
    </Box>
  );
}

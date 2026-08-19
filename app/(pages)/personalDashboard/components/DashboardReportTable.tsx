"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
} from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { DashboardReportTable as DashboardReportTableData } from "@/app/api-service/personalDashboardService";

const labelCellSx = {
  position: "sticky",
  left: 0,
  zIndex: 3,
  minWidth: 190,
  maxWidth: 190,
  bgcolor: "#fff",
  borderRight: "2px solid #cbd5e1",
  fontSize: 11,
  fontWeight: 800,
  color: "#111827",
  whiteSpace: "normal",
  lineHeight: 1.2,
} as const;

const valueCellSx = {
  minWidth: 58,
  maxWidth: 72,
  px: 0.75,
  py: 0.5,
  border: "1px solid #d1d5db",
  fontSize: 10,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
} as const;

const blankValue = "";

const getDisplayValue = (value?: { formattedValue?: string | null; value?: number | null }) => {
  if (!value) return blankValue;
  if (value.formattedValue) return value.formattedValue;
  return value.value !== null && value.value !== undefined ? String(value.value) : blankValue;
};

const formatDate = (date?: string | null) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatColumnDate = (date?: string | null) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};

export default function DashboardReportTable({
  reportTable,
  loading,
}: {
  reportTable: DashboardReportTableData | null;
  loading?: boolean;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const summaryValuesByRow = useMemo(
    () =>
      new Map(
        (reportTable?.summaryRows ?? []).map((row) => [
          row.key,
          new Map(row.values.map((value) => [value.weekNumber, value])),
        ])
      ),
    [reportTable?.summaryRows]
  );
  const detailValuesByRow = useMemo(
    () =>
      new Map(
        (reportTable?.detailRows ?? []).map((row) => [
          row.key,
          new Map(row.values.map((value) => [value.columnIndex, value])),
        ])
      ),
    [reportTable?.detailRows]
  );

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid #dbeafe",
        boxShadow: "none",
        backgroundColor: "#fff",
        height: "auto !important",
        maxHeight: "none !important",
        overflow: "visible",
        ...(isFullscreen && {
          position: "fixed",
          inset: 0,
          zIndex: 1400,
          width: "100vw",
          height: "100vh !important",
          borderRadius: 0,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15,23,42,.24)",
        }),
      }}
    >
      <CardContent sx={{ height: isFullscreen ? "100%" : "auto", maxHeight: "none", overflow: isFullscreen ? "hidden" : "visible", display: "flex", flexDirection: "column" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography fontWeight={900}>Report Table</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>
              {reportTable?.project?.name ?? "Project progress, cash flow, and variance"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {reportTable?.project?.totalBudget !== undefined && reportTable.project.totalBudget !== null && (
              <Chip
                size="small"
                label={`Budget ${reportTable.project.totalBudget.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                sx={{ fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }}
              />
            )}
            {reportTable?.generatedAt && (
              <Chip
                size="small"
                label={`Updated ${formatDate(reportTable.generatedAt)}`}
                sx={{ fontWeight: 700, bgcolor: "#f8fafc", color: "#475569" }}
              />
            )}
            <Tooltip title={isFullscreen ? "Exit full screen" : "Show full screen"}>
              <IconButton
                size="small"
                onClick={() => setIsFullscreen((current) => !current)}
                aria-label={isFullscreen ? "Exit full screen" : "Show report table full screen"}
                sx={{ border: "1px solid #CBD5E1", borderRadius: 1.5 }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !reportTable?.columns?.length ? (
          <Alert severity="info">Report table data is not available yet.</Alert>
        ) : (
          <TableContainer
            sx={{
              border: "1px solid #cbd5e1",
              display: "block",
              height: isFullscreen ? "100%" : "auto !important",
              maxHeight: isFullscreen ? "none" : "none !important",
              flex: isFullscreen ? 1 : "initial",
              minHeight: 0,
              overflowX: "auto",
              overflowY: isFullscreen ? "auto" : "hidden",
              scrollbarGutter: "stable",
              bgcolor: "#fff",
            }}
          >
            <Table size="small" sx={{ minWidth: 260 + reportTable.columns.length * 58, mb: 1.5 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      ...labelCellSx,
                      top: 0,
                      zIndex: 5,
                      bgcolor: "#f8fafc",
                      borderTop: "1px solid #cbd5e1",
                    }}
                  />
                  {reportTable.columns.map((column) => (
                    <TableCell
                      key={column.index}
                      align="center"
                      sx={{
                        ...valueCellSx,
                        top: 0,
                        zIndex: 4,
                        bgcolor: "#fff",
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      <Tooltip title={formatDate(column.date)} arrow>
                        <Box>
                          <Typography component="div" sx={{ fontSize: 10, lineHeight: 1.1, fontWeight: 900 }}>
                            {column.label}
                          </Typography>
                          <Typography component="div" sx={{ mt: 0.25, color: "#64748B", fontSize: 8, lineHeight: 1.1, fontWeight: 700 }}>
                            {formatColumnDate(column.date)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{
                      ...labelCellSx,
                      top: 40,
                      zIndex: 5,
                      bgcolor: "#f8fafc",
                    }}
                  />
                  {reportTable.weekGroups.map((week) => (
                    <TableCell
                      key={week.weekNumber}
                      align="center"
                      colSpan={week.colspan}
                      sx={{
                        ...valueCellSx,
                        top: 28,
                        zIndex: 4,
                        bgcolor: "#3f3f46",
                        color: "#fff",
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      {week.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reportTable.summaryRows.map((row) => {
                  const valuesByWeek = summaryValuesByRow.get(row.key);
                  return (
                    <TableRow key={row.key}>
                      <TableCell sx={labelCellSx}>{row.label}</TableCell>
                      {reportTable.weekGroups.map((week) => (
                        <TableCell
                          key={`${row.key}-${week.weekNumber}`}
                          align="right"
                          colSpan={week.colspan}
                          sx={{
                            ...valueCellSx,
                            bgcolor: "#f8fafc",
                            fontWeight: 800,
                            color: row.key.toLowerCase().includes("actual") ? "#047857" : "#111827",
                          }}
                        >
                          {getDisplayValue(valuesByWeek?.get(week.weekNumber))}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell
                    colSpan={reportTable.columns.length + 1}
                    sx={{ height: 12, border: 0, bgcolor: "#fff" }}
                  />
                </TableRow>
                {reportTable.detailRows.map((row) => {
                  const valuesByColumn = detailValuesByRow.get(row.key);
                  const isVariance = row.key.toLowerCase().includes("variance");
                  return (
                    <TableRow key={row.key}>
                      <TableCell sx={labelCellSx}>{row.label}</TableCell>
                      {reportTable.columns.map((column) => {
                        const displayValue = getDisplayValue(valuesByColumn?.get(column.index));
                        return (
                          <TableCell
                            key={`${row.key}-${column.index}`}
                            align="right"
                            sx={{
                              ...valueCellSx,
                              color: isVariance && displayValue.startsWith("-") ? "#dc2626" : "#111827",
                            }}
                          >
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

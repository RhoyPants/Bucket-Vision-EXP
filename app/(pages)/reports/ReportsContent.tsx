"use client";

import {
  Suspense,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useSearchParams } from "next/navigation";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import Layout from "@/app/components/shared/Layout";
import { useAppSelector } from "@/app/redux/hook";
import { getActiveProjectDropdown } from "@/app/api-service/projectService";
import {
  downloadProjectReportPdf,
  getProjectReportPreview,
  getReportCalendar,
  ProjectReportPreview,
  ProgressReportType,
  ReportCalendarData,
  ReportHealth,
  ReportPreviewParams,
} from "@/app/api-service/reportService";

type ProjectOption = {
  id: string;
  name: string;
};

const MANILA_TIME_ZONE = "Asia/Manila" as const;
const PDF_ENDPOINT_AVAILABLE = true;
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const healthColors: Record<
  ReportHealth,
  { color: string; background: string }
> = {
  HEALTHY: { color: "#15803D", background: "#DCFCE7" },
  AT_RISK: { color: "#B45309", background: "#FEF3C7" },
  DELAYED: { color: "#B91C1C", background: "#FEE2E2" },
  UNCLASSIFIED: { color: "#475569", background: "#E2E8F0" },
};

const dateParts = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

const isoDate = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

const utcDate = (value: string) => {
  const { year, month, day } = dateParts(value);
  return new Date(Date.UTC(year, month - 1, day));
};

const addDays = (value: string, days: number) => {
  const date = utcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
};

const mondayToSunday = (value: string) => {
  const date = utcDate(value);
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  const dateFrom = addDays(value, offset);
  return { dateFrom, dateTo: addDays(dateFrom, 6) };
};

const manilaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const monthLabel = (month: string) => {
  const { year, month: monthNumber } = dateParts(`${month}-01`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};

const displayDate = (value?: string | null, options?: { short?: boolean }) => {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: options?.short ? "short" : "long",
    day: "numeric",
    year: "numeric",
    timeZone: value.length === 10 ? "UTC" : MANILA_TIME_ZONE,
  }).format(date);
};

const percent = (value?: number | null) =>
  `${Number(value ?? 0).toFixed(2)}%`;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : fallback;

const reportParams = (
  type: ProgressReportType,
  selectedDate: string,
): ReportPreviewParams => {
  if (type === "DAILY") {
    return { type, date: selectedDate, timezone: MANILA_TIME_ZONE };
  }
  const { dateFrom, dateTo } = mondayToSunday(selectedDate);
  return { type, dateFrom, dateTo, timezone: MANILA_TIME_ZONE };
};

function HealthChip({ health }: { health: ReportHealth }) {
  const tone = healthColors[health] || healthColors.UNCLASSIFIED;
  return (
    <Chip
      size="small"
      label={health.replace("_", " ")}
      sx={{
        height: 23,
        color: tone.color,
        bgcolor: tone.background,
        fontSize: 10,
        fontWeight: 900,
      }}
    />
  );
}

function PaceChip({
  pace,
}: {
  pace: "ON_OR_ABOVE_PLAN" | "BELOW_PLAN" | "UNCLASSIFIED";
}) {
  const tone =
    pace === "ON_OR_ABOVE_PLAN"
      ? { color: "#15803D", background: "#DCFCE7" }
      : pace === "BELOW_PLAN"
        ? { color: "#B91C1C", background: "#FEE2E2" }
        : { color: "#475569", background: "#E2E8F0" };
  return (
    <Chip
      size="small"
      label={pace.replaceAll("_", " ")}
      sx={{
        height: 23,
        color: tone.color,
        bgcolor: tone.background,
        fontSize: 9,
        fontWeight: 900,
      }}
    />
  );
}

function ReportCalendar({
  month,
  data,
  selectedDate,
  reportType,
  loading,
  onMonthChange,
  onSelectDate,
}: {
  month: string;
  data: ReportCalendarData | null;
  selectedDate: string;
  reportType: ProgressReportType;
  loading: boolean;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
}) {
  const { year, month: monthNumber } = dateParts(`${month}-01`);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const activity = new Map(
    (data?.dates || []).map((entry) => [entry.date, entry]),
  );
  const selectedWeek =
    selectedDate && reportType === "WEEKLY"
      ? mondayToSunday(selectedDate)
      : null;
  const cells: Array<{ date: string; day: number } | null> = [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      date: `${year}-${String(monthNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
      day: index + 1,
    })),
  ];
  while (cells.length % 7) cells.push(null);

  const shiftMonth = (step: number) => {
    const date = new Date(Date.UTC(year, monthNumber - 1 + step, 1));
    onMonthChange(
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: "hidden", borderColor: "#DCE5F1" }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, bgcolor: "#F8FAFC" }}
      >
        <IconButton onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronLeftRoundedIcon />
        </IconButton>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontWeight: 900, color: "#0B326B" }}>
            {monthLabel(month)}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 11 }}>
            Select a {reportType === "DAILY" ? "day" : "reporting week"}
          </Typography>
        </Box>
        <IconButton onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronRightRoundedIcon />
        </IconButton>
      </Stack>
      <Box sx={{ position: "relative" }}>
        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              bgcolor: "rgba(255,255,255,.72)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            borderTop: "1px solid #E2E8F0",
          }}
        >
          {weekdayLabels.map((label) => (
            <Box
              key={label}
              sx={{
                py: 1,
                textAlign: "center",
                fontSize: 10,
                fontWeight: 900,
                color: "#64748B",
                borderRight: "1px solid #E2E8F0",
              }}
            >
              {label}
            </Box>
          ))}
          {cells.map((cell, index) => {
            if (!cell) {
              return (
                <Box
                  key={`empty-${index}`}
                  sx={{
                    minHeight: 78,
                    bgcolor: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    borderRight: "1px solid #E2E8F0",
                  }}
                />
              );
            }
            const details = activity.get(cell.date);
            const future = cell.date > manilaToday();
            const beforeStart = Boolean(
              data?.project.startDate &&
                cell.date < data.project.startDate.slice(0, 10),
            );
            const disabled = future || beforeStart;
            const selected =
              reportType === "DAILY"
                ? selectedDate === cell.date
                : Boolean(
                    selectedWeek &&
                      cell.date >= selectedWeek.dateFrom &&
                      cell.date <= selectedWeek.dateTo,
                  );
            return (
              <Box
                component="button"
                type="button"
                key={cell.date}
                disabled={disabled}
                onClick={() => onSelectDate(cell.date)}
                aria-label={`Select ${cell.date}`}
                sx={{
                  minHeight: 78,
                  p: 0.75,
                  border: 0,
                  borderTop: "1px solid #E2E8F0",
                  borderRight: "1px solid #E2E8F0",
                  textAlign: "left",
                  font: "inherit",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.35 : 1,
                  bgcolor: selected ? "#E8F1FF" : "#FFF",
                  boxShadow: selected ? "inset 0 0 0 2px #0B74D1" : "none",
                  "&:hover": disabled ? {} : { bgcolor: "#F0F7FF" },
                  "&:focus-visible": {
                    outline: "2px solid #0B74D1",
                    outlineOffset: -2,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: selected ? 900 : 700,
                    color: selected ? "#0B4F9C" : "#334155",
                  }}
                >
                  {cell.day}
                </Typography>
                {details && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 0.75 }}
                  >
                    {details.progressUpdates > 0 && (
                      <Tooltip title={`${details.progressUpdates} progress updates`}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            bgcolor: "#2563EB",
                          }}
                        />
                      </Tooltip>
                    )}
                    {details.photos > 0 && (
                      <Tooltip title={`${details.photos} photos`}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            bgcolor: "#16A34A",
                          }}
                        />
                      </Tooltip>
                    )}
                    {details.incidents > 0 && (
                      <Tooltip title={`${details.incidents} incidents`}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            bgcolor: "#DC2626",
                          }}
                        />
                      </Tooltip>
                    )}
                    {details.reportGenerated && (
                      <Tooltip title="Legacy report activity">
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            bgcolor: "#7C3AED",
                          }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ px: 2, py: 1.25, borderTop: "1px solid #E2E8F0" }}
      >
        {[
          ["#2563EB", "Progress"],
          ["#16A34A", "Photos"],
          ["#DC2626", "Incidents"],
          ["#7C3AED", "Report activity"],
        ].map(([color, label]) => (
          <Stack key={label} direction="row" spacing={0.6} alignItems="center">
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color }} />
            <Typography sx={{ color: "#64748B", fontSize: 10 }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function SummaryCard({
  label,
  value,
  color = "#0B326B",
  caption,
}: {
  label: string;
  value: string;
  color?: string;
  caption?: string;
}) {
  return (
    <Box
      sx={{
        px: { xs: 1, md: 1.4 },
        py: 1,
        minHeight: 62,
      }}
    >
      <Typography sx={{ color: "#64748B", fontSize: 8.5, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ color, fontSize: { xs: 18, md: 20 }, fontWeight: 600, mt: 0.25 }}>
        {value}
      </Typography>
      {caption && (
        <Typography sx={{ color: "#94A3B8", fontSize: 8, mt: 0.15 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      square
      sx={{ overflow: "hidden", bgcolor: "#FFF" }}
    >
      <Typography
        sx={{
          pb: 1.25,
          borderBottom: "1px solid #E2E8F0",
          color: "#0B326B",
          fontWeight: 600,
          fontSize: 12.5,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ pt: 1.5 }}>{children}</Box>
    </Paper>
  );
}

function ReportPreview({
  preview,
  generatedBy,
}: {
  preview: ProjectReportPreview;
  generatedBy: string;
}) {
  const summary = preview.summary;
  const varianceColor =
    summary.variance < 0 ? "#DC2626" : summary.variance > 0 ? "#15803D" : "#0B326B";
  const subtaskHealthCounts = preview.detailedProgress
    .flatMap((scope) => scope.tasks)
    .flatMap((task) => task.subtasks)
    .reduce<Record<ReportHealth, number>>(
      (counts, subtask) => {
        counts[subtask.metrics.health] += 1;
        return counts;
      },
      { HEALTHY: 0, AT_RISK: 0, DELAYED: 0, UNCLASSIFIED: 0 },
    );
  const healthDistribution = [
    {
      key: "HEALTHY" as const,
      label: "Healthy",
      value: subtaskHealthCounts.HEALTHY,
      color: "#16A34A",
    },
    {
      key: "AT_RISK" as const,
      label: "At Risk",
      value: subtaskHealthCounts.AT_RISK,
      color: "#F59E0B",
    },
    {
      key: "DELAYED" as const,
      label: "Delayed",
      value: subtaskHealthCounts.DELAYED,
      color: "#DC2626",
    },
    {
      key: "UNCLASSIFIED" as const,
      label: "Unclassified",
      value: subtaskHealthCounts.UNCLASSIFIED,
      color: "#94A3B8",
    },
  ];
  const totalHealthItems = healthDistribution.reduce(
    (total, item) => total + item.value,
    0,
  );

  return (
    <Paper
      variant="outlined"
      square
      sx={{
        p: { xs: 1.5, md: 2.5 },
        borderColor: "#CBD5E1",
        bgcolor: "#FFF",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "220px minmax(0,1fr) 250px" },
          alignItems: "center",
          gap: 2,
          pb: 2,
          borderBottom: "3px solid #0B74D1",
        }}
      >
        <Stack spacing={0.35} alignItems="flex-start">
          <Box
            component="img"
            src="/images/GVI_LOGO_DARK.png"
            alt="Global Visions Holdings Inc."
            sx={{
              width: 145,
              height: "auto",
              objectFit: "contain",
            }}
          />
          <Typography
            sx={{
              width: 145,
              color: "#07346F",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 3.2,
              textAlign: "center",
            }}
          >
            V.I.S.I.O.N
          </Typography>
          <Typography
            sx={{
              width: 145,
              mt: -0.35,
              color: "#475569",
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: 0.8,
              textAlign: "center",
            }}
          >
            PROJECT MANAGEMENT TOOLS
          </Typography>
        </Stack>
        <Box sx={{ textAlign: { xs: "left", md: "center" } }}>
          <Typography sx={{ color: "#07346F", fontWeight: 700, fontSize: { xs: 20, md: 24 } }}>
            PROJECT PROGRESS REPORT
          </Typography>
          <Typography sx={{ color: "#0B74D1", fontWeight: 600, fontSize: { xs: 14, md: 17 } }}>
            {preview.project.name.toUpperCase()}
          </Typography>
          <Typography sx={{ color: "#0B326B", fontSize: 12, mt: 0.3 }}>
            {preview.project.location?.address || "Location not specified"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
          <Typography sx={{ color: "#64748B", fontSize: 9, fontWeight: 600 }}>
            GENERATED BY
          </Typography>
          <Typography sx={{ color: "#0B326B", fontWeight: 600, fontSize: 11 }}>
            {generatedBy}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 9, fontWeight: 600 }}>
            REPORT TYPE
          </Typography>
          <Typography sx={{ color: "#0B326B", fontWeight: 600, fontSize: 11 }}>
            {preview.report.type} REPORT
          </Typography>
          <Typography sx={{ display: preview.report.type === "DAILY" ? "block" : "none", color: "#64748B", fontSize: 9, fontWeight: 600 }}>
            REPORT DATE
          </Typography>
          <Typography sx={{ display: preview.report.type === "DAILY" ? "block" : "none", color: "#0B326B", fontWeight: 600, fontSize: 11 }}>
            {displayDate(preview.report.periodEnd)}
          </Typography>
          <Typography sx={{ display: preview.report.type === "WEEKLY" ? "block" : "none", mt: 0.75, color: "#64748B", fontSize: 9, fontWeight: 600 }}>
            REPORTING PERIOD
          </Typography>
          <Typography sx={{ display: preview.report.type === "WEEKLY" ? "block" : "none", color: "#0B326B", fontWeight: 600, fontSize: 11 }}>
            {preview.report.type === "DAILY"
              ? displayDate(preview.report.periodStart)
              : `${displayDate(preview.report.periodStart, { short: true })} – ${displayDate(preview.report.periodEnd, { short: true })}`}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 1.75,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1}
          sx={{ mb: 0.75 }}
        >
          <Box>
            <Typography sx={{ color: "#0B326B", fontSize: 11, fontWeight: 600, letterSpacing: 0.4 }}>
              PROJECT SUMMARY
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(5, 1fr)",
            },
            borderTop: "1px solid #CBD5E1",
            borderBottom: "1px solid #CBD5E1",
            "& > *:not(:last-child)": {
              borderRight: "1px solid #E2E8F0",
            },
          }}
        >
          <SummaryCard
            label="EXPECTED PROGRESS"
            value={percent(summary.expectedProgress)}
            color="#2563EB"
            caption="Expected by period end"
          />
          <SummaryCard
            label="PROGRESS DELIVERED"
            value={percent(summary.periodProgress)}
            color="#16A34A"
            caption={
              preview.report.type === "DAILY"
                ? "Progress delivered this day"
                : "Progress delivered this week"
            }
          />
          <SummaryCard
            label="TOTAL PROGRESS"
            value={percent(summary.totalProjectProgress)}
            color="#0B326B"
            caption={`As of ${displayDate(preview.report.periodEnd, { short: true })}`}
          />
          <SummaryCard
            label="VARIANCE"
            value={percent(summary.variance)}
            color={varianceColor}
            caption="Actual minus planned"
          />
          <Box
            sx={{
              px: { xs: 1, md: 1.4 },
              py: 1,
              minHeight: 62,
              textAlign: "center",
            }}
          >
            <Typography sx={{ color: "#64748B", fontSize: 8.5, fontWeight: 700 }}>
              PROJECT STATUS
            </Typography>
            <Box sx={{ mt: 1 }}>
              <HealthChip health={summary.health} />
            </Box>
            <Typography sx={{ color: "#64748B", fontSize: 10, mt: 0.8 }}>
              {summary.health === "HEALTHY"
                ? "On track"
                : summary.health === "DELAYED"
                  ? "Behind schedule"
                  : summary.health === "AT_RISK"
                    ? "Monitor closely"
                    : "Not classified"}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.7fr) minmax(260px, .75fr)" },
          gap: 2,
          mt: 3,
        }}
      >
        <Section title="S-CURVE (PLANNED vs ACTUAL)">
          {preview.sCurve.length ? (
            <Box sx={{ width: "100%", height: { xs: 250, md: 310 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={preview.sCurve}
                  margin={{ top: 10, right: 20, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => displayDate(value, { short: true }).replace(/, \d{4}/, "")}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    labelFormatter={(value) => displayDate(String(value))}
                    formatter={(value) => percent(Number(value))}
                  />
                  <Legend />
                  {preview.report.type === "DAILY" ? (
                    <ReferenceLine
                      x={preview.report.periodEnd}
                      stroke="#DC2626"
                      strokeWidth={2}
                      label={{
                        value: "Report Date",
                        position: "insideTopRight",
                        fill: "#DC2626",
                        fontSize: 9,
                      }}
                    />
                  ) : (
                    <>
                      <ReferenceLine
                        x={preview.report.periodStart}
                        stroke="#DC2626"
                        strokeWidth={2}
                        label={{
                          value: "Week Start",
                          position: "insideTopRight",
                          fill: "#DC2626",
                          fontSize: 9,
                        }}
                      />
                      <ReferenceLine
                        x={preview.report.periodEnd}
                        stroke="#DC2626"
                        strokeWidth={2}
                        label={{
                          value: "Week End",
                          position: "insideTopLeft",
                          fill: "#DC2626",
                          fontSize: 9,
                        }}
                      />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="planned"
                    name="Planned Progress"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Progress"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Alert severity="info">S-curve data is not available for this period.</Alert>
          )}
        </Section>
        <Section title="WORK HEALTH DISTRIBUTION">
          {totalHealthItems ? (
            <Stack spacing={1}>
              <Box sx={{ position: "relative", width: "100%", height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {healthDistribution.map((item) => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value) => Number(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeContent: "center",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Typography sx={{ color: "#0B326B", fontSize: 22, fontWeight: 650 }}>
                    {totalHealthItems}
                  </Typography>
                  <Typography sx={{ color: "#64748B", fontSize: 9, fontWeight: 700 }}>
                    SUBTASKS
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.8}>
                {healthDistribution.map((item) => (
                  <Box
                    key={item.key}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "86px minmax(50px,1fr) 58px",
                      gap: 0.8,
                      alignItems: "center",
                    }}
                  >
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          bgcolor: item.color,
                        }}
                      />
                      <Typography sx={{ color: "#475569", fontSize: 9.5 }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 7,
                        borderRadius: 10,
                        bgcolor: "#E9EDF3",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(item.value / totalHealthItems) * 100}%`,
                          height: "100%",
                          bgcolor: item.color,
                          borderRadius: 10,
                        }}
                      />
                    </Box>
                    <Typography sx={{ color: "#0B326B", fontSize: 9.5, fontWeight: 600, textAlign: "right" }}>
                      {item.value}{" "}
                      <Box component="span" sx={{ color: "#64748B", fontSize: 8.5 }}>
                        {((item.value / totalHealthItems) * 100).toFixed(0)}%
                      </Box>
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Alert severity="info">No subtask health data is available.</Alert>
          )}
        </Section>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: ".8fr 1.2fr" },
          gap: 2,
          mt: 2,
        }}
      >
        <Section title="INCIDENT REPORT">
          {!preview.incidents.length ? (
            <Alert severity="success">
              No incidents were reported during this reporting period.
            </Alert>
          ) : (
            <Stack spacing={1}>
              {preview.incidents.map((incident) => (
                <Box
                  key={incident.id}
                  sx={{ p: 1.25, border: "1px solid #FECACA" }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: 12 }}>
                      {incident.incidentNumber} · {incident.title}
                    </Typography>
                    <Chip
                      size="small"
                      color={incident.severity === "CRITICAL" ? "error" : "warning"}
                      label={incident.severity}
                      sx={{ height: 20, fontSize: 9, fontWeight: 900 }}
                    />
                  </Stack>
                  <Typography sx={{ color: "#64748B", fontSize: 11, mt: 0.5 }}>
                    {incident.description}
                  </Typography>
                  <Typography sx={{ color: "#94A3B8", fontSize: 10, mt: 0.75 }}>
                    Raised {displayDate(incident.dateRaised)} · {incident.status}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Section>

        <Section title="PROGRESS PHOTOS">
          {!preview.photos.length ? (
            <Alert severity="info">No progress photos were uploaded during this period.</Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: `repeat(${Math.min(preview.photos.length, 3)}, 1fr)`,
                },
                gap: 1,
              }}
            >
              {preview.photos.slice(0, 3).map((photo) => (
                <Box key={`${photo.progressLogId}-${photo.url}`}>
                  <Box
                    component="img"
                    src={photo.url}
                    alt={photo.caption || photo.name || "Project progress"}
                    sx={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: 0,
                      bgcolor: "#E2E8F0",
                    }}
                  />
                  <Typography sx={{ fontWeight: 500, fontSize: 11, mt: 0.5 }}>
                    {photo.caption || photo.subtask?.title || photo.name || "Progress update"}
                  </Typography>
                  <Typography sx={{ color: "#64748B", fontSize: 10 }}>
                    {displayDate(photo.date, { short: true })}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Section>
      </Box>

      <Accordion
        defaultExpanded
        disableGutters
        elevation={0}
        sx={{
          mt: 2,
          border: "1px solid #DCE5F1",
          borderRadius: "0 !important",
          overflow: "hidden",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{ bgcolor: "#F8FAFC", px: 2 }}
        >
          <Box>
            <Typography sx={{ color: "#0B326B", fontSize: 12, fontWeight: 600 }}>
              PROGRESS LOGS ({preview.report.type === "DAILY" ? "This Day" : "This Week"})
            </Typography>
            <Typography sx={{ color: "#64748B", fontSize: 10 }}>
              Progress entries submitted during the reporting period
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2 }}>
          {preview.progressAudit ? (
            <Stack spacing={1}>
              {preview.progressAudit.entries.length ? (
                <TableContainer>
                  <Table
                    size="small"
                    sx={{
                      minWidth: 1250,
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        {[
                          "Date / Given By",
                          "Subtask",
                          "Progress Given",
                          "Previous",
                          "Cumulative",
                          "Expected",
                          "Variance",
                          "Status",
                          "Health",
                          "Pace",
                          "Remarks",
                        ].map((heading) => (
                          <TableCell
                            key={heading}
                            align={
                              ["Progress Given", "Previous", "Cumulative", "Expected", "Variance"].includes(
                                heading,
                              )
                                ? "right"
                                : "left"
                            }
                            sx={{
                              bgcolor: "#EFF6FF",
                              color: "#0B326B",
                              fontSize: 10,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {heading}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.progressAudit.entries.map((entry) => (
                        <TableRow key={entry.progressLogId} hover>
                          <TableCell sx={{ minWidth: 145 }}>
                            <Typography sx={{ fontSize: 10.5, fontWeight: 500 }}>
                              {displayDate(entry.date, { short: true })}
                            </Typography>
                            <Typography sx={{ color: "#475569", fontSize: 10 }}>
                              {entry.submittedBy.name}
                            </Typography>
                            <Typography sx={{ color: "#94A3B8", fontSize: 9 }}>
                              Submitted{" "}
                              {new Date(entry.submittedAt).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                timeZone: MANILA_TIME_ZONE,
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 210 }}>
                            <Typography sx={{ color: "#0B326B", fontSize: 10, fontWeight: 500 }}>
                              {entry.scope.name}
                            </Typography>
                            <Typography sx={{ color: "#475569", fontSize: 10 }}>
                              {entry.task.title}
                            </Typography>
                            <Typography sx={{ fontSize: 10.5, fontWeight: 500 }}>
                              {entry.subtask.title}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 10.5, fontWeight: 600, color: "#7C3AED" }}>
                            {percent(entry.dailyProgress)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 10.5 }}>
                            {percent(entry.previousProgress)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 10.5, fontWeight: 600 }}>
                            {percent(entry.progressAfter)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 10.5 }}>
                            {percent(entry.expectedProgressAfter)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: entry.varianceAfter < 0 ? "#DC2626" : "#15803D",
                            }}
                          >
                            {percent(entry.varianceAfter)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={entry.subtaskStatusAfter}
                              sx={{ height: 22, fontSize: 9, fontWeight: 900 }}
                            />
                          </TableCell>
                          <TableCell>
                            <HealthChip health={entry.healthAfter} />
                          </TableCell>
                          <TableCell>
                            <PaceChip pace={entry.paceStatus} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 210 }}>
                            <Typography sx={{ fontSize: 10 }}>
                              {entry.remarks || "No remarks provided"}
                            </Typography>
                            <Typography sx={{ color: "#64748B", fontSize: 9, mt: 0.5 }}>
                              {entry.location || "No location"}
                              {entry.coordinates
                                ? ` · ${entry.coordinates.latitude.toFixed(5)}, ${entry.coordinates.longitude.toFixed(5)}`
                                : ""}
                              {` · ${entry.photoCount} photo${entry.photoCount === 1 ? "" : "s"}`}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No progress submissions were recorded during this reporting period.
                </Alert>
              )}
            </Stack>
          ) : (
            <Alert severity="info">
              Progress audit data is not available for this report.
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion
        defaultExpanded
        disableGutters
        elevation={0}
        sx={{
          mt: 1.5,
          border: "1px solid #DCE5F1",
          borderRadius: "0 !important",
          overflow: "hidden",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{ bgcolor: "#F8FAFC", px: 2 }}
        >
          <Box>
            <Typography sx={{ color: "#0B326B", fontSize: 12, fontWeight: 600 }}>
              DETAILED PROGRESS BY SCOPE, TASK & SUBTASK
            </Typography>
            <Typography sx={{ color: "#64748B", fontSize: 10 }}>
              Actual, expected, variance and health by work item
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2 }}>
          {preview.detailedProgress.length ? (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Task", "Subtask", "Actual", "Expected", "Variance", "Period", "Health"].map(
                      (heading) => (
                        <TableCell
                          key={heading}
                          align={["Actual", "Expected", "Variance", "Period"].includes(heading) ? "right" : "left"}
                          sx={{
                            bgcolor: "#EFF6FF",
                            color: "#0B326B",
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {heading}
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.detailedProgress.map((scope) => (
                    <Fragment key={scope.id}>
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{
                            py: 0.9,
                            px: 1.5,
                            bgcolor: "#EAF2FC",
                            borderTop: "2px solid #AFC8E8",
                            borderBottom: "1px solid #C8D9ED",
                          }}
                        >
                          <Typography sx={{ color: "#0B326B", fontSize: 11, fontWeight: 600 }}>
                            {scope.name}
                          </Typography>
                          {scope.description && (
                            <Typography sx={{ color: "#64748B", fontSize: 9 }}>
                              {scope.description}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      {scope.tasks.flatMap((task) =>
                        task.subtasks.map((subtask, index) => (
                          <TableRow key={`${scope.id}-${task.id}-${subtask.id}`} hover>
                            <TableCell sx={{ pl: 1.5, fontSize: 10.5, fontWeight: 500 }}>
                              {index === 0 ? task.title : ""}
                            </TableCell>
                            <TableCell sx={{ fontSize: 10.5 }}>{subtask.title}</TableCell>
                            <TableCell align="right" sx={{ fontSize: 10.5 }}>
                              {percent(subtask.metrics.actualProgress)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: 10.5 }}>
                              {percent(subtask.metrics.expectedProgress)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color:
                                  subtask.metrics.variance < 0 ? "#DC2626" : "#15803D",
                              }}
                            >
                              {percent(subtask.metrics.variance)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: 10.5 }}>
                              {percent(subtask.metrics.periodProgress)}
                            </TableCell>
                            <TableCell>
                              <HealthChip health={subtask.metrics.health} />
                            </TableCell>
                          </TableRow>
                        )),
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No detailed project progress is available.</Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mt: 2, p: 1.5, bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}
      >
        <Box>
          <Typography sx={{ color: "#0B326B", fontSize: 11, fontWeight: 600 }}>
            CALCULATION NOTES
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 10, mt: 0.25 }}>
            Variance is actual progress minus expected progress. Health follows the
            configured project thresholds.
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
          <Typography sx={{ color: "#64748B", fontSize: 10 }}>Prepared by</Typography>
          <Typography sx={{ color: "#0B326B", fontWeight: 600, fontSize: 12 }}>
            {preview.project.owner?.name || "Project Owner"}
          </Typography>
        </Box>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1}
        sx={{
          mt: 2,
          mx: { xs: -1.5, md: -2.5 },
          mb: { xs: -1.5, md: -2.5 },
          px: 2.5,
          py: 1.4,
          bgcolor: "#07346F",
          color: "#FFF !important",
        }}
      >
        <Typography sx={{ color: "#FFF !important", fontSize: 10, fontWeight: 600 }}>
          V.I.S.I.O.N PROJECT MANAGEMENT TOOLS
        </Typography>
        <Typography sx={{ color: "#E0ECFF !important", fontSize: 10, fontWeight: 600 }}>
          {preview.project.pin || preview.project.name} · {preview.report.type} REPORT
        </Typography>
        <Typography sx={{ color: "#E0ECFF !important", fontSize: 10 }}>
          Report Preview
        </Typography>
      </Stack>
    </Paper>
  );
}

export function ReportsContent({
  lockedProjectId,
  embedded = false,
}: {
  lockedProjectId?: string;
  embedded?: boolean;
} = {}) {
  const searchParams = useSearchParams();
  const currentUser = useAppSelector((state) => state.auth.user);
  const requestedProjectId = lockedProjectId || searchParams.get("projectId") || "";
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState(requestedProjectId);
  const [reportType, setReportType] = useState<ProgressReportType>("DAILY");
  const [month, setMonth] = useState(manilaToday().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState("");
  const [calendar, setCalendar] = useState<ReportCalendarData | null>(null);
  const [preview, setPreview] = useState<ProjectReportPreview | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [error, setError] = useState("");
  const reportResultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lockedProjectId) {
      setProjectId(lockedProjectId);
      setProjectsLoading(false);
      return;
    }
    let active = true;
    getActiveProjectDropdown()
      .then((rows: Array<Record<string, unknown>>) => {
        if (!active) return;
        const options = (Array.isArray(rows) ? rows : [])
          .map((row) => ({
            id: String(row.id || row.value || ""),
            name: String(row.name || row.label || "Untitled Project"),
          }))
          .filter((row) => row.id);
        setProjects(options);
        setProjectId((current) => current || options[0]?.id || "");
      })
      .catch((requestError) => {
        if (active) {
          setError(errorMessage(requestError, "Unable to load active projects."));
        }
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lockedProjectId]);

  const loadCalendar = useCallback(async () => {
    if (!projectId) {
      setCalendar(null);
      return;
    }
    setCalendarLoading(true);
    setError("");
    try {
      const result = await getReportCalendar(projectId, month);
      setCalendar(result);
    } catch (requestError) {
      setCalendar(null);
      setError(errorMessage(requestError, "Unable to load report calendar."));
    } finally {
      setCalendarLoading(false);
    }
  }, [month, projectId]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    setSelectedDate("");
    setPreview(null);
  }, [projectId, reportType]);

  const selectedPeriod = useMemo(() => {
    if (!selectedDate) return "";
    if (reportType === "DAILY") return displayDate(selectedDate);
    const range = mondayToSunday(selectedDate);
    return `${displayDate(range.dateFrom, { short: true })} – ${displayDate(range.dateTo, { short: true })}`;
  }, [reportType, selectedDate]);

  const handleGenerate = async (date = selectedDate) => {
    if (!projectId || !date) return;
    setPreviewLoading(true);
    setPreview(null);
    setError("");
    try {
      const result = await getProjectReportPreview(
        projectId,
        reportParams(reportType, date),
      );
      setPreview(result);
      window.setTimeout(() => {
        reportResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to generate report preview."));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!preview || !selectedDate) return;
    setDownloading(true);
    setError("");
    try {
      const response = await downloadProjectReportPdf(
        projectId,
        reportParams(reportType, selectedDate),
        "download",
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${preview.project.pin || "VISION"}-${reportType.toLowerCase()}-report-${preview.report.periodStart}${reportType === "WEEKLY" ? `-to-${preview.report.periodEnd}` : ""}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      const message = errorMessage(requestError, "PDF generation is not available yet.");
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePdfView = async () => {
    if (!preview || !selectedDate) return;
    const previewWindow = window.open("", "_blank");
    setViewingPdf(true);
    setError("");
    try {
      const response = await downloadProjectReportPdf(
        projectId,
        reportParams(reportType, selectedDate),
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (requestError) {
      previewWindow?.close();
      setError(errorMessage(requestError, "Unable to open the report PDF."));
    } finally {
      setViewingPdf(false);
    }
  };

  const selectedUnknown =
    projectId && !projects.some((project) => project.id === projectId);

  const reportContent = (
      <Box sx={{ minHeight: "100%", bgcolor: embedded ? "transparent" : "#F4F7FB", p: { xs: 1.5, md: embedded ? 2 : 3 } }}>
        <Box sx={{ maxWidth: 1500, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <AssessmentOutlinedIcon sx={{ color: "#0B74D1", fontSize: 30 }} />
                <Typography sx={{ color: "#0F2851", fontSize: 25, fontWeight: 950 }}>
                  Project Reports
                </Typography>
              </Stack>
              <Typography sx={{ color: "#64748B", fontSize: 13, mt: 0.4 }}>
                {lockedProjectId
                  ? "Choose a date to view this project's daily or weekly progress report."
                  : "Choose a project and date to view its daily or weekly progress report."}
              </Typography>
            </Box>
            {PDF_ENDPOINT_AVAILABLE && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={
                    viewingPdf ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <VisibilityOutlinedIcon />
                    )
                  }
                  onClick={handlePdfView}
                  disabled={!preview || viewingPdf || downloading}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {viewingPdf ? "Opening PDF…" : "View PDF"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    downloading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PictureAsPdfOutlinedIcon />
                    )
                  }
                  onClick={handlePdfDownload}
                  disabled={!preview || downloading || viewingPdf}
                  sx={{ bgcolor: "#07346F", textTransform: "none", fontWeight: 600 }}
                >
                  {downloading ? "Downloading PDF…" : "Download PDF"}
                </Button>
              </Stack>
            )}
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "390px minmax(0,1fr)" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 3, borderColor: "#DCE5F1" }}
              >
                <Stack spacing={2}>
                  {!lockedProjectId && <FormControl fullWidth size="small">
                    <InputLabel id="report-project-label">Project</InputLabel>
                    <Select
                      labelId="report-project-label"
                      value={projectId}
                      label="Project"
                      disabled={projectsLoading}
                      onChange={(event) => setProjectId(event.target.value)}
                    >
                      {selectedUnknown && (
                        <MenuItem value={projectId}>Selected project</MenuItem>
                      )}
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>}
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={reportType}
                    onChange={(_, value: ProgressReportType | null) => {
                      if (value) setReportType(value);
                    }}
                    size="small"
                  >
                    <ToggleButton value="DAILY" sx={{ fontWeight: 900 }}>
                      Daily
                    </ToggleButton>
                    <ToggleButton value="WEEKLY" sx={{ fontWeight: 900 }}>
                      Weekly
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Divider />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonthOutlinedIcon sx={{ color: "#0B74D1" }} />
                    <Box>
                      <Typography sx={{ color: "#64748B", fontSize: 10, fontWeight: 800 }}>
                        SELECTED PERIOD
                      </Typography>
                      <Typography sx={{ color: "#0B326B", fontSize: 12, fontWeight: 900 }}>
                        {selectedPeriod || "Choose a date from the calendar"}
                      </Typography>
                    </Box>
                  </Stack>
                  {previewLoading ? (
                    <Alert icon={<CircularProgress size={18} />} severity="info">
                      Generating the {reportType.toLowerCase()} report…
                    </Alert>
                  ) : preview ? (
                    <Alert
                      icon={<CheckCircleRoundedIcon />}
                      severity="success"
                      action={
                        <Button
                          size="small"
                          onClick={() => handleGenerate()}
                          sx={{ fontWeight: 900 }}
                        >
                          Refresh
                        </Button>
                      }
                    >
                      Report ready for {selectedPeriod}.
                    </Alert>
                  ) : (
                    <Alert severity="info">
                      Click a calendar date to generate the report automatically.
                    </Alert>
                  )}
                </Stack>
              </Paper>

              <ReportCalendar
                month={month}
                data={calendar}
                selectedDate={selectedDate}
                reportType={reportType}
                loading={calendarLoading}
                onMonthChange={(nextMonth) => {
                  setMonth(nextMonth);
                  setSelectedDate("");
                  setPreview(null);
                }}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setPreview(null);
                  void handleGenerate(date);
                }}
              />

            </Stack>

            <Box ref={reportResultRef} sx={{ minWidth: 0, scrollMarginTop: 24 }}>
              {previewLoading ? (
                <Paper
                  variant="outlined"
                  sx={{ minHeight: 520, display: "grid", placeItems: "center", borderRadius: 3 }}
                >
                  <Stack alignItems="center" spacing={1.5}>
                    <CircularProgress />
                    <Typography sx={{ color: "#64748B", fontSize: 13 }}>
                      Reconstructing historical project data…
                    </Typography>
                  </Stack>
                </Paper>
              ) : preview ? (
                <ReportPreview
                  preview={preview}
                  generatedBy={currentUser?.name || "V.I.S.I.O.N User"}
                />
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    minHeight: 520,
                    p: 3,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    borderRadius: 3,
                    borderStyle: "dashed",
                    borderColor: "#B8C7DA",
                    bgcolor: "#FBFDFF",
                  }}
                >
                  <Box>
                    <AssessmentOutlinedIcon sx={{ color: "#A6B8CC", fontSize: 65 }} />
                    <Typography sx={{ color: "#0B326B", fontWeight: 900, fontSize: 18, mt: 1 }}>
                      Your report preview will appear here
                    </Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 12, maxWidth: 440, mt: 0.7 }}>
                      {lockedProjectId
                        ? "Choose Daily or Weekly, then pick a reporting period from the calendar."
                        : "Select a project, choose Daily or Weekly, and pick a reporting period from the calendar."}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
  );
  return embedded ? reportContent : <Layout>{reportContent}</Layout>;
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <Box sx={{ minHeight: 500, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        </Layout>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}

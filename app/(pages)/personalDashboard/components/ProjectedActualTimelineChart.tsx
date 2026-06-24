"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DashboardReportTable } from "@/app/api-service/personalDashboardService";

type TimelineValue = {
  value: number | null;
  formattedValue?: string | null;
};

type ProgressLog = {
  date?: string | null;
  dailyPercent?: number | null;
  cumulativePercent?: number | null;
};

type ProjectTreeSubtask = {
  id: string;
  title?: string | null;
  progress?: number | null;
  budgetAllocated?: number | null;
  budgetPercent?: number | null;
  projectedStartDate?: string | null;
  projectedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  progressLogs?: ProgressLog[];
};

type ProjectTreeTask = {
  id: string;
  title?: string | null;
  name?: string | null;
  progress?: number | null;
  budgetAllocated?: number | null;
  budgetPercent?: number | null;
  subtasks?: ProjectTreeSubtask[];
};

type ProjectTreeScope = {
  id: string;
  name?: string | null;
  title?: string | null;
  progress?: number | null;
  budgetAllocated?: number | null;
  budgetPercent?: number | null;
  tasks?: ProjectTreeTask[];
};

type ProjectTree = {
  id?: string;
  name?: string | null;
  totalBudget?: number | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  scopes?: ProjectTreeScope[];
};

type ProjectTreeResponse = ProjectTree | { data?: ProjectTree | null } | { success?: boolean; data?: ProjectTree | null };

type GanttRow =
  | {
      type: "project" | "scope" | "task";
      key: string;
      itemNo: string;
      title: string;
      progress: number;
      amount: number;
      budgetPercent: number;
    }
  | {
      type: "subtask";
      key: string;
      itemNo: string;
      title: string;
      progress: number;
      amount: number;
      budgetPercent: number;
      projectedStartDate?: string | null;
      projectedEndDate?: string | null;
      actualStartDate?: string | null;
      actualEndDate?: string | null;
      progressLogs: ProgressLog[];
    };

type HeaderGroup = {
  key: string;
  label: string;
  colspan: number;
};

const darkHeader = "#3f3f3f";
const navy = "#172b55";
const gridBorder = "#d9d9d9";
const projectedColor = "#b9d8ef";
const actualColor = "#f5c6a7";

const leftHeaderCellSx = {
  bgcolor: darkHeader,
  color: "#fff",
  border: `1px solid ${gridBorder}`,
  fontSize: 9,
  fontWeight: 900,
  px: 0.75,
  py: 0.45,
  whiteSpace: "nowrap",
} as const;

const timelineCellSx = {
  minWidth: 30,
  width: 30,
  height: 22,
  border: `1px solid ${gridBorder}`,
  px: 0,
  py: 0,
  textAlign: "center",
  fontSize: 9,
  lineHeight: 1,
} as const;

const parseDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMonthKey = (date: string) => {
  const parsed = parseDate(date);
  return parsed ? `${parsed.getFullYear()}-${parsed.getMonth()}` : date;
};

const getMonthLabel = (date: string) => {
  const parsed = parseDate(date);
  return parsed ? parsed.toLocaleDateString("en-US", { month: "long" }).toUpperCase() : date;
};

const getDayName = (date: string) => {
  const parsed = parseDate(date);
  return parsed ? parsed.toLocaleDateString("en-US", { weekday: "short" }) : "";
};

const getDayNumber = (date: string) => {
  const parsed = parseDate(date);
  return parsed ? parsed.getDate() : "";
};

const getDisplayValue = (value?: TimelineValue) => {
  if (!value) return "";
  if (value.formattedValue) return value.formattedValue;
  return value.value !== null && value.value !== undefined ? `${value.value.toFixed(2)}%` : "";
};

const getDateLabel = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const buildMonthGroups = (reportTable: DashboardReportTable): HeaderGroup[] => {
  const groups: HeaderGroup[] = [];

  reportTable.columns.forEach((column) => {
    const key = getMonthKey(column.date);
    const current = groups[groups.length - 1];
    if (current?.key === key) {
      current.colspan += 1;
      return;
    }
    groups.push({ key, label: getMonthLabel(column.date), colspan: 1 });
  });

  return groups;
};

const toNumber = (value?: number | null) => Number(value ?? 0);

const normalizeDateKey = (date?: string | null) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const isDateInRange = (date: string, start?: string | null, end?: string | null) => {
  const dateKey = normalizeDateKey(date);
  const startKey = normalizeDateKey(start);
  const endKey = normalizeDateKey(end);
  if (!dateKey || !startKey || !endKey) return false;
  return dateKey >= startKey && dateKey <= endKey;
};

const countColumnsInRange = (
  columns: DashboardReportTable["columns"],
  start?: string | null,
  end?: string | null
) => columns.filter((column) => isDateInRange(column.date, start, end)).length;

const unwrapProject = (projectTree?: ProjectTreeResponse | null): ProjectTree | null => {
  if (!projectTree) return null;
  if ("data" in projectTree && projectTree.data) return projectTree.data;
  return projectTree as ProjectTree;
};

const buildGanttRows = (project: ProjectTree | null, reportTable: DashboardReportTable | null): GanttRow[] => {
  const projectName = project?.name ?? reportTable?.project?.name ?? "PROJECT TOTAL";
  const projectBudget = toNumber(project?.totalBudget ?? reportTable?.project?.totalBudget);
  const scopes = project?.scopes ?? [];
  const rows: GanttRow[] = [
    {
      type: "project",
      key: project?.id ?? reportTable?.project?.id ?? "project",
      itemNo: "",
      title: projectName,
      progress: 0,
      amount: projectBudget,
      budgetPercent: 100,
    },
  ];

  scopes.forEach((scope, scopeIndex) => {
    const scopeNumber = `${scopeIndex + 1}.0`;
    rows.push({
      type: "scope",
      key: `scope-${scope.id}`,
      itemNo: scopeNumber,
      title: scope.name ?? scope.title ?? `Scope ${scopeIndex + 1}`,
      progress: toNumber(scope.progress),
      amount: toNumber(scope.budgetAllocated),
      budgetPercent: toNumber(scope.budgetPercent),
    });

    (scope.tasks ?? []).forEach((task, taskIndex) => {
      const taskNumber = `${scopeIndex + 1}.${taskIndex + 1}`;
      rows.push({
        type: "task",
        key: `task-${task.id}`,
        itemNo: taskNumber,
        title: task.title ?? task.name ?? `Task ${taskIndex + 1}`,
        progress: toNumber(task.progress),
        amount: toNumber(task.budgetAllocated),
        budgetPercent: toNumber(task.budgetPercent),
      });

      (task.subtasks ?? []).forEach((subtask, subtaskIndex) => {
        rows.push({
          type: "subtask",
          key: `subtask-${subtask.id}`,
          itemNo: `${taskNumber}.${subtaskIndex + 1}`,
          title: subtask.title ?? `Subtask ${subtaskIndex + 1}`,
          progress: toNumber(subtask.progress),
          amount: toNumber(subtask.budgetAllocated),
          budgetPercent: toNumber(subtask.budgetPercent),
          projectedStartDate: subtask.projectedStartDate,
          projectedEndDate: subtask.projectedEndDate,
          actualStartDate: subtask.actualStartDate,
          actualEndDate: subtask.actualEndDate,
          progressLogs: subtask.progressLogs ?? [],
        });
      });
    });
  });

  return rows;
};

const getProjectedCell = (
  row: Extract<GanttRow, { type: "subtask" }>,
  date: string,
  columns: DashboardReportTable["columns"]
): TimelineValue | null => {
  if (!isDateInRange(date, row.projectedStartDate, row.projectedEndDate)) return null;
  const projectedDays = countColumnsInRange(columns, row.projectedStartDate, row.projectedEndDate);
  if (!projectedDays) return { value: null };
  return { value: row.budgetPercent / projectedDays };
};

const getActualCell = (
  row: Extract<GanttRow, { type: "subtask" }>,
  date: string,
  columns: DashboardReportTable["columns"]
): TimelineValue | null => {
  const dateKey = normalizeDateKey(date);
  const log = row.progressLogs.find((item) => normalizeDateKey(item.date) === dateKey);
  if (log) {
    return { value: toNumber(log.dailyPercent) * (row.budgetPercent / 100) };
  }

  if (!isDateInRange(date, row.actualStartDate, row.actualEndDate)) return null;
  const actualDays = countColumnsInRange(columns, row.actualStartDate, row.actualEndDate);
  if (!actualDays) return { value: null };
  return { value: (row.budgetPercent * (row.progress / 100)) / actualDays };
};

const hasActualData = (row: Extract<GanttRow, { type: "subtask" }>) =>
  row.progressLogs.length > 0 || Boolean(row.actualStartDate && row.actualEndDate);

export default function ProjectedActualTimelineChart({
  reportTable,
  projectTree,
  loading,
}: {
  reportTable: DashboardReportTable | null;
  projectTree?: ProjectTreeResponse | null;
  loading?: boolean;
}) {
  const [showProjected, setShowProjected] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showProjectedPercent, setShowProjectedPercent] = useState(false);
  const [showActualPercent, setShowActualPercent] = useState(false);

  const project = useMemo(() => unwrapProject(projectTree), [projectTree]);
  const activeProject =
    project?.id && reportTable?.project?.id && project.id !== reportTable.project.id ? null : project;
  const ganttRows = useMemo(() => buildGanttRows(activeProject, reportTable), [activeProject, reportTable]);
  const monthGroups = useMemo(
    () => (reportTable ? buildMonthGroups(reportTable) : []),
    [reportTable]
  );
  const startDate = activeProject?.startDate ?? reportTable?.project?.startDate ?? reportTable?.columns?.[0]?.date;
  const hasProjectTree = Boolean(activeProject?.scopes?.length);

  return (
    <Card sx={{ borderRadius: 2, border: "1px solid #dbeafe", boxShadow: "none", bgcolor: "#fff" }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", lg: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography fontWeight={900}>Projected vs Actual Timeline</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>
              START DATE: {getDateLabel(startDate)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
            <FormControlLabel
              control={<Checkbox size="small" checked={showProjected} onChange={(event) => setShowProjected(event.target.checked)} />}
              label="Projected"
              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 800 } }}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={showActual} onChange={(event) => setShowActual(event.target.checked)} />}
              label="Actual"
              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 800 } }}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={showProjectedPercent} onChange={(event) => setShowProjectedPercent(event.target.checked)} />}
              label="Projected %"
              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 800 } }}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={showActualPercent} onChange={(event) => setShowActualPercent(event.target.checked)} />}
              label="Actual %"
              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 800 } }}
            />
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !reportTable?.columns?.length ? (
          <Alert severity="info">Projected and actual timeline data is not available yet.</Alert>
        ) : !hasProjectTree ? (
          <Alert severity="info">Project scope, task, and subtask data is not available yet.</Alert>
        ) : (
          <TableContainer sx={{ border: `1px solid ${gridBorder}`, overflow: "auto", maxHeight: 560 }}>
            <Table
              size="small"
              stickyHeader
              sx={{
                minWidth: 740 + reportTable.columns.length * 30,
                borderCollapse: "collapse",
                "& .MuiTableCell-root": { fontFamily: "Arial, sans-serif" },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell colSpan={6} sx={{ ...leftHeaderCellSx, top: 0, zIndex: 6, bgcolor: "#fff", color: "#111827" }}>
                    START DATE : <Box component="span" sx={{ ml: 3, fontWeight: 900 }}>{getDateLabel(startDate)}</Box>
                  </TableCell>
                  {monthGroups.map((month) => (
                    <TableCell
                      key={month.key}
                      colSpan={month.colspan}
                      align="center"
                      sx={{ ...timelineCellSx, top: 0, zIndex: 5, bgcolor: "#fff", color: "#111827", fontWeight: 900 }}
                    >
                      {month.label}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ ...leftHeaderCellSx, top: 22, zIndex: 6, minWidth: 84 }}>ITEM NO.</TableCell>
                  <TableCell sx={{ ...leftHeaderCellSx, top: 22, zIndex: 6, minWidth: 300 }}>SCOPE OF WORK</TableCell>
                  <TableCell sx={{ ...leftHeaderCellSx, top: 22, zIndex: 6, minWidth: 90 }}>PROGRESS</TableCell>
                  <TableCell sx={{ ...leftHeaderCellSx, top: 22, zIndex: 6, minWidth: 110 }}>AMOUNT</TableCell>
                  <TableCell sx={{ ...leftHeaderCellSx, top: 22, zIndex: 6, minWidth: 58 }}>%W</TableCell>
                  <TableCell sx={{ ...leftHeaderCellSx, top: 22, zIndex: 6, minWidth: 92 }}>Column 1</TableCell>
                  {reportTable.weekGroups.map((week) => (
                    <TableCell
                      key={week.weekNumber}
                      colSpan={week.colspan}
                      align="center"
                      sx={{ ...timelineCellSx, top: 22, zIndex: 5, bgcolor: darkHeader, color: "#fff", fontWeight: 900 }}
                    >
                      {week.label}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ ...leftHeaderCellSx, top: 44, zIndex: 6, bgcolor: darkHeader }} />
                  {reportTable.columns.map((column) => (
                    <TableCell
                      key={`day-${column.index}`}
                      align="center"
                      sx={{ ...timelineCellSx, top: 44, zIndex: 5, bgcolor: darkHeader, color: "#fff", fontWeight: 700 }}
                    >
                      {getDayName(column.date)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ ...leftHeaderCellSx, top: 66, zIndex: 6, bgcolor: darkHeader }} />
                  {reportTable.columns.map((column) => (
                    <TableCell
                      key={`date-${column.index}`}
                      align="center"
                      sx={{ ...timelineCellSx, top: 66, zIndex: 5, bgcolor: darkHeader, color: "#fff", fontWeight: 900 }}
                    >
                      {getDayNumber(column.date)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ganttRows.map((row) => {
                  if (row.type !== "subtask") {
                    const isProject = row.type === "project";
                    const isScope = row.type === "scope";
                    return (
                      <TableRow key={row.key}>
                        <TableCell
                          sx={{
                            bgcolor: isProject || isScope ? darkHeader : navy,
                            color: "#fff",
                            border: `1px solid ${gridBorder}`,
                            fontWeight: 900,
                            textAlign: "center",
                            fontSize: 11,
                          }}
                        >
                          {row.itemNo}
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: isProject || isScope ? darkHeader : navy,
                            color: "#fff",
                            border: `1px solid ${gridBorder}`,
                            fontWeight: 900,
                            fontSize: isProject ? 12 : 11,
                            textTransform: isProject || isScope ? "uppercase" : "none",
                          }}
                        >
                          {row.title}
                        </TableCell>
                        <TableCell align="center" sx={{ bgcolor: isProject || isScope ? darkHeader : navy, color: "#fff", border: `1px solid ${gridBorder}`, fontSize: 11, fontWeight: 800 }}>
                          {row.progress ? `${row.progress.toFixed(0)}%` : ""}
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: isProject || isScope ? darkHeader : navy, color: "#fff", border: `1px solid ${gridBorder}`, fontSize: 11, fontWeight: 900 }}>
                          {row.amount ? row.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: isProject || isScope ? darkHeader : navy, color: "#fff", border: `1px solid ${gridBorder}`, fontSize: 11, fontWeight: 900 }}>
                          {row.budgetPercent ? `${row.budgetPercent.toFixed(2)}%` : ""}
                        </TableCell>
                        <TableCell sx={{ bgcolor: isProject || isScope ? darkHeader : navy, border: `1px solid ${gridBorder}` }} />
                        <TableCell colSpan={reportTable.columns.length} sx={{ bgcolor: isProject || isScope ? darkHeader : navy, height: 24, border: `1px solid ${gridBorder}` }} />
                      </TableRow>
                    );
                  }

                  const rows = [];
                  if (showProjected) {
                    rows.push(
                      <TableRow key={`${row.key}-projected`}>
                        <TableCell align="right" sx={{ border: `1px solid ${gridBorder}`, fontSize: 10, color: "#1f2937" }}>
                          {row.itemNo}
                        </TableCell>
                        <TableCell sx={{ border: `1px solid ${gridBorder}`, fontSize: 10, color: "#111827" }}>
                          {row.title}
                        </TableCell>
                        <TableCell align="center" sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }}>
                          {row.progress.toFixed(0)}%
                        </TableCell>
                        <TableCell align="right" sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }}>
                          {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }}>
                          {row.budgetPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell align="center" sx={{ border: `1px solid ${gridBorder}`, fontSize: 10, fontWeight: 800 }}>
                          PROJECTED
                        </TableCell>
                        {reportTable.columns.map((column) => {
                          const value = getProjectedCell(row, column.date, reportTable.columns);
                          return (
                            <TableCell
                              key={`${row.key}-projected-${column.index}`}
                              align="center"
                              title={getDisplayValue(value ?? undefined)}
                              sx={{
                                ...timelineCellSx,
                                bgcolor: value ? projectedColor : "#fff",
                                color: "#0f172a",
                                fontWeight: 800,
                              }}
                            >
                              {showProjectedPercent ? getDisplayValue(value ?? undefined) : ""}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  }

                  if (showActual) {
                    rows.push(
                      <TableRow key={`${row.key}-actual`}>
                        <TableCell sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }} />
                        <TableCell sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }} />
                        <TableCell sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }} />
                        <TableCell sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }} />
                        <TableCell align="right" sx={{ border: `1px solid ${gridBorder}`, fontSize: 10 }}>
                          {(row.budgetPercent * (row.progress / 100)).toFixed(2)}%
                        </TableCell>
                        <TableCell align="center" sx={{ border: `1px solid ${gridBorder}`, color: "#dc2626", fontSize: 10, fontWeight: 900 }}>
                          ACTUAL
                        </TableCell>
                        {reportTable.columns.map((column) => {
                          const value = getActualCell(row, column.date, reportTable.columns);
                          return (
                            <TableCell
                              key={`${row.key}-actual-${column.index}`}
                              align="center"
                              title={getDisplayValue(value ?? undefined)}
                              sx={{
                                ...timelineCellSx,
                                bgcolor: value ? actualColor : "#fff",
                                color: "#7f1d1d",
                                fontWeight: 800,
                                opacity: hasActualData(row) ? 1 : 0.75,
                              }}
                            >
                              {showActualPercent ? getDisplayValue(value ?? undefined) : ""}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  }

                  return rows;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
